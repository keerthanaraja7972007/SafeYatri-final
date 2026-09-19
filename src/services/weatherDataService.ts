import { supabase } from '@/lib/supabase';
import type { WeatherData, WeatherDataInput } from '@/types/weatherData';

export async function getWeatherData(): Promise<WeatherData[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const pageSize = 1000;
  const records: WeatherData[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('weather_data')
      .select('*')
      .order('recorded_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    records.push(...((data ?? []) as WeatherData[]));
    if (!data || data.length < pageSize) break;
  }

  return records;
}

export async function getWeatherDataCount(): Promise<number> {
  if (!supabase) throw new Error('Database is not configured.');

  const { count, error } = await supabase
    .from('weather_data')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  return count ?? 0;
}

export async function getWeatherDataByTouristPlace(touristPlaceId: string): Promise<WeatherData[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('weather_data')
    .select('*')
    .eq('tourist_place_id', touristPlaceId)
    .order('recorded_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as WeatherData[];
}

export async function getRecentWeatherDataByTouristPlace(
  touristPlaceId: string,
  limit = 24
): Promise<WeatherData[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('weather_data')
    .select('*')
    .eq('tourist_place_id', touristPlaceId)
    .order('recorded_at', { ascending: false })
    .range(0, Math.max(0, limit - 1));

  if (error) throw error;
  return (data ?? []) as WeatherData[];
}

export async function getWeatherDataByDistrict(district: string): Promise<WeatherData[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('weather_data')
    .select('*')
    .eq('district', district)
    .order('recorded_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as WeatherData[];
}

export async function createWeatherData(input: WeatherDataInput): Promise<WeatherData> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('weather_data')
    .insert({
      tourist_place_id: input.tourist_place_id ?? null,
      district: input.district ?? null,
      recorded_at: input.recorded_at,
      temperature: input.temperature ?? null,
      humidity: input.humidity ?? null,
      precipitation: input.precipitation ?? null,
      visibility: input.visibility ?? null,
      wind_speed: input.wind_speed ?? null,
      weather_code: input.weather_code ?? null,
      source: input.source,
    })
    .select()
    .single();

  if (error) throw error;
  return data as WeatherData;
}
