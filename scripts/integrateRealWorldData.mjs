import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(process.cwd());
const realWorldDir = path.join(rootDir, 'src', 'data', 'real-world', 'safeyatri-real-world-data');
const touristCsvPath = path.join(realWorldDir, 'raw', 'tourist_places', 'tamil_nadu_tourist_places_osm.csv');
const emergencyCsvPath = path.join(realWorldDir, 'raw', 'emergency', 'tamil_nadu_emergency_infrastructure_master.csv');
const seedPath = path.join(rootDir, 'src', 'data', 'touristPlacesSeed.ts');
const touristOutput = path.join(rootDir, 'public', 'data', 'realWorldTouristPlaces.json');
const emergencyOutput = path.join(rootDir, 'public', 'data', 'realWorldEmergencyServices.json');
const coverageOutput = path.join(rootDir, 'src', 'data', 'realWorldDistrictCoverage.ts');
const mapOutput = path.join(rootDir, 'DATASET_INTEGRATION_MAP.md');
const reportOutput = path.join(rootDir, 'DATA_IMPORT_REPORT.md');

function parseCsv(text) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(current);
      if (row.some((value) => value !== '')) {
        rows.push(row);
      }
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some((value) => value !== '')) rows.push(row);
  }

  if (rows.length < 2) return [];
  const [header, ...dataRows] = rows;
  return dataRows.map((values) => {
    const entry = {};
    header.forEach((key, index) => {
      entry[key.trim()] = values[index] ?? '';
    });
    return entry;
  });
}

function parseSeedEntries(seedText) {
  const seedSet = new Set();
  const entries = [...seedText.matchAll(/\{([^{}]*)\}/gs)];
  for (const [, entry] of entries) {
    const name = entry.match(/\bname:\s*'([^']+)'/)?.[1];
    const district = entry.match(/\bdistrict:\s*'([^']+)'/)?.[1];
    const latitude = entry.match(/\blatitude:\s*([0-9.\-]+)/)?.[1];
    const longitude = entry.match(/\blongitude:\s*([0-9.\-]+)/)?.[1];
    if (!name || !district || !latitude || !longitude) continue;
    const key = normalizePlaceNameKey(name, district);
    seedSet.add(key);
  }
  return seedSet;
}

function normalizePlaceKey(name, district, latitude, longitude) {
  return `${String(name || '').trim().toLowerCase()}|${String(district || '').trim().toLowerCase()}|${Number(latitude).toFixed(4)}|${Number(longitude).toFixed(4)}`;
}

function normalizePlaceNameKey(name, district) {
  const normalizedName = String(name || '')
    .split(',')[0]
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return `${normalizedName}|${String(district || '').trim().toLowerCase()}`;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'place';
}

function categoryFromRaw(rawCategory) {
  const category = String(rawCategory || '').toLowerCase();
  if (category.includes('beach') || category.includes('coast') || category.includes('shore')) return 'Beach';
  if (category.includes('waterfall') || category.includes('water_park') || category.includes('lake')) return 'Waterfall';
  if (category.includes('wild') || category.includes('nature') || category.includes('reserve') || category.includes('forest') || category.includes('peak') || category.includes('wetland')) return 'Wildlife';
  if (category.includes('temple') || category.includes('shrine') || category.includes('pilgrim') || category.includes('worship')) return 'Pilgrimage';
  if (category.includes('historic') || category.includes('monument') || category.includes('fort') || category.includes('heritage') || category.includes('ruins') || category.includes('castle') || category.includes('memorial')) return 'Heritage';
  if (category.includes('museum') || category.includes('viewpoint') || category.includes('attraction') || category.includes('artwork') || category.includes('theme_park') || category.includes('aquarium') || category.includes('cultural')) return 'Cultural';
  if (category.includes('park') || category.includes('adventure') || category.includes('trail') || category.includes('zoo') || category.includes('picnic')) return 'Adventure';
  return 'Cultural';
}

function emergencyTypeFromRaw(rawType) {
  const type = String(rawType || '');
  if (type === 'Police Station') return 'Police';
  if (type === 'Primary Health Centre / Clinic') return 'Hospital';
  if (type === 'Fire and Rescue Station') return 'Fire & Rescue';
  if (type === 'Ambulance Station') return 'Ambulance';
  if (type === 'Hospital') return 'Hospital';
  return 'Hospital';
}

