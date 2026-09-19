import { useCallback, useEffect, useState } from 'react';
import {
  Layers,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Tag,
  Hash,
  Clock,
  MapPin,
  ToggleLeft,
  GitBranch,
  FileText,
  ChevronDown,
  ChevronRight,
  Info,
  BarChart3,
} from 'lucide-react';
import type { FeatureEngineeringResult } from '@/services/featureEngineering/featureEngineeringService';
import { runFeatureEngineering, isSupabaseConfigured, FEATURE_REGISTRY } from '@/services/featureEngineering/featureEngineeringService';
import { RISK_LABEL_DEFINITIONS } from '@/services/riskMethodology/riskLabelDefinitions';
import { THRESHOLD_VALIDATION_NOTE } from '@/services/riskMethodology/riskLabelRules';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

const TYPE_ICONS: Record<string, typeof Hash> = {
  numeric: Hash,
  categorical: Tag,
  boolean: ToggleLeft,
  temporal: Clock,
  geographic: MapPin,
  derived: GitBranch,
};

const TYPE_COLORS: Record<string, string> = {
  numeric: 'bg-saf-blue/10 text-saf-blue',
  categorical: 'bg-saf-orange/10 text-saf-orange',
  boolean: 'bg-saf-green/10 text-saf-green',
  temporal: 'bg-saf-cyan/10 text-saf-cyan',
  geographic: 'bg-saf-indigo/10 text-saf-indigo',
  derived: 'bg-saf-purple/10 text-saf-purple',
};

const RISK_LABEL_COLORS: Record<string, string> = {
  'Low Risk': 'bg-saf-green/10 text-saf-green',
  'Medium Risk': 'bg-saf-yellow/10 text-saf-yellow',
  'High Risk': 'bg-saf-red/10 text-saf-red',
  'Unclassified': 'bg-saf-muted/10 text-saf-muted',
};

