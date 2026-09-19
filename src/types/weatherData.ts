export interface WeatherData {
  id: string;
  tourist_place_id: string | null;
  district: string | null;
  recorded_at: string;
  temperature: number | null;
  humidity: number | null;
  precipitation: number | null;
  visibility: number | null;
  wind_speed: number | null;
  weather_code: string | null;
  source: string;
  created_at: string;
}

export interface WeatherDataInput {
  tourist_place_id?: string | null;
  district?: string | null;
  recorded_at: string;
  temperature?: number | null;
  humidity?: number | null;
  precipitation?: number | null;
  visibility?: number | null;
  wind_speed?: number | null;
  weather_code?: string | null;
  source: string;
}
