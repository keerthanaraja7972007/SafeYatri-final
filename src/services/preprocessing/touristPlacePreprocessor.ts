import type { TouristPlace } from '@/types/touristPlaces';
import type { ProcessedRecord, PreprocessingResult } from '@/types/preprocessing';
import {
  analyzeRecord,
  detectDuplicates,
  summarizeDatasetQuality,
} from '@/utils/dataQuality';
import { resolveDistrictName, normalizeText, normalizeCategory } from '@/utils/dataNormalization';

const REQUIRED_FIELDS = ['name', 'district', 'latitude', 'longitude', 'category'];
const ALL_FIELDS = [
  'name', 'district', 'city', 'description',
  'latitude', 'longitude', 'category', 'is_active',
];

const RANGE_CHECKS = [
  { field: 'latitude', isLat: true },
  { field: 'longitude', isLng: true },
];

const DUPLICATE_KEY_FIELDS = ['name', 'district'];

export function preprocessTouristPlaceData(records: TouristPlace[]): PreprocessingResult {
  const started = new Date().toISOString();

  const normalized = records.map((r) => ({
    ...r,
    name: normalizeText(r.name),
    district: resolveDistrictName(r.district),
    city: normalizeText(r.city),
    category: normalizeCategory(r.category),
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
      source: 'SAFEYATRI master data',
    };
  });

  const summary = summarizeDatasetQuality(
    processed.map((p) => p.analysis),
    rawRecords,
    ALL_FIELDS
  );

  return {
    dataset: 'tourist_places',
    processedRecords: processed,
    summary,
    processingStarted: started,
    processingCompleted: new Date().toISOString(),
  };
}