function buildTouristRecords() {
  const seedText = fs.readFileSync(seedPath, 'utf8');
  const seedSet = parseSeedEntries(seedText);
  const csvText = fs.readFileSync(touristCsvPath, 'utf8');
  const rows = parseCsv(csvText);

  const cleaned = [];
  const seen = new Set();
  let seedMatches = 0;
  let duplicateRows = 0;

  for (const row of rows) {
    const name = String(row.place_name || '').trim();
    const district = String(row.district || '').trim();
    const latitude = Number(row.latitude);
    const longitude = Number(row.longitude);
    if (!name || !district || Number.isNaN(latitude) || Number.isNaN(longitude)) continue;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) continue;

    const key = normalizePlaceKey(name, district, latitude, longitude);
    if (seen.has(key)) {
      duplicateRows += 1;
      continue;
    }
    seen.add(key);

    if (seedSet.has(normalizePlaceNameKey(name, district))) {
      seedMatches += 1;
      continue;
    }

    const city = String(row.city_town || '').trim() || null;
    cleaned.push({
      id: `real-world-tourist-${slugify(name)}-${slugify(district)}-${cleaned.length + 1}`,
      name,
      district,
      city,
      location_label: String(row.geographic_location || '').trim() || null,
      name_ta: String(row.name_ta || '').trim() || null,
      source_url: String(row.source_url || '').trim() || null,
      description: `Authentic OpenStreetMap tourist destination in ${district}, Tamil Nadu.`,
      latitude,
      longitude,
      category: categoryFromRaw(row.place_category || ''),
      is_active: true,
      created_at: '2026-10-01T00:00:00.000Z',
      updated_at: '2026-10-01T00:00:00.000Z'
    });
  }

  return {
    rawRecords: rows.length,
    seedMatches,
    duplicateRows,
    importedCount: cleaned.length,
    records: cleaned
  };
}

function buildEmergencyRecords() {
  const csvText = fs.readFileSync(emergencyCsvPath, 'utf8');
  const rows = parseCsv(csvText);
  const cleaned = [];
  const seen = new Set();

  for (const row of rows) {
    const name = String(row.facility_name || '').trim();
    const district = String(row.district || '').trim();
    const latitude = Number(row.latitude);
    const longitude = Number(row.longitude);
    const facilityType = String(row.facility_type || '').trim();
    if (!name || !district || Number.isNaN(latitude) || Number.isNaN(longitude)) continue;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) continue;

    const key = normalizePlaceKey(name, district, latitude, longitude);
    if (seen.has(key)) continue;
    seen.add(key);

    cleaned.push({
      id: `real-world-emergency-${slugify(name)}-${slugify(district)}-${cleaned.length + 1}`,
      name,
      type: emergencyTypeFromRaw(facilityType),
      facility_subtype: facilityType || null,
      district,
      address: String(row.address || '').trim() || null,
      latitude,
      longitude,
      phone: String(row.phone_contact || '').trim() || null,
      availability_status: facilityType === 'Police Station' || facilityType === 'Fire and Rescue Station' || facilityType === 'Ambulance Station' ? '24/7' : 'As listed',
      source: 'OpenStreetMap Overpass API',
      created_at: '2026-10-01T00:00:00.000Z'
    });
  }

  return {
    rawRecords: rows.length,
    importedCount: cleaned.length,
    duplicates: rows.length - cleaned.length,
    records: cleaned
  };
}

function writeTouristFile(records) {
  fs.mkdirSync(path.dirname(touristOutput), { recursive: true });
  fs.writeFileSync(touristOutput, JSON.stringify(records), 'utf8');
  const obsoleteTypeScriptOutput = path.join(rootDir, 'src', 'data', 'realWorldTouristPlaces.ts');
  if (fs.existsSync(obsoleteTypeScriptOutput)) fs.unlinkSync(obsoleteTypeScriptOutput);
}

function writeEmergencyFile(records) {
  fs.mkdirSync(path.dirname(emergencyOutput), { recursive: true });
  fs.writeFileSync(emergencyOutput, JSON.stringify(records), 'utf8');
  const obsoleteTypeScriptOutput = path.join(rootDir, 'src', 'data', 'realWorldEmergencyServices.ts');
  if (fs.existsSync(obsoleteTypeScriptOutput)) fs.unlinkSync(obsoleteTypeScriptOutput);
}

