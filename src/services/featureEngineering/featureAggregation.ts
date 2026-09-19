import type { FeatureRecord } from '@/types/featureEngineering';

/**
 * Controlled aggregation layer for feature records.
 * Supports: mean, sum, min, max, count, mode.
 * Only aggregates numeric values — categorical values use mode.
 * Does NOT destroy original meaning or fabricate values.
 */

export type AggregationMethod = 'mean' | 'sum' | 'min' | 'max' | 'count' | 'mode';

export interface AggregationResult {
  feature_name: string;
  aggregated_value: number | string | null;
  method: AggregationMethod;
  source_count: number;
  is_available: boolean;
}

/** Aggregate a list of feature records using the specified method. */
export function aggregateFeatures(
  features: FeatureRecord[],
  method: AggregationMethod,
  featureName: string
): AggregationResult {
  const values = features
    .filter((f) => f.feature_name === featureName && f.is_available)
    .map((f) => f.value);

  if (values.length === 0) {
    return {
      feature_name: featureName,
      aggregated_value: null,
      method,
      source_count: 0,
      is_available: false,
    };
  }

  switch (method) {
    case 'count':
      return {
        feature_name: featureName,
        aggregated_value: values.length,
        method,
        source_count: values.length,
        is_available: true,
      };

    case 'mean': {
      const nums = values.filter((v): v is number => typeof v === 'number');
      if (nums.length === 0)
        return { feature_name: featureName, aggregated_value: null, method, source_count: 0, is_available: false };
      return {
        feature_name: featureName,
        aggregated_value: nums.reduce((a, b) => a + b, 0) / nums.length,
        method,
        source_count: nums.length,
        is_available: true,
      };
    }

    case 'sum': {
      const nums = values.filter((v): v is number => typeof v === 'number');
      if (nums.length === 0)
        return { feature_name: featureName, aggregated_value: null, method, source_count: 0, is_available: false };
      return {
        feature_name: featureName,
        aggregated_value: nums.reduce((a, b) => a + b, 0),
        method,
        source_count: nums.length,
        is_available: true,
      };
    }

    case 'min': {
      const nums = values.filter((v): v is number => typeof v === 'number');
      if (nums.length === 0)
        return { feature_name: featureName, aggregated_value: null, method, source_count: 0, is_available: false };
      return {
        feature_name: featureName,
        aggregated_value: Math.min(...nums),
        method,
        source_count: nums.length,
        is_available: true,
      };
    }

    case 'max': {
      const nums = values.filter((v): v is number => typeof v === 'number');
      if (nums.length === 0)
        return { feature_name: featureName, aggregated_value: null, method, source_count: 0, is_available: false };
      return {
        feature_name: featureName,
        aggregated_value: Math.max(...nums),
        method,
        source_count: nums.length,
        is_available: true,
      };
    }

    case 'mode': {
      const counts = new Map<unknown, number>();
      for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
      let maxCount = 0;
      let modeVal: unknown = null;
      for (const [v, c] of counts) {
        if (c > maxCount) {
          maxCount = c;
          modeVal = v;
        }
      }
      return {
        feature_name: featureName,
        aggregated_value: modeVal as string | number | null,
        method,
        source_count: values.length,
        is_available: modeVal !== null,
      };
    }

    default:
      return {
        feature_name: featureName,
        aggregated_value: null,
        method,
        source_count: 0,
        is_available: false,
      };
  }
}
