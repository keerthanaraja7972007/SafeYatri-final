import type { FeatureRecord } from '@/types/featureEngineering';

/**
 * Extract temporal features from a valid ISO 8601 timestamp.
 * All transformations are deterministic: hour, day-of-week, month, weekend indicator.
 * If the timestamp is missing or invalid, all temporal features are marked unavailable.
 */
export function extractTemporalFeatures(
  timestamp: string | null | undefined,
  sourceDataset: string,
  sourceRecordId: string | null
): FeatureRecord[] {
  if (!timestamp) {
    return [
      unavailableFeature('hour_of_day', sourceDataset, 'No timestamp available.'),
      unavailableFeature('day_of_week', sourceDataset, 'No timestamp available.'),
      unavailableFeature('month', sourceDataset, 'No timestamp available.'),
      unavailableFeature('weekend_indicator', sourceDataset, 'No timestamp available.'),
    ];
  }

  const d = new Date(timestamp);
  if (isNaN(d.getTime())) {
    return [
      unavailableFeature('hour_of_day', sourceDataset, 'Timestamp is invalid.'),
      unavailableFeature('day_of_week', sourceDataset, 'Timestamp is invalid.'),
      unavailableFeature('month', sourceDataset, 'Timestamp is invalid.'),
      unavailableFeature('weekend_indicator', sourceDataset, 'Timestamp is invalid.'),
    ];
  }

  const hour = d.getHours();
  const dayOfWeek = d.getDay(); // 0=Sunday, 6=Saturday
  const month = d.getMonth() + 1; // 1-12
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return [
    {
      feature_name: 'hour_of_day',
      value: hour,
      original_value: timestamp,
      data_type: 'temporal',
      is_available: true,
      unavailable_reason: null,
      transformation: 'Extract hour component from ISO 8601 timestamp.',
      source_dataset: sourceDataset,
      source_record_id: sourceRecordId,
    },
    {
      feature_name: 'day_of_week',
      value: dayOfWeek,
      original_value: timestamp,
      data_type: 'temporal',
      is_available: true,
      unavailable_reason: null,
      transformation: 'Extract day-of-week from ISO 8601 timestamp (0=Sunday, 6=Saturday).',
      source_dataset: sourceDataset,
      source_record_id: sourceRecordId,
    },
    {
      feature_name: 'month',
      value: month,
      original_value: timestamp,
      data_type: 'temporal',
      is_available: true,
      unavailable_reason: null,
      transformation: 'Extract month from ISO 8601 timestamp (1-12).',
      source_dataset: sourceDataset,
      source_record_id: sourceRecordId,
    },
    {
      feature_name: 'weekend_indicator',
      value: isWeekend,
      original_value: timestamp,
      data_type: 'boolean',
      is_available: true,
      unavailable_reason: null,
      transformation: 'Derived from day_of_week: true if Saturday (6) or Sunday (0).',
      source_dataset: sourceDataset,
      source_record_id: sourceRecordId,
    },
  ];
}

function unavailableFeature(
  name: string,
  sourceDataset: string,
  reason: string
): FeatureRecord {
  const dataType = name === 'weekend_indicator' ? 'boolean' : 'temporal';
  return {
    feature_name: name,
    value: null,
    original_value: null,
    data_type: dataType,
    is_available: false,
    unavailable_reason: reason,
    transformation: null,
    source_dataset: sourceDataset,
    source_record_id: null,
  };
}
