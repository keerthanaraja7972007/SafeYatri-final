import type { CrimeData } from '@/types/crimeData';
import type { ProcessedRecord, PreprocessingResult } from '@/types/preprocessing';
import {
  analyzeRecord,
  detectDuplicates,
  detectOutliers,
  summarizeDatasetQuality,
} from '@/utils/dataQuality';
import { resolveDistrictName, standardizeDateOnly, normalizeCategory } from '@/utils/dataNormalization';

const REQUIRED_FIELDS = ['date', 'crime_category', 'source'];
const ALL_FIELDS = [
  'tourist_place_id', 'district', 'date', 'crime_category',
  'incident_count', 'source',
];

const RANGE_CHECKS = [
  { field: 'incident_count', min: 0 },
];

const DUPLICATE_KEY_FIELDS = ['district', 'date', 'crime_category', 'source'];
const NUMERIC_OUTLIER_FIELDS = ['incident_count'];

export function preprocessCrimeData(records: CrimeData[]): PreprocessingResult {
  const started = new Date().toISOString();

  const normalized = records.map((r) => ({
    ...r,
    district: resolveDistrictName(r.district),
    date: standardizeDateOnly(r.date) ?? r.date,
    crime_category: normalizeCategory(r.crime_category),
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
    dataset: 'crime_data',
    processedRecords: processed,
    summary,
    processingStarted: started,
    processingCompleted: new Date().toISOString(),
  };
}
