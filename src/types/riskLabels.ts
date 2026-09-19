export type RiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Unclassified';

export type RiskLabelValidationStatus = 'Pending Validation' | 'Validated' | 'Insufficient Data';

export interface RiskLabelDefinition {
  label_name: RiskLevel;
  definition: string;
  input_variables: string[];
  rule: string;
  rationale: string;
  source: string;
  validation_status: RiskLabelValidationStatus;
}

export interface RiskLabelEligibility {
  total_eligible_records: number;
  records_without_sufficient_info: number;
  low_risk_records: number;
  medium_risk_records: number;
  high_risk_records: number;
  unclassified_records: number;
  can_generate_labels: boolean;
  insufficient_data_message: string | null;
}

export type ClassBalanceStatus = 'Balanced' | 'Moderately Imbalanced' | 'Highly Imbalanced' | 'Not Applicable';

export interface ClassDistributionAnalysis {
  total_records: number;
  class_counts: Record<RiskLevel, number>;
  class_percentages: Record<RiskLevel, number>;
  balance_status: ClassBalanceStatus;
  can_analyze: boolean;
  message: string | null;
}

export interface RiskLabelResult {
  tourist_place_id: string | null;
  district: string | null;
  label: RiskLevel;
  contributing_factors: string[];
  methodology_version: string;
  validation_status: RiskLabelValidationStatus;
  generated_at: string;
}
