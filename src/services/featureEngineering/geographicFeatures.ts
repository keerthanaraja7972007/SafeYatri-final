import type { FeatureRecord } from '@/types/featureEngineering';
import type { TouristPlace } from '@/types/touristPlaces';

/**
 * Extract geographic features from the tourist place reference data.
 * These features are always available since tourist_places is the master dataset.
 */
export function extractGeographicFeatures(place: TouristPlace): FeatureRecord[] {
  return [
    {
      feature_name: 'latitude',
      value: place.latitude,
      original_value: place.latitude,
      data_type: 'geographic',
      is_available: place.latitude !== null && place.latitude !== undefined,
      unavailable_reason: null,
      transformation: 'Direct passthrough from cleaned source.',
      source_dataset: 'tourist_places',
      source_record_id: place.id,
    },
    {
      feature_name: 'longitude',
      value: place.longitude,
      original_value: place.longitude,
      data_type: 'geographic',
      is_available: place.longitude !== null && place.longitude !== undefined,
      unavailable_reason: null,
      transformation: 'Direct passthrough from cleaned source.',
      source_dataset: 'tourist_places',
      source_record_id: place.id,
    },
    {
      feature_name: 'district',
      value: place.district,
      original_value: place.district,
      data_type: 'geographic',
      is_available: Boolean(place.district),
      unavailable_reason: null,
      transformation: 'Direct passthrough from cleaned source.',
      source_dataset: 'tourist_places',
      source_record_id: place.id,
    },
    {
      feature_name: 'tourist_place_category',
      value: place.category,
      original_value: place.category,
      data_type: 'categorical',
      is_available: Boolean(place.category),
      unavailable_reason: null,
      transformation: 'Direct passthrough from cleaned source.',
      source_dataset: 'tourist_places',
      source_record_id: place.id,
    },
  ];
}
