import type { FeatureDatasetVersion } from '@/types/featureEngineering';

/**
 * Feature dataset versioning.
 * Each feature engineering run produces a versioned dataset that can be
 * traced back to its source, preprocessing, and feature-engineering versions.
 */

export const CURRENT_FEATURE_ENGINEERING_VERSION = '1.0.0';
export const CURRENT_PREPROCESSING_VERSION = '1.0.0';
export const CURRENT_SOURCE_DATASET_VERSION = 'initial';

/**
 * Create a new feature dataset version identifier.
 */
export function createDatasetVersion(
  featureCount: number,
  eligibleRecordCount: number
): FeatureDatasetVersion {
  return {
    version: `Feature Dataset v${CURRENT_FEATURE_ENGINEERING_VERSION}`,
    source_dataset_version: CURRENT_SOURCE_DATASET_VERSION,
    preprocessing_version: `Preprocessing v${CURRENT_PREPROCESSING_VERSION}`,
    feature_engineering_version: `Feature Engineering v${CURRENT_FEATURE_ENGINEERING_VERSION}`,
    generated_at: new Date().toISOString(),
    feature_count: featureCount,
    eligible_record_count: eligibleRecordCount,
  };
}
