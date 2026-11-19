import { useCallback, useEffect, useState } from 'react';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Eye,
  History,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  CloudRain,
  ShieldAlert,
  Siren,
  CalendarDays,
  MapPin,
} from 'lucide-react';
import type { PreprocessingResult, PreprocessingLog } from '@/types/preprocessing';
import type { DatasetQualitySummary } from '@/utils/dataQuality';
import {
  preprocessAll,
  getPreprocessingLogs,
} from '@/services/preprocessing/preprocessingService';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

const DATASET_META: Record<string, { label: string; icon: typeof CloudRain; color: string }> = {
  weather_data: { label: 'Weather Data', icon: CloudRain, color: 'gradient-cyan-blue' },
  crime_data: { label: 'Crime Data', icon: ShieldAlert, color: 'gradient-orange-red' },
  emergency_services: { label: 'Emergency Services', icon: Siren, color: 'bg-saf-red' },
  tourism_context: { label: 'Tourism Context', icon: CalendarDays, color: 'gradient-green-cyan' },
  tourist_places: { label: 'Tourist Places', icon: MapPin, color: 'gradient-blue-indigo' },
};

const STATUS_BADGE: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  Clean: { bg: 'bg-saf-green/10', text: 'text-saf-green', icon: CheckCircle2 },
  Incomplete: { bg: 'bg-saf-yellow/10', text: 'text-saf-yellow', icon: AlertTriangle },
  Invalid: { bg: 'bg-saf-red/10', text: 'text-saf-red', icon: XCircle },
  Duplicate: { bg: 'bg-saf-orange/10', text: 'text-saf-orange', icon: Copy },
  'Needs Review': { bg: 'bg-saf-blue/10', text: 'text-saf-blue', icon: Eye },
};

