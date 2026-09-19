export interface CrimeData {
  id: string;
  tourist_place_id: string | null;
  district: string | null;
  date: string;
  crime_category: string;
  incident_count: number | null;
  source: string;
  created_at: string;
}

export interface CrimeDataInput {
  tourist_place_id?: string | null;
  district?: string | null;
  date: string;
  crime_category: string;
  incident_count?: number | null;
  source: string;
}
