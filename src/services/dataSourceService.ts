import { supabase } from '@/lib/supabase';
import type { DataSource, DataSourceInput, DataSourceCategory } from '@/types/dataSources';

export async function getDataSources(): Promise<DataSource[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('data_sources')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as DataSource[];
}

export async function getDataSourcesByCategory(category: DataSourceCategory): Promise<DataSource[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('data_sources')
    .select('*')
    .eq('category', category)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as DataSource[];
}

export async function getDataSourceById(id: string): Promise<DataSource | null> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('data_sources')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as DataSource | null;
}

export async function createDataSource(input: DataSourceInput): Promise<DataSource> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('data_sources')
    .insert({
      name: input.name,
      category: input.category,
      provider: input.provider ?? null,
      description: input.description ?? null,
      source_url: input.source_url ?? null,
      geographic_scope: input.geographic_scope ?? null,
      update_frequency: input.update_frequency ?? null,
      status: input.status ?? 'Pending Verification',
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DataSource;
}

export async function updateDataSource(
  id: string,
  updates: Partial<DataSourceInput>
): Promise<DataSource> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('data_sources')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DataSource;
}

export async function deleteDataSource(id: string): Promise<void> {
  if (!supabase) throw new Error('Database is not configured.');

  const { error } = await supabase.from('data_sources').delete().eq('id', id);
  if (error) throw error;
}
