import type { TouristRiskLevel } from '@/types/touristPlaces';

type RiskAssessmentBadgeProps = {
  level?: TouristRiskLevel | null;
  className?: string;
};

const BADGE_CLASSES: Record<TouristRiskLevel, string> = {
  'LOW RISK': 'border-emerald-200 bg-emerald-50 text-emerald-800',
  'MODERATE RISK': 'border-amber-200 bg-amber-50 text-amber-900',
  'HIGH RISK': 'border-red-200 bg-red-50 text-red-800',
};

export default function RiskAssessmentBadge({ level, className = '' }: RiskAssessmentBadgeProps) {
  if (!level) {
    return (
      <span className={`inline-flex items-center rounded-full border border-saf-border bg-saf-bg px-2.5 py-1 text-xs font-semibold text-saf-muted ${className}`}>
        Risk assessment unavailable
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${BADGE_CLASSES[level]} ${className}`}>
      {level}
    </span>
  );
}
