import type { WeatherData } from '@/types/weatherData';
import type { ProcessedRecord, PreprocessingResult } from '@/types/preprocessing';
import {
  analyzeRecord,
  detectDuplicates,
  detectOutliers,
  summarizeDatasetQuality,
} from '@/utils/dataQuality';
import { normalizeText, resolveDistrictName, standardizeDate, toNumber } from '@/utils/dataNormalization';

const REQUIRED_FIELDS = [
  'tourist_place_id', 'district', 'recorded_at', 'source',
];
const ALL_FIELDS = [
  'tourist_place_id', 'district', 'recorded_at', 'temperature',
  'humidity', 'precipitation', 'visibility', 'wind_speed',
  'weather_code', 'source',
];

const RANGE_CHECKS = [
  { field: 'temperature', min: -100, max: 100 },
  { field: 'humidity', min: 0, max: 100 },
  { field: 'precipitation', min: 0 },
  { field: 'visibility', min: 0 },
  { field: 'wind_speed', min: 0 },
  { field: 'weather_code', min: 0, max: 99 },
];

const DUPLICATE_KEY_FIELDS = ['tourist_place_id', 'recorded_at'];
const NUMERIC_OUTLIER_FIELDS = ['temperature', 'humidity', 'precipitation', 'wind_speed', 'visibility'];

export function preprocessWeatherData(records: WeatherData[]): PreprocessingResult {
  const started = new Date().toISOString();

  const normalized = records.map((r) => ({
    ...r,
    tourist_place_id: normalizeText(r.tourist_place_id),
    district: resolveDistrictName(r.district),
    recorded_at: standardizeDate(r.recorded_at) ?? r.recorded_at,
    temperature: normalizeNumericValue(r.temperature),
    humidity: normalizeNumericValue(r.humidity),
    precipitation: normalizeNumericValue(r.precipitation),
    visibility: normalizeNumericValue(r.visibility),
    wind_speed: normalizeNumericValue(r.wind_speed),
    weather_code: normalizeText(r.weather_code),
    source: normalizeText(r.source),
  }));

  const rawRecords = normalized as unknown as Record<string, unknown>[];
  const dupKeys = detectDuplicates(rawRecords, DUPLICATE_KEY_FIELDS);
  const outlierMap = detectOutliers(rawRecords, NUMERIC_OUTLIER_FIELDS);

  const processed: ProcessedRecord[] = normalized.map((record, idx) => {
    const raw = record as unknown as Record<string, unknown>;
    const dupKey = DUPLICATE_KEY_FIELDS.map((f) => String(raw[f] ?? '').trim().toLowerCase()).join('|');
    const isDup = dupKeys.has(dupKey);
    const outlierFields = outlierMap.get(idx) ?? [];

    const analysis = analyzeRecord(raw, REQUIRED_FIELDS, RANGE_CHECKS, isDup, outlierFields);
    if (!standardizeDate(String(raw.recorded_at ?? ''))) {
      analysis.issues.push('recorded_at is not a valid timestamp.');
      analysis.status = 'Invalid';
    }
    const weatherCode = toNumber(raw.weather_code);
    if (weatherCode !== null && !Number.isInteger(weatherCode)) {
      analysis.issues.push('weather_code must be an integer between 0 and 99.');
      analysis.status = 'Invalid';
    }

    return {
      id: record.id,
      record: raw,
      analysis,
      source: record.source ?? null,
    };
  });

  const summary = summarizeDatasetQuality(
    processed.map((p) => p.analysis),
    rawRecords,
    ALL_FIELDS
  );

  return {
    dataset: 'weather_data',
    processedRecords: processed,
    summary,
    processingStarted: started,
    processingCompleted: new Date().toISOString(),
  };
}

function normalizeNumericValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  return toNumber(value) ?? value;
}
