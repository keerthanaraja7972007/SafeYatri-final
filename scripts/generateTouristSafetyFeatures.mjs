import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(projectRoot, 'src/data/real-world/safeyatri-real-world-data/raw');
const outputRoot = path.join(projectRoot, 'data/ml');
const touristJsonPath = path.join(projectRoot, 'public/data/realWorldTouristPlaces.json');
const emergencyJsonPath = path.join(projectRoot, 'public/data/realWorldEmergencyServices.json');
const seedPath = path.join(projectRoot, 'src/data/touristPlacesSeed.ts');
const earthRadiusKm = 6371.0088;

const identityColumns = [
  'place_id', 'place_name', 'district', 'latitude', 'longitude', 'place_category',
];
const provenanceColumns = ['place_source_url', 'weather_nearest_station_name'];
const facilityGroups = {
  police: {
    subtype: new Set(['Police Station']),
    columns: ['nearest_police_distance_km', 'police_count_1km', 'police_count_5km', 'police_count_10km'],
  },
  hospital: {
    subtype: new Set(['Government Hospital', 'Private Hospital']),
    columns: ['nearest_hospital_distance_km', 'hospital_count_1km', 'hospital_count_5km', 'hospital_count_10km'],
  },
  phc: {
    subtype: new Set(['Primary Health Centre / Clinic']),
    columns: ['nearest_phc_distance_km', 'phc_count_1km', 'phc_count_5km', 'phc_count_10km'],
  },
  fire: {
    subtype: new Set(['Fire and Rescue Station']),
    columns: ['nearest_fire_rescue_distance_km', 'fire_rescue_count_5km', 'fire_rescue_count_10km'],
  },
  ambulance: {
    subtype: new Set(['Ambulance Station']),
    columns: ['nearest_ambulance_distance_km', 'ambulance_count_5km', 'ambulance_count_10km'],
  },
};
const numericalFeatureColumns = [
  ...Object.values(facilityGroups).flatMap((group) => group.columns),
  'weather_nearest_station_distance_km',
  'weather_2024_nearest_station_mean_temperature_c',
  'weather_2024_nearest_station_mean_daily_precipitation_mm',
  'weather_2024_nearest_station_mean_daily_max_wind_speed_kmh',
  'weather_2024_nearest_station_mean_relative_humidity_pct',
  'district_domestic_footfall_share_pct',
  'district_foreign_footfall_share_pct',
  'place_site_annual_domestic_visitors_approx',
  'place_site_annual_foreign_visitors_approx',
  'district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k',
  'district_macro_road_accident_rate_2023_per_100k',
  'district_macro_theft_crime_rate_per_100k',
  'district_listed_historical_disaster_record_count',
];
const countFeatureColumns = [
  'police_count_1km', 'police_count_5km', 'police_count_10km',
  'hospital_count_1km', 'hospital_count_5km', 'hospital_count_10km',
  'phc_count_1km', 'phc_count_5km', 'phc_count_10km',
  'fire_rescue_count_5km', 'fire_rescue_count_10km',
  'ambulance_count_5km', 'ambulance_count_10km',
];
const distanceFeatureColumns = numericalFeatureColumns.filter((column) => column.endsWith('_distance_km'));
const allColumns = [...identityColumns, ...provenanceColumns, ...numericalFeatureColumns.filter((column) => !provenanceColumns.includes(column))];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hashFile(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function normalizePlaceName(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function serviceIdentity(place) {
  const name = String(place.name ?? '').split(',')[0];
  return `${normalizePlaceName(name)}|${String(place.district ?? '').trim().toLowerCase()}`;
}

async function loadSeedPlaces() {
  const source = fs.readFileSync(seedPath, 'utf8');
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`;
  const seedModule = await import(moduleUrl);
  return seedModule.touristPlacesSeed;
}

function parseCsv(text) {
  const records = [];
  let record = [];
  let field = '';
  let quoted = false;
  const input = text.replace(/^\uFEFF/, '');

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ',') {
      record.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      record.push(field);
      if (record.some((value) => value.length > 0)) records.push(record);
      record = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  const [headers, ...rows] = records;
  assert(headers?.length, 'CSV source is empty or has no header.');
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header.trim(), values[index] ?? ''])));
}

function readCsv(relativePath) {
  return parseCsv(fs.readFileSync(path.join(sourceRoot, relativePath), 'utf8'));
}

function numeric(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mean(values) {
  const present = values.map(numeric).filter((value) => value !== null);
  return present.length ? present.reduce((sum, value) => sum + value, 0) / present.length : null;
}

function haversineKm(latitudeA, longitudeA, latitudeB, longitudeB) {
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const latA = toRadians(latitudeA);
  const latB = toRadians(latitudeB);
  const deltaLat = latB - latA;
  const deltaLon = toRadians(longitudeB - longitudeA);
  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(latA) * Math.cos(latB) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

function rounded(value, digits = 3) {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function exactCanonicalLookup(rows, keyColumn, valueColumn, canonicalDistricts) {
  const values = new Map();
  const ambiguous = new Set();
  for (const row of rows) {
    const district = String(row[keyColumn] ?? '').trim();
    if (!canonicalDistricts.has(district)) continue;
    const value = numeric(row[valueColumn]);
    if (values.has(district)) ambiguous.add(district);
    else if (value !== null) values.set(district, value);
  }
  for (const district of ambiguous) values.delete(district);
  return values;
}

function countRepeatedKeys(rows, keyForRow) {
  const keys = rows.map(keyForRow);
  return keys.length - new Set(keys).size;
}

function addFacilityFeatures(place, facilitiesByGroup, result) {
  for (const [groupName, config] of Object.entries(facilityGroups)) {
    const pool = facilitiesByGroup[groupName];
    const prefix = groupName === 'fire' ? 'fire_rescue' : groupName;
    const nearestColumn = config.columns[0];
    const countColumns = config.columns.slice(1);
    if (!pool.length) {
      result[nearestColumn] = null;
      countColumns.forEach((column) => { result[column] = null; });
      continue;
    }

    let nearest = Infinity;
    const radiusCounts = countColumns.map(() => 0);
    const radiiKm = countColumns.map((column) => Number(column.match(/_(\d+)km$/)[1]));
    for (const facility of pool) {
      const distance = haversineKm(place.latitude, place.longitude, facility.latitude, facility.longitude);
      if (distance < nearest) nearest = distance;
      radiiKm.forEach((radius, index) => {
        if (distance <= radius) radiusCounts[index] += 1;
      });
    }

    result[nearestColumn] = rounded(nearest);
    countColumns.forEach((column, index) => { result[column] = radiusCounts[index]; });
    assert(prefix.length > 0, 'Facility feature prefix should not be empty.');
  }
}

function buildWeatherStations(dailyRows, hourlyRows) {
  const dailyGroups = new Map();
  for (const row of dailyRows) {
    const latitude = numeric(row.latitude);
    const longitude = numeric(row.longitude);
    if (latitude === null || longitude === null) continue;
    const key = `${row.location_name}|${latitude}|${longitude}`;
    if (!dailyGroups.has(key)) dailyGroups.set(key, { name: row.location_name, latitude, longitude, rows: [] });
    dailyGroups.get(key).rows.push(row);
  }

  const hourlyGroups = new Map();
  for (const row of hourlyRows) {
    const key = String(row.location_name ?? '');
    if (!hourlyGroups.has(key)) hourlyGroups.set(key, []);
    hourlyGroups.get(key).push(row);
  }

  return [...dailyGroups.values()].map((station) => {
    const hourly = hourlyGroups.get(station.name) ?? [];
    return {
      ...station,
      meanTemperature: mean(station.rows.map((row) => row.temperature_mean_c)),
      meanPrecipitation: mean(station.rows.map((row) => row.precipitation_sum_mm)),
      meanWind: mean(station.rows.map((row) => row.wind_speed_max_kmh)),
      meanHumidity: mean(hourly.map((row) => row.relative_humidity_pct)),
    };
  });
}

function addWeatherFeatures(place, stations, result) {
  let nearest = null;
  for (const station of stations) {
    const distance = haversineKm(place.latitude, place.longitude, station.latitude, station.longitude);
    if (!nearest || distance < nearest.distance) nearest = { station, distance };
  }
  result.weather_nearest_station_name = nearest?.station.name ?? null;
  result.weather_nearest_station_distance_km = rounded(nearest?.distance ?? null);
  result.weather_2024_nearest_station_mean_temperature_c = rounded(nearest?.station.meanTemperature ?? null);
  result.weather_2024_nearest_station_mean_daily_precipitation_mm = rounded(nearest?.station.meanPrecipitation ?? null);
  result.weather_2024_nearest_station_mean_daily_max_wind_speed_kmh = rounded(nearest?.station.meanWind ?? null);
  result.weather_2024_nearest_station_mean_relative_humidity_pct = rounded(nearest?.station.meanHumidity ?? null);
}

function buildSiteFootfallLookup(rows, canonicalDistricts) {
  const lookup = new Map();
  const ambiguous = new Set();
  for (const row of rows) {
    const district = String(row.district ?? '').trim();
    if (!canonicalDistricts.has(district)) continue;
    const key = `${normalizePlaceName(row.monument_name)}|${district}`;
    if (lookup.has(key)) ambiguous.add(key);
    else lookup.set(key, row);
  }
  for (const key of ambiguous) lookup.delete(key);
  return lookup;
}

function addContextFeatures(place, context, result) {
  const district = String(place.district ?? '').trim();
  const siteKey = `${normalizePlaceName(place.name)}|${district}`;
  const siteFootfall = context.siteFootfalls.get(siteKey);
  result.place_site_annual_domestic_visitors_approx = numeric(siteFootfall?.annual_domestic_visitors_approx);
  result.place_site_annual_foreign_visitors_approx = numeric(siteFootfall?.annual_foreign_visitors_approx);

  const exactDistrict = context.canonicalDistricts.has(district);
  result.district_domestic_footfall_share_pct = exactDistrict
    ? context.domesticFootfall.get(district) ?? null : null;
  result.district_foreign_footfall_share_pct = exactDistrict
    ? context.foreignFootfall.get(district) ?? null : null;
  result.district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k = exactDistrict
    ? context.crimeRate.get(district) ?? null : null;
  result.district_macro_road_accident_rate_2023_per_100k = exactDistrict
    ? context.roadAccidentRate.get(district) ?? null : null;
  result.district_macro_theft_crime_rate_per_100k = exactDistrict
    ? context.theftRate.get(district) ?? null : null;
  result.district_listed_historical_disaster_record_count = exactDistrict
    ? context.disasterCounts.get(district) ?? 0 : null;
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(rows) {
  return [allColumns.join(','), ...rows.map((row) => allColumns.map((column) => csvEscape(row[column])).join(','))].join('\n') + '\n';
}

function missingSummary(rows) {
  return allColumns.map((column) => ({
    column,
    missing: rows.filter((row) => row[column] === null || row[column] === undefined || row[column] === '').length,
  }));
}

function markdownTable(rows) {
  return rows.map(({ column, missing }) => `| \`${column}\` | ${missing} |`).join('\n');
}

function featureSourceLines() {
  const lines = [];
  for (const [group, config] of Object.entries(facilityGroups)) {
    const sourceType = [...config.subtype].join(', ');
    lines.push(`- ${config.columns.map((column) => `\`${column}\``).join(', ')}: \`public/data/realWorldEmergencyServices.json\`, selected by exact \`facility_subtype\` (${sourceType}); Haversine distance from POI coordinates.`);
  }
  lines.push('- `weather_nearest_station_distance_km`, `weather_nearest_station_name`, and four `weather_2024_nearest_station_*` metrics: daily/hourly weather CSVs; nearest coordinate hub, then arithmetic mean over available 2024 station observations.');
  lines.push('- `district_domestic_footfall_share_pct`, `district_foreign_footfall_share_pct`: `raw/tourism/tamil_nadu_district_tourist_arrivals_patterns.csv`, exact district key only when it matches the administrative district reference.');
  lines.push('- `place_site_annual_domestic_visitors_approx`, `place_site_annual_foreign_visitors_approx`: `raw/tourism/tamil_nadu_key_monuments_visitor_footfalls.csv`, exact normalized place-name and exact district join; ambiguous matches are null.');
  lines.push('- `district_macro_total_cognizable_crime_ipc_sll_rate_2023_per_100k`: `raw/crime/tn_district_complaints_ipc_sll_2021_2023.csv`, exact canonical district row; district-level context only.');
  lines.push('- `district_macro_road_accident_rate_2023_per_100k`: `raw/crime/tn_district_road_accidents_2023.csv`, exact canonical district row; district-level context only.');
  lines.push('- `district_macro_theft_crime_rate_per_100k`: `raw/crime/tn_district_theft_and_robbery_cases.csv`, exact canonical district row; district-level context only.');
  lines.push('- `district_listed_historical_disaster_record_count`: `raw/disasters/tamil_nadu_historical_disaster_records.csv`, count of records listing the exact canonical district in `affected_districts`; this is catalogue context, not a POI incident count.');
  return lines.join('\n');
}

