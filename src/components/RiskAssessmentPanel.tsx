import type { TouristRiskAssessment } from '@/types/touristPlaces';
import RiskAssessmentBadge from '@/components/RiskAssessmentBadge';

type RiskAssessmentPanelProps = {
  assessment?: TouristRiskAssessment | null;
};

function renderFactors(value: string) {
  if (!value) return <p className="text-sm text-saf-muted">No recorded factor summary is available.</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm leading-5 text-saf-muted">
      {value.split('; ').map((factor) => <li key={factor}>{factor}</li>)}
    </ul>
  );
}

export default function RiskAssessmentPanel({ assessment }: RiskAssessmentPanelProps) {
  return (
    <section className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card" aria-labelledby="risk-assessment-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-saf-blue">SAFEYATRI ML Risk Assessment</p>
          <h2 id="risk-assessment-title" className="mt-1 text-xl font-extrabold text-saf-text">Safety Assessment</h2>
        </div>
        <RiskAssessmentBadge level={assessment?.risk_level} />
      </div>
      {assessment ? (
        <>
          <p className="mt-4 text-sm text-saf-text"><span className="font-semibold">Risk Score:</span> {assessment.risk_score.toFixed(2)} / 100</p>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-saf-text">Why this assessment?</h3>
              <p className="mt-1 text-sm leading-6 text-saf-muted">{assessment.explanation}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-saf-text">Positive safety/accessibility factors</h3>
              <div className="mt-1">{renderFactors(assessment.top_positive_safety_factors)}</div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-saf-text">Less favorable access factors</h3>
              <div className="mt-1">{renderFactors(assessment.top_limited_access_factors)}</div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-saf-text">Contextual risk factors</h3>
              <div className="mt-1">{renderFactors(assessment.top_contextual_risk_factors)}</div>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-saf-muted">Risk assessment unavailable for this place.</p>
      )}
      <p className="mt-4 border-t border-saf-border pt-3 text-xs leading-5 text-saf-muted">
        This assessment is derived from available emergency-accessibility and contextual data. It is evidence-based and not a guaranteed prediction of actual tourist safety.
      </p>
    </section>
  );
}
