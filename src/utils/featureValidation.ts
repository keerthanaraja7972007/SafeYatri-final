import type { FeatureRecord, FeatureValidationResult, FeatureValidationStatus } from '@/types/featureEngineering';
import { getFeatureByName } from '@/services/featureEngineering/featureRegistry';
import { validateLatitude, validateLongitude } from '@/utils/dataValidation';

/**
 * Validate engineered features against their registered definitions.
 * Does NOT silently remove problematic features — it marks them for review.
 */
export function validateFeature(feature: FeatureRecord): FeatureValidationResult {
  const def = getFeatureByName(feature.feature_name);
  const issues: string[] = [];

  if (!def) {
    return {
      feature_name: feature.feature_name,
      status: 'Invalid',
      issues: ['Feature is not registered in the feature registry.'],
    };
  }

  // Check availability
  if (!feature.is_available) {
    return {
      feature_name: feature.feature_name,
      status: 'Missing Source',
      issues: [feature.unavailable_reason ?? 'Source data is not available.'],
    };
  }

  // Check data type
  if (def.data_type === 'numeric') {
    if (typeof feature.value !== 'number' || isNaN(feature.value)) {
      issues.push(`Expected numeric value but got ${typeof feature.value}.`);
    }
  } else if (def.data_type === 'boolean') {
    if (typeof feature.value !== 'boolean') {
      issues.push(`Expected boolean value but got ${typeof feature.value}.`);
    }
  } else if (def.data_type === 'categorical') {
    if (feature.value === null || feature.value === undefined) {
      issues.push('Categorical value is null or undefined.');
    }
  } else if (def.data_type === 'geographic') {
    if (feature.feature_name === 'latitude') {
      const lat = typeof feature.value === 'number' ? feature.value : null;
      if (lat !== null && !validateLatitude(lat)) {
        issues.push(`Latitude ${lat} is outside valid range (-90 to 90).`);
      }
    } else if (feature.feature_name === 'longitude') {
      const lng = typeof feature.value === 'number' ? feature.value : null;
      if (lng !== null && !validateLongitude(lng)) {
        issues.push(`Longitude ${lng} is outside valid range (-180 to 180).`);
      }
    }
  } else if (def.data_type === 'temporal') {
    if (typeof feature.value !== 'number' || !Number.isInteger(feature.value)) {
      issues.push(`Temporal feature should be an integer, got ${typeof feature.value}.`);
    }
  }

  // Check range for specific features
  if (feature.feature_name === 'hour_of_day' && typeof feature.value === 'number') {
    if (feature.value < 0 || feature.value > 23) issues.push('Hour must be 0-23.');
  }
  if (feature.feature_name === 'day_of_week' && typeof feature.value === 'number') {
    if (feature.value < 0 || feature.value > 6) issues.push('Day of week must be 0-6.');
  }
  if (feature.feature_name === 'month' && typeof feature.value === 'number') {
    if (feature.value < 1 || feature.value > 12) issues.push('Month must be 1-12.');
  }

  let status: FeatureValidationStatus;
  if (issues.length === 0) {
    status = 'Valid';
  } else if (issues.some((i) => i.includes('not registered'))) {
    status = 'Invalid';
  } else {
    status = 'Needs Review';
  }

  return { feature_name: feature.feature_name, status, issues };
}

export function validateFeatureSet(features: FeatureRecord[]): FeatureValidationResult[] {
  return features.map(validateFeature);
}
