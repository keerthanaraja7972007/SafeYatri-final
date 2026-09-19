import type { FeatureRecord } from '@/types/featureEngineering';
import type { EmergencyService } from '@/types/emergencyServices';

/**
 * Extract emergency service features from cleaned emergency service data.
 * Does NOT invent facility counts or assume availability.
 */
export function extractEmergencyFeatures(
  emergency: EmergencyService[],
  district: string | null
): FeatureRecord[] {
  const relevant = district
    ? emergency.filter((e) => e.district === district)
    : [];

  if (relevant.length === 0) {
    return [
      unavailableFeature('emergency_service_type', 'emergency_services', 'No emergency service data available for this district.'),
      unavailableFeature('emergency_service_count', 'emergency_services', 'No emergency service data available for this district.'),
    ];
  }

  const types = [...new Set(relevant.map((e) => e.type).filter(Boolean))];

  return [
    {
      feature_name: 'emergency_service_type',
      value: types.length > 0 ? types : null,
      original_value: relevant.map((e) => e.type),
      data_type: 'categorical',
      is_available: types.length > 0,
      unavailable_reason: types.length > 0 ? null : 'No service types recorded.',
      transformation: 'Distinct emergency service types available in this district.',
      source_dataset: 'emergency_services',
      source_record_id: relevant[0]?.id ?? null,
    },
    {
      feature_name: 'emergency_service_count',
      value: relevant.length,
      original_value: relevant.length,
      data_type: 'numeric',
      is_available: true,
      unavailable_reason: null,
      transformation: 'Count of emergency service facilities in this district.',
      source_dataset: 'emergency_services',
      source_record_id: null,
    },
  ];
}

function unavailableFeature(name: string, sourceDataset: string, reason: string): FeatureRecord {
  return {
    feature_name: name,
    value: null,
    original_value: null,
    data_type: name === 'emergency_service_count' ? 'numeric' : 'categorical',
    is_available: false,
    unavailable_reason: reason,
    transformation: null,
    source_dataset: sourceDataset,
    source_record_id: null,
  };
}
