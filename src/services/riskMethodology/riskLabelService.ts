import type { FeatureRecord } from '@/types/featureEngineering';
import type { RiskLabelResult, RiskLevel } from '@/types/riskLabels';
import type { RuleEvaluation } from './riskLabelRules';
import { evaluateRiskLabel } from './riskLabelRules';
import { THRESHOLD_VALIDATION_NOTE } from './riskLabelRules';

export const METHODOLOGY_VERSION = '1.0.0';

/**
 * Validate whether the risk-label methodology can be applied.
 * Checks that required data is available and thresholds are validated.
 */
export function validateMethodologyApplicability(
  featureSets: { features: FeatureRecord[] }[]
): {
  can_generate: boolean;
  reason: string | null;
  total_records: number;
  records_with_sufficient_data: number;
} {
  const total = featureSets.length;
  let sufficient = 0;

  for (const set of featureSets) {
    const evalResult = evaluateRiskLabel(set.features);
    if (evalResult.has_sufficient_data) sufficient++;
  }

  // Check if thresholds are validated
  const thresholdsValidated = false; // Will be true once thresholds are derived from real data

  if (!thresholdsValidated) {
    return {
      can_generate: false,
      reason: THRESHOLD_VALIDATION_NOTE,
      total_records: total,
      records_with_sufficient_data: sufficient,
    };
  }

  if (sufficient === 0) {
    return {
      can_generate: false,
      reason: 'No records have sufficient data for label generation.',
      total_records: total,
      records_with_sufficient_data: 0,
    };
  }

  return {
    can_generate: true,
    reason: null,
    total_records: total,
    records_with_sufficient_data: sufficient,
  };
}

/**
 * Generate a risk label for a single feature set.
 * Returns Unclassified if data is insufficient or thresholds are not validated.
 */
export function generateRiskLabel(
  features: FeatureRecord[],
  touristPlaceId: string | null,
  district: string | null
): RiskLabelResult {
  const evaluation = evaluateRiskLabel(features);

  return {
    tourist_place_id: touristPlaceId,
    district: district,
    label: evaluation.label,
    contributing_factors: evaluation.contributing_factors,
    methodology_version: METHODOLOGY_VERSION,
    validation_status: 'Pending Validation',
    generated_at: new Date().toISOString(),
  };
}

/**
 * Generate risk labels for multiple feature sets.
 */
export function generateRiskLabels(
  featureSets: { features: FeatureRecord[]; tourist_place_id: string | null; district: string | null }[]
): RiskLabelResult[] {
  return featureSets.map((set) =>
    generateRiskLabel(set.features, set.tourist_place_id, set.district)
  );
}
