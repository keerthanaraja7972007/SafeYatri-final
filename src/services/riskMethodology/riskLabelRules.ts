import type { FeatureRecord } from '@/types/featureEngineering';
import type { RiskLevel } from '@/types/riskLabels';

/**
 * Risk-label rules — the actual logic that maps available features to a risk label.
 *
 * CRITICAL: These rules check for DATA AVAILABILITY first. If the required
 * input variables are not available, the label is "Unclassified" — never fabricated.
 *
 * The threshold values below are PLACEHOLDERS marked as "Pending Validation".
 * They will be replaced with data-driven thresholds once sufficient real data
 * is available in the system. No label is presented as scientifically validated
 * until the thresholds are validated against real data.
 */

export interface RuleEvaluation {
  label: RiskLevel;
  contributing_factors: string[];
  has_sufficient_data: boolean;
  missing_inputs: string[];
}

/** Threshold values — marked as pending validation. */
export const THRESHOLDS = {
  // Crime thresholds (incident count per period)
  low_incident_max: null as number | null,      // Pending Validation
  medium_incident_max: null as number | null,   // Pending Validation
  // Weather thresholds
  low_visibility_min: null as number | null,    // Pending Validation
  high_precipitation_min: null as number | null, // Pending Validation
  high_wind_speed_min: null as number | null,    // Pending Validation
  // Emergency service thresholds
  min_emergency_services: null as number | null, // Pending Validation
} as const;

export const THRESHOLD_VALIDATION_NOTE =
  'All threshold values are Pending Validation. ' +
  'No labels are generated until thresholds are derived from actual cleaned dataset statistics.';

/**
 * Evaluate which features are available for risk labeling.
 */
function checkInputAvailability(
  features: FeatureRecord[],
  requiredInputs: string[]
): { available: string[]; missing: string[] } {
  const available: string[] = [];
  const missing: string[] = [];

  for (const input of requiredInputs) {
    const feature = features.find((f) => f.feature_name === input);
    if (feature && feature.is_available) {
      available.push(input);
    } else {
      missing.push(input);
    }
  }

  return { available, missing };
}

/**
 * Apply the risk-label methodology to a set of features.
 *
 * If thresholds are not yet validated (null), returns Unclassified with a note.
 * If required inputs are missing, returns Unclassified.
 * Otherwise, applies the documented rules.
 */
export function evaluateRiskLabel(features: FeatureRecord[]): RuleEvaluation {
  const requiredInputs = [
    'incident_count',
    'weather_condition',
    'visibility_value',
    'emergency_service_count',
  ];

  const { available, missing } = checkInputAvailability(features, requiredInputs);

  // If core inputs are missing, we cannot classify
  if (missing.length === requiredInputs.length) {
    return {
      label: 'Unclassified',
      contributing_factors: [],
      has_sufficient_data: false,
      missing_inputs: missing,
    };
  }

  // If thresholds are not yet validated, we cannot assign labels
  const thresholdsValidated =
    THRESHOLDS.low_incident_max !== null &&
    THRESHOLDS.medium_incident_max !== null &&
    THRESHOLDS.low_visibility_min !== null;

  if (!thresholdsValidated) {
    return {
      label: 'Unclassified',
      contributing_factors: available,
      has_sufficient_data: available.length >= 2,
      missing_inputs: missing,
    };
  }

  // Once thresholds are validated, apply rules here
  // This block is intentionally a placeholder — it will be populated
  // when thresholds are derived from real data in a future step.
  return {
    label: 'Unclassified',
    contributing_factors: available,
    has_sufficient_data: true,
    missing_inputs: missing,
  };
}
