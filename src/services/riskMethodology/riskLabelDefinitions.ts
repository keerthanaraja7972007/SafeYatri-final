import type { RiskLabelDefinition } from '@/types/riskLabels';

/**
 * Risk-label definitions for the SAFEYATRI platform.
 *
 * These are METHODOLOGY-BASED TRAINING TARGETS, not ML predictions.
 * They are transparent, reproducible, and derived from documented safety indicators.
 *
 * IMPORTANT: Thresholds are marked "Pending Validation" until sufficient
 * real-world data is available to justify them. No thresholds are fabricated.
 */
export const RISK_LABEL_DEFINITIONS: RiskLabelDefinition[] = [
  {
    label_name: 'Low Risk',
    definition:
      'Conditions associated with lower observed safety indicators according to the defined methodology. ' +
      'Favorable weather, available emergency services, and no significant crime or hazard indicators.',
    input_variables: [
      'incident_count',
      'weather_condition',
      'visibility_value',
      'emergency_service_count',
      'holiday_indicator',
      'weekend_indicator',
    ],
    rule:
      'Low incident count AND favorable weather conditions AND emergency services available. ' +
      'Specific thresholds: Pending Validation — to be derived from actual cleaned dataset statistics.',
    rationale:
      'Locations with fewer recorded incidents, clear weather, and nearby emergency services ' +
      'are empirically associated with lower tourist safety risk.',
    source: 'Derived from crime_data, weather_data, emergency_services datasets.',
    validation_status: 'Pending Validation',
  },
  {
    label_name: 'Medium Risk',
    definition:
      'Conditions with moderate safety indicators. Some risk factors present but not severe. ' +
      'May include moderate incident counts, weather variability, or limited emergency service availability.',
    input_variables: [
      'incident_count',
      'weather_condition',
      'visibility_value',
      'emergency_service_count',
      'holiday_indicator',
      'weekend_indicator',
    ],
    rule:
      'Moderate incident count OR moderate weather concerns OR limited emergency services. ' +
      'Specific thresholds: Pending Validation — to be derived from actual cleaned dataset statistics.',
    rationale:
      'Locations with some risk factors but not severe conditions require heightened awareness ' +
      'but do not warrant high-risk classification.',
    source: 'Derived from crime_data, weather_data, emergency_services datasets.',
    validation_status: 'Pending Validation',
  },
  {
    label_name: 'High Risk',
    definition:
      'Conditions associated with higher observed safety indicators. ' +
      'May include high incident counts, severe weather, no emergency services nearby, or hazardous conditions.',
    input_variables: [
      'incident_count',
      'weather_condition',
      'visibility_value',
      'precipitation_value',
      'wind_speed_value',
      'emergency_service_count',
      'holiday_indicator',
      'weekend_indicator',
    ],
    rule:
      'High incident count OR severe weather conditions OR no emergency services within scope. ' +
      'Specific thresholds: Pending Validation — to be derived from actual cleaned dataset statistics.',
    rationale:
      'Locations with elevated crime, severe weather, or lacking emergency infrastructure ' +
      'pose higher risk to tourist safety and require active precautions.',
    source: 'Derived from crime_data, weather_data, emergency_services datasets.',
    validation_status: 'Pending Validation',
  },
  {
    label_name: 'Unclassified',
    definition:
      'Records that cannot be assigned a risk label because sufficient validated source data ' +
      'is not available to apply the methodology.',
    input_variables: [],
    rule:
      'If required input variables are missing or unavailable, the record is Unclassified. ' +
      'No label is fabricated.',
    rationale:
      'It is scientifically irresponsible to assign a risk label without sufficient data. ' +
      'These records remain unclassified until the necessary data becomes available.',
    source: 'Methodology rule.',
    validation_status: 'Validated',
  },
];

export function getLabelDefinition(label: string): RiskLabelDefinition | undefined {
  return RISK_LABEL_DEFINITIONS.find((d) => d.label_name === label);
}
