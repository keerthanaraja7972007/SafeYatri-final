export type DataSourceCategory = 'Weather' | 'Crime' | 'Tourism' | 'Emergency' | 'Geographic';

export type DataSourceStatus =
  | 'Connected'
  | 'Available for Integration'
  | 'Manual Import Required'
  | 'Pending Verification';

export interface DataSource {
  id: string;
  name: string;
  category: DataSourceCategory;
  provider: string | null;
  description: string | null;
  source_url: string | null;
  geographic_scope: string | null;
  update_frequency: string | null;
  status: DataSourceStatus;
  is_active: boolean;
  created_at: string;
}

export interface DataSourceInput {
  name: string;
  category: DataSourceCategory;
  provider?: string | null;
  description?: string | null;
  source_url?: string | null;
  geographic_scope?: string | null;
  update_frequency?: string | null;
  status?: DataSourceStatus;
  is_active?: boolean;
}