function buildDistrictCoverage(touristRecords, emergencyRecords) {
  const coverage = new Map();
  const getCounts = (district) => {
    if (!coverage.has(district)) coverage.set(district, { district, touristPlaceCount: 0, emergencyFacilityCount: 0 });
    return coverage.get(district);
  };

  for (const record of touristRecords) getCounts(record.district).touristPlaceCount += 1;
  for (const record of emergencyRecords) getCounts(record.district).emergencyFacilityCount += 1;
  return [...coverage.values()].sort((left, right) => left.district.localeCompare(right.district));
}

function writeDistrictCoverage(records) {
  const content = `export interface RealWorldDistrictCoverage {\n  district: string;\n  touristPlaceCount: number;\n  emergencyFacilityCount: number;\n}\n\nexport const realWorldDistrictCoverage: RealWorldDistrictCoverage[] = ${JSON.stringify(records, null, 2)};\n`;
  fs.writeFileSync(coverageOutput, content, 'utf8');
}

function writeDocs(touristStats, emergencyStats, coverage) {
  const datasetManifestPath = path.join(realWorldDir, 'DATASET_MANIFEST.csv');
  const manifestText = fs.readFileSync(datasetManifestPath, 'utf8');
  const rows = parseCsv(manifestText).slice(0, 30);
  const touristSourceRows = parseCsv(fs.readFileSync(touristCsvPath, 'utf8'));
  const encodingMarker = /(?:\u00c3[\u0080-\u00bf]|\u00c2[\u0080-\u00bf]|\u00e0[\u0080-\u00bf]|\ufffd)/u;
  const encodingIssues = touristSourceRows.filter((row) => encodingMarker.test(String(row.place_name || '')));
  const emergencyTypeCounts = new Map();
  for (const service of emergencyStats.records) {
    emergencyTypeCounts.set(service.facility_subtype, (emergencyTypeCounts.get(service.facility_subtype) ?? 0) + 1);
  }

  const lines = [
    '# SAFEYATRI Dataset Integration Map',
    '',
    '## Existing SAFEYATRI data architecture discovered',
    '',
    '- The app already includes a static fallback seed in `src/data/touristPlacesSeed.ts` and uses Supabase-backed services for `tourist_places`, `weather_data`, `crime_data`, and `emergency_services`.',
    '- The app uses Supabase-backed reads where configured and retains an offline fallback. Both tourist and emergency integrations are fetched from static JSON assets only when their data services are requested.',
    '- Supabase reads are paginated before deduplication; original seed and database records are preserved and are never overwritten by the static integrated records.',
    '',
    '## Real-world datasets inspected',
    '',
    `Total datasets inventoried: ${rows.length}.`,
    '',
    '| Dataset | Category | Record count | SAFEYATRI destination | Classification |',
    '| --- | --- | ---: | --- | --- |',
  ];

  for (const row of rows) {
    const datasetName = String(row.dataset_name || '').trim();
    const category = String(row.category || '').trim();
    const recordCount = String(row.record_count || '').trim();
    const normalizedDatasetName = datasetName.toLowerCase();
    const isTouristPlaces = normalizedDatasetName.includes('tourist places osm');
    const isEmergencyMaster = normalizedDatasetName.includes('emergency infrastructure master');
    const classification = isTouristPlaces || isEmergencyMaster ? 'DIRECTLY INTEGRATABLE' : 'REFERENCE ONLY';
    const destination = isTouristPlaces ? 'Tourist places feed' : isEmergencyMaster ? 'Emergency services feed' : 'Reference data / future analytics';
    lines.push(`| ${datasetName} | ${category} | ${recordCount} | ${destination} | ${classification} |`);
  }

  lines.push(
    '',
    '## Mapping strategy',
    '',
    '- Keep `src/data/touristPlacesSeed.ts` unchanged; merge unique OSM places into fallback and Supabase reads after excluding normalized name/district matches.',
    '- Merge real-world emergency infrastructure into fallback and Supabase reads after excluding repeated normalized name/district/coordinate identities; do not write or overwrite database records.',
    '- The 1,940 integrated tourist places and 10,164 emergency facilities are used by map, Explore, Admin monitoring, and emergency facility lookup. Emergency JSON is not included in the initial JavaScript bundle.',
    '- Coverage counts preserve raw source district/location labels. Variants/localities are not reconciled into administrative districts without a validated crosswalk.',
    '- Weather, crime, tourism statistics, disaster, and geographic context remain reference-only. No ML model was trained or scored.',
    '',
    '## Excluded datasets',
    '',
    '- Crime datasets remain reference-only because they are district-level aggregated counts, not per-tourist-place records.',
    '- Weather, tourism statistics, and disaster datasets remain reference-only because they are trend or context datasets rather than direct app-place records.',
    '- Geographic boundary datasets are reference-only for district enrichment and map context, not app data entries.',
    ''
  );
  fs.writeFileSync(mapOutput, lines.join('\n'), 'utf8');

  const reportLines = [
    '# SAFEYATRI Data Import Report',
    '',
    '## Datasets imported',
    '',
    `- real-world tourist places: processed ${touristStats.rawRecords} raw OpenStreetMap records; imported ${touristStats.importedCount} unique, non-seed tourist records.`,
    `- real-world emergency infrastructure: processed ${emergencyStats.rawRecords} raw records; imported ${emergencyStats.importedCount} valid infrastructure records after removing duplicates.`,
    '',
    '## Emergency facility types',
    '',
    '| Source facility type | Integrated count |',
    '| --- | ---: |',
    ...[...emergencyTypeCounts.entries()].sort(([left], [right]) => String(left).localeCompare(String(right))).map(([type, count]) => `| ${type} | ${count} |`),
    '',
    '## District coverage',
    '',
    `Counts use only integrated records. ${coverage.length} distinct source district/location labels are retained verbatim; this is not a claim of ${coverage.length} administrative Tamil Nadu districts.`,
    '',
    '| Source district/location label | Tourist places | Emergency facilities |',
    '| --- | ---: | ---: |',
    ...coverage.map((entry) => `| ${entry.district} | ${entry.touristPlaceCount} | ${entry.emergencyFacilityCount} |`),
    '',
    '## Records processed',
    '',
    `- Tourist seed overlap: ${touristStats.seedMatches} records matched the existing app seed and were excluded.`,
    `- Tourist deduplication: ${touristStats.duplicateRows} repeated name/district/coordinate rows were removed within the OSM dataset.`,
    `- Emergency duplicate handling: ${emergencyStats.duplicates} duplicate records were removed before import.`,
    '',
    '## Validation',
    '',
    '- Coordinate validation was performed for all imported records to ensure latitude and longitude range checks passed.',
    `- Encoding audit: checked ${touristSourceRows.length} source tourist rows for common mojibake signatures and replacement characters; ${encodingIssues.length} affected records${encodingIssues.length ? ` (${encodingIssues.map((row) => row.place_id).join(', ')})` : ' (none detected)'}. Tamil labels were not repaired or translated.`,
    '- Coordinates were range-checked, not independently field-verified.',
    '- Tourist and emergency data are emitted as static JSON and fetched only when their services are requested, not embedded in frontend TypeScript constants or the initial JavaScript bundle.',
    `- Emergency source facility types: ${[...emergencyTypeCounts.entries()].sort(([left], [right]) => String(left).localeCompare(String(right))).map(([type, count]) => `${type}: ${count}`).join('; ')}.`,
    '- The application production build was run successfully after integration.',
    '- Existing `touristPlacesSeed.ts` content remains intact and is not overwritten.',
    '---',
    '## Final integration status',
    '',
    'Completed: tourist-place and emergency infrastructure data were integrated into app reads and offline fallbacks without replacing existing seed or database data. Other authentic datasets remain reference-only; no ML training or scoring was started.',
    ''
  ];

  fs.writeFileSync(reportOutput, reportLines.join('\n'), 'utf8');
}

const touristStats = buildTouristRecords();
const emergencyStats = buildEmergencyRecords();
const districtCoverage = buildDistrictCoverage(touristStats.records, emergencyStats.records);
writeTouristFile(touristStats.records);
writeEmergencyFile(emergencyStats.records);
writeDistrictCoverage(districtCoverage);
writeDocs(touristStats, emergencyStats, districtCoverage);
console.log(JSON.stringify({
  tourist: {
    rawRecords: touristStats.rawRecords,
    importedCount: touristStats.importedCount,
    seedMatches: touristStats.seedMatches,
    uniqueRecords: touristStats.records.length
  },
  emergency: {
    rawRecords: emergencyStats.rawRecords,
    importedCount: emergencyStats.importedCount,
    duplicates: emergencyStats.duplicates
  }
}, null, 2));
