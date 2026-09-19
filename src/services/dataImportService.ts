import { supabase } from '@/lib/supabase';
import type { DataImport, DataImportInput } from '@/types/dataImports';

export async function getDataImports(): Promise<DataImport[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('data_imports')
    .select('*')
    .order('upload_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as DataImport[];
}

export async function createDataImport(input: DataImportInput): Promise<DataImport> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('data_imports')
    .insert({
      source: input.source,
      dataset_name: input.dataset_name,
      geographic_scope: input.geographic_scope ?? null,
      record_count: input.record_count ?? 0,
      records_attempted: input.records_attempted ?? 0,
      records_inserted: input.records_inserted ?? 0,
      records_skipped: input.records_skipped ?? 0,
      records_failed: input.records_failed ?? 0,
      notes: input.notes ?? null,
      status: input.status ?? 'Pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as DataImport;
}

export async function updateDataImportStatus(
  id: string,
  status: DataImport['status'],
  recordCount?: number,
  metrics?: Partial<Pick<DataImport, 'records_attempted' | 'records_inserted' | 'records_skipped' | 'records_failed' | 'notes'>>
): Promise<DataImport> {
  if (!supabase) throw new Error('Database is not configured.');

  const updates: Record<string, unknown> = { status };
  if (recordCount !== undefined) updates.record_count = recordCount;
  if (metrics) Object.assign(updates, metrics);

  const { data, error } = await supabase
    .from('data_imports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DataImport;
}
