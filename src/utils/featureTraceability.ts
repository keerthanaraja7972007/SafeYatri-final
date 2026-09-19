import type { FeatureRecord } from '@/types/featureEngineering';

/**
 * Feature traceability utilities.
 * Every derived feature can be traced back to its source record, dataset,
 * original value, and transformation applied.
 */

export interface TraceabilityRecord {
  feature_name: string;
  source_dataset: string;
  source_record_id: string | null;
  original_value: unknown;
  derived_value: unknown;
  transformation: string | null;
  generated_at: string;
  processing_version: string;
}

/**
 * Build a traceability record for a single feature.
 */
export function buildTraceability(
  feature: FeatureRecord,
  generatedAt: string,
  processingVersion: string
): TraceabilityRecord {
  return {
    feature_name: feature.feature_name,
    source_dataset: feature.source_dataset,
    source_record_id: feature.source_record_id,
    original_value: feature.original_value,
    derived_value: feature.value,
    transformation: feature.transformation,
    generated_at: generatedAt,
    processing_version: processingVersion,
  };
}

/**
 * Build traceability records for an entire feature set.
 */
export function buildTraceabilitySet(
  features: FeatureRecord[],
  generatedAt: string,
  processingVersion: string
): TraceabilityRecord[] {
  return features.map((f) => buildTraceability(f, generatedAt, processingVersion));
}

/**
 * Format a traceability chain for display.
 * Shows the full path: Source Dataset → Source Record → Original Value → Transformation → Derived Value
 */
export function formatTraceabilityChain(record: TraceabilityRecord): string {
  const parts = [
    `Source: ${record.source_dataset}`,
    record.source_record_id ? `Record: ${record.source_record_id}` : 'Record: (aggregated)',
    `Original: ${formatValue(record.original_value)}`,
    record.transformation ? `Transform: ${record.transformation}` : 'Transform: (none)',
    `Derived: ${formatValue(record.derived_value)}`,
  ];
  return parts.join(' → ');
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return `[${value.length} values]`;
  if (typeof value === 'string') return value.length > 50 ? value.slice(0, 47) + '...' : value;
  return String(value);
}
