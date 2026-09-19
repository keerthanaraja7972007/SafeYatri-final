export interface TourismContext {
  id: string;
  tourist_place_id: string | null;
  district: string | null;
  date: string;
  season: string | null;
  tourism_event: string | null;
  holiday_indicator: boolean;
  source: string;
  created_at: string;
}

export interface TourismContextInput {
  tourist_place_id?: string | null;
  district?: string | null;
  date: string;
  season?: string | null;
  tourism_event?: string | null;
  holiday_indicator?: boolean;
  source: string;
}
