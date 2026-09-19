import type { FeatureRecord } from '@/types/featureEngineering';
import type { TourismContext } from '@/types/tourismContext';

/**
 * Extract tourism context features from cleaned tourism data.
 * Does NOT fabricate tourism intensity or event data.
 */
export function extractTourismFeatures(
  tourism: TourismContext[],
  touristPlaceId: string | null,
  district: string | null
): FeatureRecord[] {
  const relevant = tourism.filter(
    (t) =>
      (touristPlaceId && t.tourist_place_id === touristPlaceId) ||
      (district && t.district === district)
  );

  if (relevant.length === 0) {
    return [
      unavailableFeature('event_indicator', 'tourism_context', 'No tourism context data available for this location.'),
      unavailableFeature('holiday_indicator', 'tourism_context', 'No tourism context data available for this location.'),
      unavailableFeature('tourism_event_name', 'tourism_context', 'No tourism context data available for this location.'),
    ];
  }

  const latest = relevant[0];
  const hasEvent = latest.tourism_event !== null && latest.tourism_event !== undefined && latest.tourism_event.trim() !== '';

  return [
    {
      feature_name: 'event_indicator',
      value: hasEvent,
      original_value: latest.tourism_event,
      data_type: 'boolean',
      is_available: true,
      unavailable_reason: null,
      transformation: 'Derived: true if tourism_event is non-null and non-empty.',
      source_dataset: 'tourism_context',
      source_record_id: latest.id,
    },
    {
      feature_name: 'holiday_indicator',
      value: latest.holiday_indicator,
      original_value: latest.holiday_indicator,
      data_type: 'boolean',
      is_available: true,
      unavailable_reason: null,
      transformation: 'Direct passthrough from cleaned source.',
      source_dataset: 'tourism_context',
      source_record_id: latest.id,
    },
    {
      feature_name: 'tourism_event_name',
      value: latest.tourism_event,
      original_value: latest.tourism_event,
      data_type: 'categorical',
      is_available: hasEvent,
      unavailable_reason: hasEvent ? null : 'No event recorded for this period.',
      transformation: 'Direct passthrough from cleaned source.',
      source_dataset: 'tourism_context',
      source_record_id: latest.id,
    },
  ];
}

function unavailableFeature(name: string, sourceDataset: string, reason: string): FeatureRecord {
  return {
    feature_name: name,
    value: null,
    original_value: null,
    data_type: name === 'tourism_event_name' ? 'categorical' : 'boolean',
    is_available: false,
    unavailable_reason: reason,
    transformation: null,
    source_dataset: sourceDataset,
    source_record_id: null,
  };
}
