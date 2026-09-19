export type FeatureDataType = 'numeric' | 'categorical' | 'boolean' | 'temporal' | 'geographic' | 'derived';

export type FeatureAvailabilityStatus = 'Available' | 'Unavailable' | 'Partial';

export type FeatureCategory =
  | 'Weather'
  | 'Crime'
  | 'Emergency'
  | 'Tourism'
  | 'Temporal'
  | 'Geographic'
  | 'TouristPlace';

export interface FeatureDefinition {
  feature_name: string;
  display_name: string;
  description: string;
  source_dataset: string;
  source_fields: string[];
  data_type: FeatureDataType;
  category: FeatureCategory;
  unit: string | null;
  transformation: string;
  is_derived: boolean;
  availability_status: FeatureAvailabilityStatus;
  missing_value_policy: string;
  validation_rule: string;
  aggregation_method: string | null;
}

export interface FeatureRecord {
  feature_name: string;
  value: unknown;
  original_value: unknown;
  data_type: FeatureDataType;
  is_available: boolean;
  unavailable_reason: string | null;
  transformation: string | null;
  source_dataset: string;
  source_record_id: string | null;
}

export interface FeatureSet {
  tourist_place_id: string | null;
  district: string | null;
  features: FeatureRecord[];
  generated_at: string;
  processing_version: string;
}

export type FeatureValidationStatus = 'Valid' | 'Missing Source' | 'Needs Review' | 'Invalid' | 'Not Applicable';

export interface FeatureValidationResult {
  feature_name: string;
  status: FeatureValidationStatus;
  issues: string[];
}

export interface FeatureAvailabilityEntry {
  feature_name: string;
  display_name: string;
  source: string;
  available: boolean;
  type: FeatureDataType;
  category: FeatureCategory;
}

export interface FeatureDatasetVersion {
  version: string;
  source_dataset_version: string;
  preprocessing_version: string;
  feature_engineering_version: string;
  generated_at: string;
  feature_count: number;
  eligible_record_count: number;
}

export interface FeatureDatasetSummary {
  totalFeatures: number;
  availableFeatures: number;
  missingFeatures: number;
  derivedFeatures: number;
  categoricalFeatures: number;
  numericalFeatures: number;
  temporalFeatures: number;
  geographicFeatures: number;
  booleanFeatures: number;
  availabilityMatrix: FeatureAvailabilityEntry[];
  version: FeatureDatasetVersion;
}
