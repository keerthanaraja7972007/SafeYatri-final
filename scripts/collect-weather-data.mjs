import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const SOURCE = 'Open-Meteo';
const DATASET_NAME = 'weather_data';
const HISTORICAL_PERIOD = {
  startDate: '2025-01-01',
  endDate: '2025-12-31',
};
const EXPECTED_TOURIST_PLACE_COUNT = 18;
const INSERT_BATCH_SIZE = 500;
const INSERT_RETRY_DELAYS_MS = [1000, 2000, 4000];
const OPEN_METEO_ENDPOINT = 'https://archive-api.open-meteo.com/v1/archive';

loadDotEnv();

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL or VITE_SUPABASE_URL.');
}

if (!serviceRoleKey) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY. Set it in the server environment or project .env file; never expose it in frontend code.'
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const metrics = {
  attempted: 0,
  inserted: 0,
  skipped: 0,
  failed: 0,
  failedPlaces: [],
  skipReasons: new Map(),
};

let importId = null;

try {
  const places = await loadTouristPlaces();
  const existingKeys = await loadExistingObservationKeys();

  importId = await createImportRecord();
  console.log(`Collecting ${SOURCE} weather data for ${places.length} Tamil Nadu tourist places.`);
  console.log(`Historical period: ${HISTORICAL_PERIOD.startDate} through ${HISTORICAL_PERIOD.endDate}.`);

  for (const place of places) {
    try {
      const collection = await collectPlaceWeather(place);
      const observations = collection.observations;
      metrics.attempted += collection.attempted;

      const newObservations = [];
      for (const observation of observations) {
        const key = observationKey(observation);
        if (existingKeys.has(key)) {
          metrics.skipped += 1;
          addSkipReason('duplicate observation');
          continue;
        }

        existingKeys.add(key);
        newObservations.push(observation);
      }

      const inserted = await insertObservations(newObservations);
      metrics.inserted += inserted;
      metrics.failed += newObservations.length - inserted;
      console.log(`${place.name}: ${collection.attempted} attempted, ${inserted} inserted.`);
    } catch (error) {
      metrics.failed += 1;
      metrics.failedPlaces.push(`${place.name}: ${errorMessage(error)}`);
      console.error(`${place.name}: collection failed: ${errorMessage(error)}`);
    }
  }

  await updateImportRecord(metrics.failed > 0 ? 'Failed' : 'Completed');
  printSummary();
} catch (error) {
  if (importId) {
    await updateImportRecord('Failed').catch(() => undefined);
  }
  console.error(`Weather collection failed: ${errorMessage(error)}`);
  process.exitCode = 1;
}

