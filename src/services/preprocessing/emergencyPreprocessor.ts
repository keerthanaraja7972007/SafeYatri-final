import type { EmergencyService } from '@/types/emergencyServices';
import type { ProcessedRecord, PreprocessingResult } from '@/types/preprocessing';
import {
  analyzeRecord,
  detectDuplicates,
  summarizeDatasetQuality,
} from '@/utils/dataQuality';
import { resolveDistrictName, normalizeText } from '@/utils/dataNormalization';

const REQUIRED_FIELDS = ['name', 'type', 'district', 'source'];
const ALL_FIELDS = [
  'name', 'type', 'district', 'address',
  'latitude', 'longitude', 'phone', 'availability_status', 'source',
];

const RANGE_CHECKS = [
  { field: 'latitude', isLat: true },
  { field: 'longitude', isLng: true },
];

const DUPLICATE_KEY_FIELDS = ['name', 'address', 'latitude', 'longitude'];

export function preprocessEmergencyData(records: EmergencyService[]): PreprocessingResult {
  const started = new Date().toISOString();

  const normalized = records.map((r) => ({
    ...r,
    name: normalizeText(r.name),
    district: resolveDistrictName(r.district),
    address: normalizeText(r.address),
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
    dataset: 'emergency_services',
    processedRecords: processed,
    summary,
    processingStarted: started,
    processingCompleted: new Date().toISOString(),
  };
}
