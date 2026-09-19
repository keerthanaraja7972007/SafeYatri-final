import { supabase } from '@/lib/supabase';
import type { TourismContext, TourismContextInput } from '@/types/tourismContext';

export async function getTourismContext(): Promise<TourismContext[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('tourism_context')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as TourismContext[];
}

export async function getTourismContextByTouristPlace(touristPlaceId: string): Promise<TourismContext[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('tourism_context')
    .select('*')
    .eq('tourist_place_id', touristPlaceId)
    .order('date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as TourismContext[];
}

export async function getTourismContextByDistrict(district: string): Promise<TourismContext[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('tourism_context')
    .select('*')
    .eq('district', district)
    .order('date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as TourismContext[];
}

export async function createTourismContext(input: TourismContextInput): Promise<TourismContext> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('tourism_context')
    .insert({
      tourist_place_id: input.tourist_place_id ?? null,
      district: input.district ?? null,
      date: input.date,
      season: input.season ?? null,
      tourism_event: input.tourism_event ?? null,
      holiday_indicator: input.holiday_indicator ?? false,
      source: input.source,
    })
    .select()
    .single();

  if (error) throw error;
  return data as TourismContext;
}
