import type { FeatureRecord } from '@/types/featureEngineering';
import type { CrimeData } from '@/types/crimeData';

/**
 * Extract crime/safety features from cleaned crime data.
 * Only produces features where source values are present.
 * Does NOT fabricate incident counts or categories.
 */
export function extractCrimeFeatures(
  crime: CrimeData[],
  touristPlaceId: string | null,
  district: string | null
): FeatureRecord[] {
  const relevant = crime.filter(
    (c) =>
      (touristPlaceId && c.tourist_place_id === touristPlaceId) ||
      (district && c.district === district)
  );

  if (relevant.length === 0) {
    return [
      unavailableFeature('incident_count', 'crime_data', 'No crime data available for this location.'),
      unavailableFeature('crime_category', 'crime_data', 'No crime data available for this location.'),
    ];
  }

  // Aggregate: sum incident counts across all records for this location
  const totalIncidents = relevant.reduce((sum, r) => sum + (r.incident_count ?? 0), 0);
  const categories = [...new Set(relevant.map((r) => r.crime_category).filter(Boolean))];

  return [
    {
      feature_name: 'incident_count',
      value: totalIncidents,
      original_value: relevant.map((r) => r.incident_count),
      data_type: 'numeric',
      is_available: true,
      unavailable_reason: null,
      transformation: 'Sum of incident_count across all crime records for this location.',
      source_dataset: 'crime_data',
      source_record_id: relevant[0]?.id ?? null,
    },
    {
      feature_name: 'crime_category',
      value: categories.length > 0 ? categories : null,
      original_value: relevant.map((r) => r.crime_category),
      data_type: 'categorical',
      is_available: categories.length > 0,
      unavailable_reason: categories.length > 0 ? null : 'No crime categories recorded.',
      transformation: 'Distinct crime categories from all records for this location.',
      source_dataset: 'crime_data',
      source_record_id: relevant[0]?.id ?? null,
    },
  ];
}

function unavailableFeature(name: string, sourceDataset: string, reason: string): FeatureRecord {
  return {
    feature_name: name,
    value: null,
    original_value: null,
    data_type: 'numeric',
    is_available: false,
    unavailable_reason: reason,
    transformation: null,
    source_dataset: sourceDataset,
    source_record_id: null,
  };
}
