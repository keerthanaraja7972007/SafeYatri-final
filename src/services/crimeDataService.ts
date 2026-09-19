import { supabase } from '@/lib/supabase';
import type { CrimeData, CrimeDataInput } from '@/types/crimeData';

export async function getCrimeData(): Promise<CrimeData[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('crime_data')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CrimeData[];
}

export async function getCrimeDataByDistrict(district: string): Promise<CrimeData[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('crime_data')
    .select('*')
    .eq('district', district)
    .order('date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CrimeData[];
}

export async function getCrimeDataByTouristPlace(touristPlaceId: string): Promise<CrimeData[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('crime_data')
    .select('*')
    .eq('tourist_place_id', touristPlaceId)
    .order('date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CrimeData[];
}

export async function createCrimeData(input: CrimeDataInput): Promise<CrimeData> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('crime_data')
    .insert({
      tourist_place_id: input.tourist_place_id ?? null,
      district: input.district ?? null,
      date: input.date,
      crime_category: input.crime_category,
      incident_count: input.incident_count ?? null,
      source: input.source,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CrimeData;
}