async function loadTouristPlaces() {
  const { data, error } = await supabase
    .from('tourist_places')
    .select('id, name, district, latitude, longitude')
    .eq('is_active', true)
    .order('name');

  if (error) throw new Error(errorMessage(error, { operation: 'load tourist places', table: 'tourist_places' }));
  if (!data || data.length !== EXPECTED_TOURIST_PLACE_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_TOURIST_PLACE_COUNT} active tourist places, found ${data?.length ?? 0}. No weather collection was started.`
    );
  }

  for (const place of data) {
    if (!place.id || !place.district || !isFiniteNumber(place.latitude) || !isFiniteNumber(place.longitude)) {
      throw new Error(`Tourist place ${place.name ?? '(unnamed)'} is missing a valid id, district, latitude, or longitude.`);
    }
  }

  return data;
}

async function loadExistingObservationKeys() {
  const keys = new Set();
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(DATASET_NAME)
      .select('tourist_place_id, recorded_at')
      .not('tourist_place_id', 'is', null)
      .range(from, from + pageSize - 1);

    if (error) throw new Error(errorMessage(error, { operation: 'load existing weather observations', table: DATASET_NAME }));
    for (const row of data ?? []) {
      keys.add(`${row.tourist_place_id}|${normalizeTimestamp(row.recorded_at)}`);
    }
    if (!data || data.length < pageSize) break;
  }

  return keys;
}

async function collectPlaceWeather(place) {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    start_date: HISTORICAL_PERIOD.startDate,
    end_date: HISTORICAL_PERIOD.endDate,
    hourly: 'temperature_2m,relative_humidity_2m,precipitation,visibility,wind_speed_10m,weather_code',
    timezone: 'UTC',
  });

  const response = await fetch(`${OPEN_METEO_ENDPOINT}?${params}`);
  if (!response.ok) {
    throw new Error(errorMessage({ status: response.status, statusText: response.statusText }, {
      operation: 'fetch historical weather observations',
      endpoint: OPEN_METEO_ENDPOINT,
    }));
  }

  const payload = await response.json();
  const hourly = payload.hourly;
  if (!hourly || !Array.isArray(hourly.time)) {
    throw new Error('Open-Meteo response did not contain hourly observations.');
  }

  const observations = [];
  for (let index = 0; index < hourly.time.length; index += 1) {
    const values = {
      temperature: hourly.temperature_2m?.[index],
      humidity: hourly.relative_humidity_2m?.[index],
      precipitation: hourly.precipitation?.[index],
      visibilityMeters: hourly.visibility?.[index],
      windSpeed: hourly.wind_speed_10m?.[index],
      weatherCode: hourly.weather_code?.[index],
    };
    const observation = buildObservation(place, hourly.time[index], values);
    if (!observation) {
      metrics.skipped += 1;
      addSkipReason('missing or invalid required observation value');
      continue;
    }
    observations.push(observation);
  }

  return { observations, attempted: hourly.time.length };
}

function buildObservation(place, timestamp, values) {
  const date = new Date(`${timestamp}Z`);
  const visibility = isFiniteNumber(values.visibilityMeters) ? values.visibilityMeters / 1000 : null;
  const valid =
    !Number.isNaN(date.getTime()) &&
    isFiniteNumber(values.temperature) && values.temperature >= -100 && values.temperature <= 100 &&
    isFiniteNumber(values.humidity) && values.humidity >= 0 && values.humidity <= 100 &&
    isFiniteNumber(values.precipitation) && values.precipitation >= 0 &&
    (visibility === null || (isFiniteNumber(visibility) && visibility >= 0)) &&
    isFiniteNumber(values.windSpeed) && values.windSpeed >= 0 &&
    Number.isInteger(values.weatherCode) && values.weatherCode >= 0 && values.weatherCode <= 99;

  if (!valid) return null;

  return {
    tourist_place_id: place.id,
    district: place.district,
    recorded_at: date.toISOString(),
    temperature: values.temperature,
    humidity: values.humidity,
    precipitation: values.precipitation,
    visibility,
    wind_speed: values.windSpeed,
    weather_code: String(values.weatherCode),
    source: SOURCE,
  };
}

async function insertObservations(observations) {
  let inserted = 0;
  for (let index = 0; index < observations.length; index += INSERT_BATCH_SIZE) {
    const batch = observations.slice(index, index + INSERT_BATCH_SIZE);
    if (batch.length === 0) continue;

    for (let attempt = 0; attempt <= INSERT_RETRY_DELAYS_MS.length; attempt += 1) {
      if (attempt > 0) {
        const existingCount = await countExistingBatchRecords(batch);
        if (existingCount === null) {
          console.error('Could not verify whether the previous insert succeeded; not retrying this batch.');
          break;
        }
        if (existingCount === batch.length) {
          inserted += existingCount;
          break;
        }
        if (existingCount > 0) {
          inserted += existingCount;
          break;
        }

        await delay(INSERT_RETRY_DELAYS_MS[attempt - 1]);
        console.error(`Insert batch failed. Retrying ${attempt}/${INSERT_RETRY_DELAYS_MS.length}...`);
      }

      const { data, error } = await supabase
        .from(DATASET_NAME)
        .insert(batch)
        .select('id');
      if (!error) {
        inserted += data?.length ?? 0;
        break;
      }

      console.error(`Insert batch failed (${batch.length} records): ${errorMessage(error, {
        operation: 'insert weather observations',
        table: DATASET_NAME,
      })}`);

      if (!isTransientInsertError(error) || attempt === INSERT_RETRY_DELAYS_MS.length) {
        break;
      }
    }
  }
  return inserted;
}

async function countExistingBatchRecords(batch) {
  const touristPlaceId = batch[0]?.tourist_place_id;
  const timestamps = batch.map((observation) => observation.recorded_at);
  const { data, error } = await supabase
    .from(DATASET_NAME)
    .select('tourist_place_id, recorded_at')
    .eq('tourist_place_id', touristPlaceId)
    .in('recorded_at', timestamps);

  if (error) return null;

  const existingKeys = new Set(
    (data ?? []).map((observation) => observationKey(observation))
  );
  return batch.filter((observation) => existingKeys.has(observationKey(observation))).length;
}

function isTransientInsertError(error) {
  const status = Number(error?.status);
  const message = error instanceof Error ? error.message : String(error?.message ?? error);
  return message.toLowerCase().includes('fetch failed') || status === 408 || status === 429 || status >= 500;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function createImportRecord() {
  const { data, error } = await supabase
    .from('data_imports')
    .insert({
      source: SOURCE,
      dataset_name: DATASET_NAME,
      geographic_scope: 'Tamil Nadu',
      record_count: 0,
      records_attempted: 0,
      records_inserted: 0,
      records_skipped: 0,
      records_failed: 0,
      notes: `Historical hourly collection: ${HISTORICAL_PERIOD.startDate} to ${HISTORICAL_PERIOD.endDate}.`,
      status: 'Processing',
    })
    .select('id')
    .single();

  if (error) throw new Error(errorMessage(error, { operation: 'create import metadata', table: 'data_imports' }));
  return data.id;
}

async function updateImportRecord(status) {
  if (!importId) return;
  const failureNotes = metrics.failedPlaces.length > 0
    ? ` Failed places: ${metrics.failedPlaces.join(' | ')}`
    : '';
  const skipNotes = [...metrics.skipReasons.entries()]
    .map(([reason, count]) => `${reason}: ${count}`)
    .join(', ');
  const notes = `Historical hourly collection: ${HISTORICAL_PERIOD.startDate} to ${HISTORICAL_PERIOD.endDate}. ${skipNotes ? `Skip reasons: ${skipNotes}.` : ''}${failureNotes}`;

  const { error } = await supabase
    .from('data_imports')
    .update({
      record_count: metrics.inserted,
      records_attempted: metrics.attempted,
      records_inserted: metrics.inserted,
      records_skipped: metrics.skipped,
      records_failed: metrics.failed,
      notes,
      status,
    })
    .eq('id', importId);

  if (error) throw new Error(errorMessage(error, { operation: 'update import metadata', table: 'data_imports' }));
}

function observationKey(observation) {
  return `${observation.tourist_place_id}|${normalizeTimestamp(observation.recorded_at)}`;
}

function normalizeTimestamp(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? String(timestamp) : date.toISOString();
}

function addSkipReason(reason) {
  metrics.skipReasons.set(reason, (metrics.skipReasons.get(reason) ?? 0) + 1);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function errorMessage(error, context = {}) {
  const details = {};
  if (context.operation) details.operation = context.operation;
  if (context.table) details.table = context.table;
  if (context.endpoint) details.endpoint = context.endpoint;

  if (error instanceof Error) {
    details.error_type = error.name;
    details.message = error.message;
  } else if (error && typeof error === 'object') {
    for (const field of ['status', 'statusText', 'code', 'message', 'details', 'hint']) {
      if (error[field] !== undefined && error[field] !== null && error[field] !== '') {
        details[field] = error[field];
      }
    }
    if (!details.message) details.message = 'Operation returned an error object without a message.';
  } else {
    details.message = typeof error === 'string'
      ? error
      : `Operation failed with an unsupported error value (${typeof error}).`;
  }

  return JSON.stringify(details);
}

function printSummary() {
  console.log('Weather collection completed.');
  console.log(`Source: ${SOURCE}`);
  console.log(`Period: ${HISTORICAL_PERIOD.startDate} through ${HISTORICAL_PERIOD.endDate}`);
  console.log(`Records attempted: ${metrics.attempted}`);
  console.log(`Records inserted: ${metrics.inserted}`);
  console.log(`Records skipped: ${metrics.skipped}`);
  console.log(`Failures: ${metrics.failed}`);
}

function loadDotEnv() {
  try {
    const contents = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {
    // Environment variables may be supplied by the shell or deployment system.
  }
}