function makeReport({ rows, places, seedCount, integratedCount, duplicateIds, duplicatePlaceKeys, duplicateServiceKeys, sources, hashes }) {
  const missing = missingSummary(rows);
  const totalMissing = missing.reduce((sum, entry) => sum + entry.missing, 0);
  const lines = [
    '# ML Tourist Safety Feature Dataset Report',
    '',
    '## Generation summary',
    '',
    `- Tourist places processed: ${places.length} (${seedCount} preserved seed records plus ${integratedCount} integrated JSON records after the service-style merge).`,
    `- Feature rows successfully generated: ${rows.length}.`,
    `- Duplicate tourist places: ${duplicateIds} duplicate place_id values and ${duplicatePlaceKeys} exact normalized name/district/coordinate duplicates.`,
    `- Repeated normalized name/district labels at different coordinates: ${duplicateServiceKeys}; these distinct source points were retained.`,
    `- Engineered numerical/context features: ${numericalFeatureColumns.length}.`,
    '- No UI, application behavior, original integrated data, or tourist seed data was modified.',
    '',
    '## Generated columns',
    '',
    '### Identity',
    ...identityColumns.map((column) => `- ${column}`),
    '',
    '### Provenance/reference',
    ...provenanceColumns.map((column) => `- ${column}`),
    '',
    '### Numerical/contextual features',
    ...numericalFeatureColumns.map((column) => `- ${column}`),
    '',
    '## Source mapping',
    '',
    featureSourceLines(),
    '- Identity fields and place_source_url: existing integrated tourist JSON, with the existing seed records included as the service fallback does; source URL is null where the seed has none.',
    '- District exact-join validation: raw/geographic/tamil_nadu_38_districts_administrative_boundaries.csv.',
    '- Emergency facility type/subtype and source provenance: public/data/realWorldEmergencyServices.json.',
    '',
    '## Distance and radius definitions',
    '',
    `- Point distances use the Haversine great-circle formula with Earth mean radius ${earthRadiusKm} km and source decimal latitude/longitude coordinates.`,
    '- nearest_*_distance_km is the minimum distance to any coordinate-valid facility in the exact facility subtype group; distances are rounded to 3 decimal places.',
    '- Radius counts include facilities at distance <= the named radius. Police, hospital, and PHC radii are 1, 5, and 10 km; fire/rescue and ambulance radii are 5 and 10 km.',
    '- Hospital counts include Government Hospital and Private Hospital subtypes, excluding Primary Health Centre / Clinic. PHC/clinic is counted separately.',
    '- Weather station assignment uses the nearest station coordinate in the daily 2024 file. Reported weather values are station-level arithmetic means over available 2024 daily/hourly rows, not measurements at the tourist place.',
    '',
    '## Missing-value counts',
    '',
    `Null/empty cells across all ${allColumns.length} output columns: ${totalMissing}.`,
    '',
    '| Column | Missing values |',
    '| --- | ---: |',
    ...missing.map(({ column, missing: count }) => `| ${column} | ${count} |`),
    '',
    'Unavailable / intentionally omitted data:',
    '',
    '- No tourist-place incident-level crime or safety outcomes were present; no POI incident features or target labels were created.',
    '- Crime and road-accident source tables contain district/city aggregates only. Only exact canonical district rows were attached, and their output names explicitly retain the district_macro_ scope.',
    '- The district tourist-arrivals table has no matching exact canonical district row for some places; those district shares are null, not zero.',
    '- Site-specific visitor counts are attached only for an exact normalized monument-name and district match. All other site-volume values remain null; no fuzzy name matching was used.',
    '- The available monument footfall file yielded no exact normalized name-and-district matches in the current catalog, so both site visitor features are null for all rows. Statewide visitor totals were omitted because they cannot be attributed to individual places.',
    '- Place-specific crime, road-accident, and disaster-event features could not be generated: the available sources provide district aggregates or broad affected-district lists, not incidents geocoded to tourist places.',
    '- The disaster source is a finite historical-record catalogue. A zero means no row in that available catalogue listed the exact canonical district; noncanonical district strings remain null.',
    '- Unmatched weather stations or missing source measurements remain null. No source fields were imputed.',
    '',
    '## Validation',
    '',
    `- Row cardinality equals the service-style tourist catalog: ${rows.length === places.length ? 'PASS' : 'FAIL'} (${rows.length} rows for ${places.length} places).`,
    `- Unique place_id: ${new Set(rows.map((row) => row.place_id)).size === rows.length ? 'PASS' : 'FAIL'}.`,
    `- Latitude/longitude ranges: ${rows.every((row) => row.latitude >= -90 && row.latitude <= 90 && row.longitude >= -180 && row.longitude <= 180) ? 'PASS' : 'FAIL'}.`,
    `- All non-null distance values are finite and nonnegative: ${rows.every((row) => distanceFeatureColumns.every((column) => row[column] === null || (Number.isFinite(row[column]) && row[column] >= 0))) ? 'PASS' : 'FAIL'}.`,
    `- All non-null radius counts are nonnegative integers: ${rows.every((row) => countFeatureColumns.every((column) => row[column] === null || (Number.isInteger(row[column]) && row[column] >= 0))) ? 'PASS' : 'FAIL'}.`,
    `- No NaN, Infinity, or invalid numeric values in JSON output: ${rows.every((row) => Object.values(row).every((value) => typeof value !== 'number' || Number.isFinite(value))) ? 'PASS' : 'FAIL'}.`,
    `- Original integrated tourist/emergency JSON byte hashes unchanged during generation: ${hashes.tourists === hashFile(touristJsonPath) && hashes.emergency === hashFile(emergencyJsonPath) ? 'PASS' : 'FAIL'}.`,
    '- No safe, unsafe, risk_label, risk_score, lower_risk, moderate_risk, or higher_risk target column was created; no ML model was trained.',
    '- No synthetic/fabricated data was added. Derived values use only source coordinates and recorded source values; unavailable values remain null.',
    '',
    '## Source files used',
    '',
    ...sources.map((source) => `- ${source}`),
  ];
  return lines.join('\n') + '\n';
}

