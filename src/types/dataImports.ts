export type DataImportStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';

export interface DataImport {
  id: string;
  source: string;
  dataset_name: string;
  upload_date: string;
  geographic_scope: string | null;
  record_count: number;
  records_attempted: number;
  records_inserted: number;
  records_skipped: number;
  records_failed: number;
  notes: string | null;
  status: DataImportStatus;
  created_at: string;
}

export interface DataImportInput {
  source: string;
  dataset_name: string;
  geographic_scope?: string | null;
  record_count?: number;
  records_attempted?: number;
  records_inserted?: number;
  records_skipped?: number;
  records_failed?: number;
  notes?: string | null;
  status?: DataImportStatus;
}
