import type { RiskLabelResult, RiskLabelEligibility, ClassDistributionAnalysis, ClassBalanceStatus } from '@/types/riskLabels';

/**
 * Analyze the distribution of risk labels.
 * Does NOT rebalance, oversample, undersample, or fabricate records.
 */
export function analyzeLabelDistribution(labels: RiskLabelResult[]): RiskLabelEligibility {
  const total = labels.length;
  const lowRisk = labels.filter((l) => l.label === 'Low Risk').length;
  const mediumRisk = labels.filter((l) => l.label === 'Medium Risk').length;
  const highRisk = labels.filter((l) => l.label === 'High Risk').length;
  const unclassified = labels.filter((l) => l.label === 'Unclassified').length;
  const withoutSufficientInfo = labels.filter(
    (l) => l.label === 'Unclassified' && l.contributing_factors.length === 0
  ).length;

  const canGenerate = lowRisk > 0 || mediumRisk > 0 || highRisk > 0;

  return {
    total_eligible_records: total,
    records_without_sufficient_info: withoutSufficientInfo,
    low_risk_records: lowRisk,
    medium_risk_records: mediumRisk,
    high_risk_records: highRisk,
    unclassified_records: unclassified,
    can_generate_labels: canGenerate,
    insufficient_data_message: canGenerate
      ? null
      : 'Insufficient validated data for label generation.',
  };
}

/**
 * Analyze class distribution to detect imbalance.
 * Does NOT modify the dataset — only identifies the issue.
 */
export function analyzeClassBalance(labels: RiskLabelResult[]): ClassDistributionAnalysis {
  const classifiable = labels.filter(
    (l) => l.label === 'Low Risk' || l.label === 'Medium Risk' || l.label === 'High Risk'
  );

  if (classifiable.length === 0) {
    return {
      total_records: labels.length,
      class_counts: { 'Low Risk': 0, 'Medium Risk': 0, 'High Risk': 0, 'Unclassified': labels.length },
      class_percentages: { 'Low Risk': 0, 'Medium Risk': 0, 'High Risk': 0, 'Unclassified': 100 },
      balance_status: 'Not Applicable',
      can_analyze: false,
      message: 'No classifiable records available for class balance analysis.',
    };
  }

  const counts: Record<string, number> = { 'Low Risk': 0, 'Medium Risk': 0, 'High Risk': 0 };
  for (const l of classifiable) counts[l.label]++;

  const total = classifiable.length;
  const percentages: Record<string, number> = {};
  for (const [k, v] of Object.entries(counts)) percentages[k] = total > 0 ? (v / total) * 100 : 0;

  // Determine balance status
  const maxPct = Math.max(...Object.values(percentages));
  const minPct = Math.min(...Object.values(percentages));
  const ratio = minPct > 0 ? maxPct / minPct : Infinity;

  let status: ClassBalanceStatus;
  if (ratio <= 1.5) status = 'Balanced';
  else if (ratio <= 3) status = 'Moderately Imbalanced';
  else status = 'Highly Imbalanced';

  return {
    total_records: labels.length,
    class_counts: { 'Low Risk': counts['Low Risk'], 'Medium Risk': counts['Medium Risk'], 'High Risk': counts['High Risk'], 'Unclassified': labels.length - total },
    class_percentages: { 'Low Risk': percentages['Low Risk'], 'Medium Risk': percentages['Medium Risk'], 'High Risk': percentages['High Risk'], 'Unclassified': labels.length > 0 ? ((labels.length - total) / labels.length) * 100 : 0 },
    balance_status: status,
    can_analyze: true,
    message: null,
  };
}