async function main() {
  const initialHashes = {
    tourists: hashFile(touristJsonPath),
    emergency: hashFile(emergencyJsonPath),
  };
  const integratedPlaces = JSON.parse(fs.readFileSync(touristJsonPath, 'utf8'));
  const emergencyServices = JSON.parse(fs.readFileSync(emergencyJsonPath, 'utf8'));
  const seedPlaces = await loadSeedPlaces();
  const seedKeys = new Set(seedPlaces.map(serviceIdentity));
  const places = [...seedPlaces, ...integratedPlaces.filter((place) => !seedKeys.has(serviceIdentity(place)))];

  const facilitiesByGroup = Object.fromEntries(Object.keys(facilityGroups).map((group) => [group, []]));
  const invalidFacilityCoordinateCounts = Object.fromEntries(Object.keys(facilityGroups).map((group) => [group, 0]));
  for (const facility of emergencyServices) {
    const group = Object.entries(facilityGroups).find(([, config]) => config.subtype.has(facility.facility_subtype))?.[0];
    if (!group) continue;
    const latitude = numeric(facility.latitude);
    const longitude = numeric(facility.longitude);
    if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      invalidFacilityCoordinateCounts[group] += 1;
      continue;
    }
    facilitiesByGroup[group].push({ latitude, longitude });
  }
  assert(Object.values(invalidFacilityCoordinateCounts).every((count) => count === 0), 'An emergency facility has invalid coordinates; facility proximity cannot be treated as complete.');

  const dailyWeather = readCsv('weather/tamil_nadu_historical_weather_daily_2024.csv');
  const hourlyWeather = readCsv('weather/tamil_nadu_historical_weather_hourly_2024.csv');
  const stations = buildWeatherStations(dailyWeather, hourlyWeather);
  const canonicalRows = readCsv('geographic/tamil_nadu_38_districts_administrative_boundaries.csv');
  const canonicalDistricts = new Set(canonicalRows.map((row) => String(row.district_name ?? '').trim()).filter(Boolean));
  const arrivals = readCsv('tourism/tamil_nadu_district_tourist_arrivals_patterns.csv');
  const domesticFootfall = exactCanonicalLookup(arrivals, 'district', 'domestic_footfall_share_pct', canonicalDistricts);
  const foreignFootfall = exactCanonicalLookup(arrivals, 'district', 'foreign_footfall_share_pct', canonicalDistricts);
  const siteFootfalls = buildSiteFootfallLookup(readCsv('tourism/tamil_nadu_key_monuments_visitor_footfalls.csv'), canonicalDistricts);
  const crimeRate = exactCanonicalLookup(
    readCsv('crime/tn_district_complaints_ipc_sll_2021_2023.csv'),
    'Districts/City',
    'Rate of Total Cognizable Crime (IPC+SLL) (2023)',
    canonicalDistricts,
  );
  const roadAccidentRate = exactCanonicalLookup(
    readCsv('crime/tn_district_road_accidents_2023.csv'),
    'Districts/City',
    'Road Accidents - Rate',
    canonicalDistricts,
  );
  const theftRate = exactCanonicalLookup(
    readCsv('crime/tn_district_theft_and_robbery_cases.csv'),
    'District',
    'Theft - Crime Rate ( R)',
    canonicalDistricts,
  );
  const disasterCounts = new Map([...canonicalDistricts].map((district) => [district, 0]));
  for (const event of readCsv('disasters/tamil_nadu_historical_disaster_records.csv')) {
    for (const affectedDistrict of String(event.affected_districts ?? '').split(',').map((value) => value.trim())) {
      if (disasterCounts.has(affectedDistrict)) disasterCounts.set(affectedDistrict, disasterCounts.get(affectedDistrict) + 1);
    }
  }
  const context = { canonicalDistricts, domesticFootfall, foreignFootfall, siteFootfalls, crimeRate, roadAccidentRate, theftRate, disasterCounts };

  const rows = places.map((place) => {
    const latitude = numeric(place.latitude);
    const longitude = numeric(place.longitude);
    assert(latitude !== null && latitude >= -90 && latitude <= 90, `Invalid latitude for ${place.id}.`);
    assert(longitude !== null && longitude >= -180 && longitude <= 180, `Invalid longitude for ${place.id}.`);
    const row = {
      place_id: place.id,
      place_name: place.name,
      district: place.district,
      latitude,
      longitude,
      place_category: place.category,
      place_source_url: place.source_url ?? null,
    };
    addFacilityFeatures({ latitude, longitude }, facilitiesByGroup, row);
    addWeatherFeatures({ latitude, longitude }, stations, row);
    addContextFeatures(place, context, row);
    return row;
  });

  const duplicateIds = countRepeatedKeys(rows, (row) => row.place_id);
  const duplicatePlaceKeys = countRepeatedKeys(rows, (row) => `${normalizePlaceName(row.place_name)}|${row.district}|${row.latitude}|${row.longitude}`);
  const duplicateServiceKeys = countRepeatedKeys(places, serviceIdentity);
  assert(duplicateIds === 0, `Duplicate place_id values found: ${duplicateIds}.`);
  assert(rows.length === places.length, 'Generated row count does not match the merged tourist catalog.');
  assert(rows.every((row) => distanceFeatureColumns.every((column) => row[column] === null || (Number.isFinite(row[column]) && row[column] >= 0))), 'Invalid distance feature found.');
  assert(rows.every((row) => countFeatureColumns.every((column) => row[column] === null || (Number.isInteger(row[column]) && row[column] >= 0))), 'Invalid count feature found.');
  assert(rows.every((row) => Object.values(row).every((value) => typeof value !== 'number' || Number.isFinite(value))), 'NaN or infinite numeric value found.');

  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, 'tourist_safety_features.csv'), writeCsv(rows), 'utf8');
  fs.writeFileSync(path.join(outputRoot, 'tourist_safety_features.json'), `${JSON.stringify(rows, null, 2)}\n`, 'utf8');

  const sourcePaths = [
    'public/data/realWorldTouristPlaces.json',
    'public/data/realWorldEmergencyServices.json',
    'src/data/touristPlacesSeed.ts',
    'src/data/real-world/safeyatri-real-world-data/raw/weather/tamil_nadu_historical_weather_daily_2024.csv',
    'src/data/real-world/safeyatri-real-world-data/raw/weather/tamil_nadu_historical_weather_hourly_2024.csv',
    'src/data/real-world/safeyatri-real-world-data/raw/tourism/tamil_nadu_district_tourist_arrivals_patterns.csv',
    'src/data/real-world/safeyatri-real-world-data/raw/tourism/tamil_nadu_key_monuments_visitor_footfalls.csv',
    'src/data/real-world/safeyatri-real-world-data/raw/crime/tn_district_complaints_ipc_sll_2021_2023.csv',
    'src/data/real-world/safeyatri-real-world-data/raw/crime/tn_district_road_accidents_2023.csv',
    'src/data/real-world/safeyatri-real-world-data/raw/crime/tn_district_theft_and_robbery_cases.csv',
    'src/data/real-world/safeyatri-real-world-data/raw/disasters/tamil_nadu_historical_disaster_records.csv',
    'src/data/real-world/safeyatri-real-world-data/raw/geographic/tamil_nadu_38_districts_administrative_boundaries.csv',
  ];
  const finalHashes = {
    tourists: hashFile(touristJsonPath),
    emergency: hashFile(emergencyJsonPath),
  };
  assert(initialHashes.tourists === finalHashes.tourists && initialHashes.emergency === finalHashes.emergency, 'An original integrated tourist or emergency dataset changed during generation.');

  const report = makeReport({
    rows,
    places,
    seedCount: seedPlaces.length,
    integratedCount: places.length - seedPlaces.length,
    duplicateIds,
    duplicatePlaceKeys,
    duplicateServiceKeys,
    sources: sourcePaths,
    hashes: initialHashes,
  });
  assert(typeof report === 'string', 'Report generation did not return text.');
  fs.writeFileSync(path.join(projectRoot, 'ML_FEATURE_DATASET_REPORT.md'), report, 'utf8');
  console.log(JSON.stringify({
    rows: rows.length,
    numericalFeatures: numericalFeatureColumns.length,
    totalColumns: allColumns.length,
    duplicatePlaceIds: duplicateIds,
    repeatedExactPlaceKeys: duplicatePlaceKeys,
    repeatedNormalizedNameDistrictKeys: duplicateServiceKeys,
    missingValues: missingSummary(rows).filter((entry) => entry.missing > 0),
    sourceHashesUnchanged: initialHashes.tourists === finalHashes.tourists && initialHashes.emergency === finalHashes.emergency,
    outputs: [
      path.relative(projectRoot, path.join(outputRoot, 'tourist_safety_features.csv')),
      path.relative(projectRoot, path.join(outputRoot, 'tourist_safety_features.json')),
      'ML_FEATURE_DATASET_REPORT.md',
    ],
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});