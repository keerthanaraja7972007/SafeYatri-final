import type { TourismContext } from '@/types/tourismContext';
import type { ProcessedRecord, PreprocessingResult } from '@/types/preprocessing';
import {
  analyzeRecord,
  detectDuplicates,
  summarizeDatasetQuality,
} from '@/utils/dataQuality';
import { resolveDistrictName, standardizeDateOnly, normalizeText } from '@/utils/dataNormalization';

const REQUIRED_FIELDS = ['date', 'source'];
const ALL_FIELDS = [
  'tourist_place_id', 'district', 'date', 'season',
  'tourism_event', 'holiday_indicator', 'source',
];

const RANGE_CHECKS: { field: string; isLat?: boolean; isLng?: boolean; min?: number; max?: number }[] = [];

const DUPLICATE_KEY_FIELDS = ['tourist_place_id', 'date', 'tourism_event'];

export function preprocessTourismData(records: TourismContext[]): PreprocessingResult {
  const started = new Date().toISOString();

  const normalized = records.map((r) => ({
    ...r,
    district: resolveDistrictName(r.district),
    date: standardizeDateOnly(r.date) ?? r.date,
    season: normalizeText(r.season),
    tourism_event: normalizeText(r.tourism_event),
  }));

  const rawRecords = normalized as unknown as Record<string, unknown>[];
  const dupKeys = detectDuplicates(rawRecords, DUPLICATE_KEY_FIELDS);

  const processed: ProcessedRecord[] = normalized.map((record) => {
    const raw = record as unknown as Record<string, unknown>;
    const dupKey = DUPLICATE_KEY_FIELDS.map((f) => String(raw[f] ?? '').trim().toLowerCase()).join('|');
    const isDup = dupKeys.has(dupKey);

    const analysis = analyzeRecord(raw, REQUIRED_FIELDS, RANGE_CHECKS, isDup, []);

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
    dataset: 'tourism_context',
    processedRecords: processed,
    summary,
    processingStarted: started,
    processingCompleted: new Date().toISOString(),
  };
}
