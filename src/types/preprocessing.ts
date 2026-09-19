import type { ProcessingStatus, RecordAnalysis, DatasetQualitySummary } from '@/utils/dataQuality';

export interface ProcessedRecord {
  id: string;
  record: Record<string, unknown>;
  analysis: RecordAnalysis;
  source: string | null;
}

export interface PreprocessingResult {
  dataset: string;
  processedRecords: ProcessedRecord[];
  summary: DatasetQualitySummary;
  processingStarted: string;
  processingCompleted: string;
}

export interface PreprocessingLogInput {
  dataset: string;
  processing_started: string;
  processing_completed: string | null;
  records_received: number;
  records_clean: number;
  records_invalid: number;
  records_incomplete: number;
  records_duplicate: number;
  records_needs_review: number;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  notes?: string | null;
}

export interface PreprocessingLog {
  id: string;
  dataset: string;
  processing_started: string;
  processing_completed: string | null;
  records_received: number;
  records_clean: number;
  records_invalid: number;
  records_incomplete: number;
  records_duplicate: number;
  records_needs_review: number;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  notes: string | null;
  created_at: string;
}

export type { ProcessingStatus, RecordAnalysis, DatasetQualitySummary };
