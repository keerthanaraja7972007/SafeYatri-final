import type { FeatureRecord } from '@/types/featureEngineering';

/**
 * Modular feature normalization layer.
 * Supports Min-Max scaling and Standardization (z-score).
 * Does NOT overwrite the original value — the original_value field is preserved.
 * Only normalizes numeric features. Categorical, boolean, temporal, and geographic
 * features remain in their original form until the ML preprocessing stage.
 */

export type NormalizationMethod = 'minmax' | 'standardization' | 'none';

export interface NormalizationResult {
  feature_name: string;
  original_value: number | null;
  normalized_value: number | null;
  method: NormalizationMethod;
  params: { min?: number; max?: number; mean?: number; std?: number } | null;
}

/**
 * Normalize a single numeric value using Min-Max scaling.
 * Returns null if the value is null or the range is zero (cannot divide).
 */
export function minMaxScale(
  value: number | null,
  min: number,
  max: number
): number | null {
  if (value === null) return null;
  if (max === min) return 0; // All values are the same
  return (value - min) / (max - min);
}

/**
 * Normalize a single numeric value using standardization (z-score).
 * Returns null if the value is null or std is zero.
 */
export function standardize(
  value: number | null,
  mean: number,
  std: number
): number | null {
  if (value === null) return null;
  if (std === 0) return 0; // All values are the same
  return (value - mean) / std;
}

/**
 * Compute normalization parameters (min, max, mean, std) from a set of feature records.
 */
export function computeNormalizationParams(features: FeatureRecord[]): {
  min: number;
  max: number;
  mean: number;
  std: number;
} | null {
  const nums = features
    .filter((f) => f.is_available && typeof f.value === 'number')
    .map((f) => f.value as number);

  if (nums.length === 0) return null;

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
  const std = Math.sqrt(variance);

  return { min, max, mean, std };
}

/**
 * Normalize a list of feature records of the same feature name.
 * Returns both the original and normalized values, plus the transformation metadata.
 */
export function normalizeFeatureColumn(
  features: FeatureRecord[],
  method: NormalizationMethod
): NormalizationResult[] {
  if (method === 'none') {
    return features.map((f) => ({
      feature_name: f.feature_name,
      original_value: typeof f.value === 'number' ? f.value : null,
      normalized_value: typeof f.value === 'number' ? f.value : null,
      method: 'none',
      params: null,
    }));
  }

  const params = computeNormalizationParams(features);
  if (!params) {
    return features.map((f) => ({
      feature_name: f.feature_name,
      original_value: typeof f.value === 'number' ? f.value : null,
      normalized_value: null,
      method,
      params: null,
    }));
  }

  return features.map((f) => {
    const numVal = typeof f.value === 'number' ? f.value : null;
    let normalized: number | null = null;

    if (method === 'minmax') {
      normalized = minMaxScale(numVal, params.min, params.max);
    } else if (method === 'standardization') {
      normalized = standardize(numVal, params.mean, params.std);
    }

    return {
      feature_name: f.feature_name,
      original_value: numVal,
      normalized_value: normalized,
      method,
      params,
    };
  });
}