export default function FeatureEngineeringDashboard() {
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [result, setResult] = useState<FeatureEngineeringResult | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('registry');

  const run = useCallback(async () => {
    setLoadState('loading');
    if (!isSupabaseConfigured) {
      setLoadState('error');
      return;
    }
    try {
      const res = await runFeatureEngineering();
      setResult(res);
      setLoadState('success');
    } catch {
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoadState('error');
      return;
    }
    run();
  }, [run]);

  const toggle = (section: string) =>
    setExpandedSection(expandedSection === section ? null : section);

  return (
    <div className="rounded-2xl border border-saf-border bg-saf-white shadow-card">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-saf-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-saf-indigo" />
            <h2 className="text-lg font-bold text-saf-text">Feature Engineering</h2>
          </div>
          <p className="mt-0.5 text-sm text-saf-muted">
            Transform cleaned data into traceable, validated features for the ML pipeline.
          </p>
        </div>
        <button
          onClick={run}
          disabled={loadState === 'loading'}
          className="inline-flex items-center gap-1.5 rounded-xl gradient-blue-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-float disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loadState === 'loading' ? 'animate-spin' : ''}`} />
          {loadState === 'loading' ? 'Engineering...' : 'Regenerate Features'}
        </button>
      </div>

      {/* Body */}
      <div className="p-6">
        {loadState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-saf-blue" />
            <p className="mt-3 text-sm font-medium text-saf-muted">Running feature engineering pipeline...</p>
          </div>
        )}

        {loadState === 'error' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-saf-red/10">
              <AlertCircle className="h-7 w-7 text-saf-red" />
            </div>
            <p className="mt-3 text-sm font-bold text-saf-text">Unable to run feature engineering</p>
            <p className="mt-1 text-sm text-saf-muted">Please try again.</p>
            <button onClick={run} className="mt-4 inline-flex items-center gap-1.5 rounded-xl gradient-blue-indigo px-4 py-2 text-sm font-semibold text-white shadow-soft">
              Try Again
            </button>
          </div>
        )}

        {loadState === 'idle' && !result && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-saf-bg border border-saf-border">
              <Layers className="h-7 w-7 text-saf-muted" />
            </div>
            <p className="mt-3 text-sm font-medium text-saf-muted">Initializing feature engineering...</p>
          </div>
        )}

        {((loadState === 'success') && result) && (
          <div className="space-y-6">
            {/* Summary stats */}
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Total Features" value={result.summary.totalFeatures} icon={Layers} color="gradient-blue-indigo" />
              <StatCard label="Available" value={result.summary.availableFeatures} icon={CheckCircle2} color="bg-saf-green" />
              <StatCard label="Missing" value={result.summary.missingFeatures} icon={XCircle} color="bg-saf-red" />
              <StatCard label="Derived" value={result.summary.derivedFeatures} icon={GitBranch} color="bg-saf-indigo" />
              <StatCard label="Eligible Records" value={result.summary.version.eligible_record_count} icon={FileText} color="bg-saf-cyan" />
            </div>

            {/* Feature type breakdown */}
            <div className="grid gap-3 sm:grid-cols-5">
              <TypeBadge label="Numeric" count={result.summary.numericalFeatures} icon={Hash} color={TYPE_COLORS.numeric} />
              <TypeBadge label="Categorical" count={result.summary.categoricalFeatures} icon={Tag} color={TYPE_COLORS.categorical} />
              <TypeBadge label="Boolean" count={result.summary.booleanFeatures} icon={ToggleLeft} color={TYPE_COLORS.boolean} />
              <TypeBadge label="Temporal" count={result.summary.temporalFeatures} icon={Clock} color={TYPE_COLORS.temporal} />
              <TypeBadge label="Geographic" count={result.summary.geographicFeatures} icon={MapPin} color={TYPE_COLORS.geographic} />
            </div>

            {/* Dataset version */}
            <div className="rounded-xl border border-saf-border bg-saf-bg p-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <GitBranch className="h-4 w-4 text-saf-indigo" />
                  <span className="font-semibold text-saf-text">{result.summary.version.version}</span>
                </div>
                <span className="text-saf-muted">{result.summary.version.preprocessing_version}</span>
                <span className="text-saf-muted">{result.summary.version.feature_engineering_version}</span>
                <span className="text-saf-muted">
                  Generated: {new Date(result.summary.version.generated_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Feature Registry */}
            <CollapsibleSection
              title="Feature Registry"
              icon={Layers}
              isExpanded={expandedSection === 'registry'}
              onToggle={() => toggle('registry')}
            >
              <div className="overflow-x-auto rounded-xl border border-saf-border">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-saf-border bg-saf-bg">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Feature</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Display Name</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Source</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Type</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Derived</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Unit</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Available</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Transformation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-saf-border">
                    {FEATURE_REGISTRY.map((def) => {
                      const availEntry = result.summary.availabilityMatrix.find((a) => a.feature_name === def.feature_name);
                      const TypeIcon = TYPE_ICONS[def.data_type] ?? Hash;
                      return (
                        <tr key={def.feature_name} className="transition-colors hover:bg-saf-bg">
                          <td className="px-4 py-3 text-sm font-mono font-medium text-saf-text whitespace-nowrap">{def.feature_name}</td>
                          <td className="px-4 py-3 text-sm text-saf-text whitespace-nowrap">{def.display_name}</td>
                          <td className="px-4 py-3 text-sm text-saf-muted whitespace-nowrap">{def.source_dataset}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[def.data_type] ?? 'bg-saf-muted/10 text-saf-muted'}`}>
                              <TypeIcon className="h-3 w-3" />
                              {def.data_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-saf-muted whitespace-nowrap">{def.is_derived ? 'Yes' : 'No'}</td>
                          <td className="px-4 py-3 text-sm text-saf-muted whitespace-nowrap">{def.unit ?? '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {availEntry?.available ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-saf-green">
                                <CheckCircle2 className="h-3 w-3" /> Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-saf-red">
                                <XCircle className="h-3 w-3" /> No
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-saf-muted max-w-xs truncate" title={def.transformation}>
                            {def.transformation}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CollapsibleSection>

            {/* Feature Availability Matrix */}
            <CollapsibleSection
              title="Feature Availability"
              icon={Eye}
              isExpanded={expandedSection === 'availability'}
              onToggle={() => toggle('availability')}
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {result.summary.availabilityMatrix.map((entry) => (
                  <div
                    key={entry.feature_name}
                    className="flex items-center justify-between rounded-lg border border-saf-border bg-saf-bg px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-saf-text">{entry.display_name}</p>
                      <p className="text-xs text-saf-muted">{entry.source} · {entry.type}</p>
                    </div>
                    {entry.available ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-saf-green/10 px-2 py-0.5 text-xs font-semibold text-saf-green">
                        <CheckCircle2 className="h-3 w-3" /> Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-saf-red/10 px-2 py-0.5 text-xs font-semibold text-saf-red">
                        <XCircle className="h-3 w-3" /> Unavailable
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* Risk Label Methodology */}
            <CollapsibleSection
              title="Risk Label Methodology"
              icon={AlertTriangle}
              isExpanded={expandedSection === 'methodology'}
              onToggle={() => toggle('methodology')}
            >
              <div className="mb-4 rounded-lg border border-saf-yellow/30 bg-saf-yellow/5 px-4 py-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-saf-yellow mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-saf-text">Important</p>
                    <p className="mt-1 text-xs text-saf-muted">
                      Risk labels are methodology-based training targets, NOT ML predictions.
                      {THRESHOLD_VALIDATION_NOTE}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {RISK_LABEL_DEFINITIONS.map((def) => (
                  <div key={def.label_name} className="rounded-xl border border-saf-border bg-saf-bg p-4">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${RISK_LABEL_COLORS[def.label_name]}`}>
                        {def.label_name}
                      </span>
                      <span className={`text-xs font-medium ${
                        def.validation_status === 'Validated' ? 'text-saf-green' : 'text-saf-yellow'
                      }`}>
                        {def.validation_status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-saf-text">{def.definition}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-saf-muted">Inputs</p>
                        <p className="mt-1 text-xs text-saf-text">
                          {def.input_variables.length > 0 ? def.input_variables.join(', ') : 'None (rule-based)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-saf-muted">Source</p>
                        <p className="mt-1 text-xs text-saf-text">{def.source}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-saf-muted">Rule</p>
                        <p className="mt-1 text-xs text-saf-text">{def.rule}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-saf-muted">Rationale</p>
                        <p className="mt-1 text-xs text-saf-text">{def.rationale}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* Label Distribution */}
            <CollapsibleSection
              title="Label Distribution"
              icon={BarChart3}
              isExpanded={expandedSection === 'distribution'}
              onToggle={() => toggle('distribution')}
            >
              {!result.labelEligibility.can_generate_labels ? (
                <div className="rounded-lg border border-saf-yellow/30 bg-saf-yellow/5 px-4 py-6 text-center">
                  <AlertTriangle className="h-6 w-6 text-saf-yellow mx-auto" />
                  <p className="mt-2 text-sm font-semibold text-saf-text">
                    {result.labelEligibility.insufficient_data_message ?? 'Insufficient validated data for label generation.'}
                  </p>
                  <p className="mt-1 text-xs text-saf-muted">
                    Thresholds are Pending Validation. No labels are fabricated.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  <LabelDistCard label="Low Risk" count={result.labelEligibility.low_risk_records} total={result.labelEligibility.total_eligible_records} color="text-saf-green" bg="bg-saf-green/10" />
                  <LabelDistCard label="Medium Risk" count={result.labelEligibility.medium_risk_records} total={result.labelEligibility.total_eligible_records} color="text-saf-yellow" bg="bg-saf-yellow/10" />
                  <LabelDistCard label="High Risk" count={result.labelEligibility.high_risk_records} total={result.labelEligibility.total_eligible_records} color="text-saf-red" bg="bg-saf-red/10" />
                </div>
              )}

              {/* Summary counts */}
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <CountCard label="Total Eligible" value={result.labelEligibility.total_eligible_records} />
                <CountCard label="Without Sufficient Info" value={result.labelEligibility.records_without_sufficient_info} />
                <CountCard label="Unclassified" value={result.labelEligibility.unclassified_records} />
                <CountCard label="Class Balance" value={result.classDistribution.balance_status} isText />
              </div>
            </CollapsibleSection>

            {/* Academic transparency note */}
            <div className="rounded-xl border border-saf-border bg-saf-bg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-saf-blue mt-0.5 flex-shrink-0" />
                <div className="text-xs text-saf-muted">
                  <p className="font-semibold text-saf-text">Data Flow: Source Data → Raw Data → Cleaned Data → Engineered Features → Validated Feature Dataset → Risk-Label Methodology → ML Training Dataset (Step 6)</p>
                  <p className="mt-1">
                    <span className="font-medium">Risk Label</span> = Training target generated according to the documented labeling methodology.
                    <span className="font-medium ml-2">ML Prediction</span> = Output produced later by a trained machine-learning model. These are NOT the same thing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Hash; color: string }) {
  return (
    <div className="rounded-xl border border-saf-border bg-saf-bg p-4">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color} shadow-soft`}>
          <Icon className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <span className="text-2xl font-extrabold text-saf-text">{value}</span>
      </div>
      <p className="mt-3 text-xs font-medium text-saf-muted">{label}</p>
    </div>
  );
}

function TypeBadge({ label, count, icon: Icon, color }: { label: string; count: number; icon: typeof Hash; color: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${color}`}>
      <Icon className="h-4 w-4" />
      <span className="text-sm font-semibold">{count}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  icon: typeof Hash;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-saf-border">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-saf-indigo" />
          <span className="text-sm font-bold text-saf-text">{title}</span>
        </div>
        {isExpanded ? <ChevronDown className="h-4 w-4 text-saf-muted" /> : <ChevronRight className="h-4 w-4 text-saf-muted" />}
      </button>
      {isExpanded && <div className="border-t border-saf-border p-4">{children}</div>}
    </div>
  );
}

function LabelDistCard({ label, count, total, color, bg }: { label: string; count: number; total: number; color: string; bg: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className={`rounded-xl border border-saf-border p-4 ${bg}`}>
      <p className="text-sm font-bold text-saf-text">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${color}`}>{count}</p>
      <p className="mt-1 text-xs text-saf-muted">{pct.toFixed(1)}% of eligible records</p>
    </div>
  );
}

function CountCard({ label, value, isText }: { label: string; value: number | string; isText?: boolean }) {
  return (
    <div className="rounded-lg border border-saf-border bg-saf-white p-3">
      <p className="text-xs font-medium text-saf-muted">{label}</p>
      <p className={`mt-1 ${isText ? 'text-sm font-semibold text-saf-text' : 'text-xl font-bold text-saf-text'}`}>{value}</p>
    </div>
  );
}