export default function DataQualityDashboard() {
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [results, setResults] = useState<PreprocessingResult[]>([]);
  const [logs, setLogs] = useState<PreprocessingLog[]>([]);
  const [expandedDataset, setExpandedDataset] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const runPreprocessing = useCallback(async () => {
    setLoadState('loading');
    try {
      const allResults = await preprocessAll();
      setResults(allResults);
      const allLogs = await getPreprocessingLogs();
      setLogs(allLogs);
      setLoadState('success');
    } catch {
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    // Load existing logs on mount without running preprocessing
    getPreprocessingLogs()
      .then((data) => {
        setLogs(data);
        setLoadState('idle');
      })
      .catch(() => setLoadState('error'));
  }, []);

  return (
    <div className="rounded-2xl border border-saf-border bg-saf-white shadow-card">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-saf-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-saf-indigo" />
            <h2 className="text-lg font-bold text-saf-text">Data Quality</h2>
          </div>
          <p className="mt-0.5 text-sm text-saf-muted">
            Validate, detect duplicates, identify missing and invalid values across datasets.
          </p>
        </div>
        <button
          onClick={runPreprocessing}
          disabled={loadState === 'loading'}
          className="inline-flex items-center gap-1.5 rounded-xl gradient-blue-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-float disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loadState === 'loading' ? 'animate-spin' : ''}`} />
          {loadState === 'loading' ? 'Processing...' : 'Run Preprocessing'}
        </button>
      </div>

      {/* Body */}
      <div className="p-6">
        {loadState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-saf-blue" />
            <p className="mt-3 text-sm font-medium text-saf-muted">Running preprocessing pipeline...</p>
          </div>
        )}

        {loadState === 'error' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-saf-red/10">
              <AlertCircle className="h-7 w-7 text-saf-red" />
            </div>
            <p className="mt-3 text-sm font-bold text-saf-text">Unable to run preprocessing</p>
            <p className="mt-1 text-sm text-saf-muted">Please try again.</p>
            <button
              onClick={runPreprocessing}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl gradient-blue-indigo px-4 py-2 text-sm font-semibold text-white shadow-soft"
            >
              Try Again
            </button>
          </div>
        )}

        {loadState === 'idle' && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-saf-bg border border-saf-border">
              <Sparkles className="h-7 w-7 text-saf-muted" />
            </div>
            <p className="mt-3 text-sm font-medium text-saf-muted">
              No preprocessing runs yet. Click "Run Preprocessing" to analyze datasets.
            </p>
            {logs.length > 0 && (
              <button
                onClick={() => setShowLogs(true)}
                className="mt-4 text-sm font-medium text-saf-blue hover:text-saf-indigo"
              >
                View processing history
              </button>
            )}
          </div>
        )}

        {((loadState === 'success' && results.length > 0) || (loadState === 'idle' && results.length > 0)) && (
          <div className="space-y-6">
            {/* Quality summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => {
                const meta = DATASET_META[result.dataset] ?? {
                  label: result.dataset,
                  icon: MapPin,
                  color: 'bg-saf-indigo',
                };
                const Icon = meta.icon;
                const s = result.summary;
                return (
                  <div
                    key={result.dataset}
                    className="rounded-xl border border-saf-border bg-saf-bg p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.color} shadow-soft`}>
                          <Icon className="h-4 w-4 text-white" strokeWidth={2} />
                        </div>
                        <span className="text-sm font-bold text-saf-text">{meta.label}</span>
                      </div>
                      <span className="text-xs font-medium text-saf-muted">{s.totalRecords} total</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <QualityStat label="Clean" value={s.validRecords} color="text-saf-green" />
                      <QualityStat label="Incomplete" value={s.incompleteRecords} color="text-saf-yellow" />
                      <QualityStat label="Invalid" value={s.invalidRecords} color="text-saf-red" />
                      <QualityStat label="Duplicates" value={s.duplicateRecords} color="text-saf-orange" />
                      <QualityStat label="Needs Review" value={s.needsReviewRecords} color="text-saf-blue" />
                      <QualityStat
                        label="Missing Fields"
                        value={s.fieldQuality.filter((f) => f.missing > 0).length}
                        color="text-saf-muted"
                      />
                    </div>
                    {s.totalRecords > 0 && (
                      <button
                        onClick={() =>
                          setExpandedDataset(
                            expandedDataset === result.dataset ? null : result.dataset
                          )
                        }
                        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-saf-blue hover:text-saf-indigo"
                      >
                        {expandedDataset === result.dataset ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        Preview records
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Dataset preview */}
            {expandedDataset && (
              <DatasetPreview
                result={results.find((r) => r.dataset === expandedDataset)!}
              />
            )}

            {/* Processing log toggle */}
            <div>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-saf-text hover:text-saf-blue"
              >
                <History className="h-4 w-4 text-saf-indigo" />
                Processing History
                {showLogs ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {showLogs && (
                <div className="mt-3 overflow-x-auto rounded-xl border border-saf-border">
                  {logs.length === 0 ? (
                    <p className="py-8 text-center text-sm text-saf-muted">No processing runs recorded yet.</p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-saf-border bg-saf-bg">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Dataset</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Started</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Received</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Clean</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Invalid</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Incomplete</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Duplicate</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Review</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-saf-border">
                        {logs.map((log) => (
                          <tr key={log.id} className="transition-colors hover:bg-saf-bg">
                            <td className="px-4 py-3 text-sm font-medium text-saf-text">
                              {DATASET_META[log.dataset]?.label ?? log.dataset}
                            </td>
                            <td className="px-4 py-3 text-sm text-saf-muted">
                              {new Date(log.processing_started).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-saf-muted">{log.records_received}</td>
                            <td className="px-4 py-3 text-sm font-medium text-saf-green">{log.records_clean}</td>
                            <td className="px-4 py-3 text-sm font-medium text-saf-red">{log.records_invalid}</td>
                            <td className="px-4 py-3 text-sm font-medium text-saf-yellow">{log.records_incomplete}</td>
                            <td className="px-4 py-3 text-sm font-medium text-saf-orange">{log.records_duplicate}</td>
                            <td className="px-4 py-3 text-sm font-medium text-saf-blue">{log.records_needs_review}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 rounded-full bg-saf-green/10 px-2 py-0.5 text-xs font-semibold text-saf-green">
                                <CheckCircle2 className="h-3 w-3" />
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function QualityStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-saf-muted">{label}</p>
    </div>
  );
}

function DatasetPreview({ result }: { result: PreprocessingResult }) {
  const records = result.processedRecords;
  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-saf-border bg-saf-bg p-6 text-center">
        <p className="text-sm text-saf-muted">No records to preview for this dataset.</p>
      </div>
    );
  }

  // Determine which columns to show from the first record
  const sampleRecord = records[0].record;
  const columns = Object.keys(sampleRecord).filter(
    (k) => k !== 'created_at' && k !== 'updated_at'
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-saf-border">
      <table className="w-full min-w-max">
        <thead>
          <tr className="border-b border-saf-border bg-saf-bg">
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted sticky left-0 bg-saf-bg">
              Status
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-saf-muted whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-saf-border">
          {records.slice(0, 50).map((pr) => {
            const badge = STATUS_BADGE[pr.analysis.status] ?? STATUS_BADGE['Needs Review'];
            const BadgeIcon = badge.icon;
            return (
              <tr key={pr.id} className="transition-colors hover:bg-saf-bg">
                <td className="px-4 py-3 sticky left-0 bg-saf-white whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}
                    title={pr.analysis.issues.join('; ') || 'No issues'}
                  >
                    <BadgeIcon className="h-3 w-3" />
                    {pr.analysis.status}
                  </span>
                </td>
                {columns.map((col) => {
                  const val = pr.record[col];
                  const display =
                    val === null || val === undefined
                      ? '—'
                      : typeof val === 'boolean'
                        ? val ? 'true' : 'false'
                        : typeof val === 'string' && val.length > 40
                          ? val.slice(0, 37) + '...'
                          : String(val);
                  return (
                    <td
                      key={col}
                      className={`px-4 py-3 text-sm whitespace-nowrap ${
                        val === null || val === undefined
                          ? 'text-saf-muted italic'
                          : 'text-saf-text'
                      }`}
                    >
                      {display}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {records.length > 50 && (
        <div className="border-t border-saf-border bg-saf-bg px-4 py-2 text-center text-xs text-saf-muted">
          Showing 50 of {records.length} records
        </div>
      )}
    </div>
  );
}
