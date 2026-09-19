import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { TouristPlace, TouristPlaceInput, TouristCategory } from '@/types/touristPlaces';

export async function getTouristPlaces(): Promise<TouristPlace[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('tourist_places')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as TouristPlace[];
}

export async function getTouristPlaceById(id: string): Promise<TouristPlace | null> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('tourist_places')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as TouristPlace | null;
}

export async function getTouristPlacesByDistrict(district: string): Promise<TouristPlace[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('tourist_places')
    .select('*')
    .eq('district', district)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as TouristPlace[];
}

export async function getTouristPlacesByCategory(category: TouristCategory): Promise<TouristPlace[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('tourist_places')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as TouristPlace[];
}

export async function getDistricts(): Promise<string[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('tourist_places')
    .select('district')
    .eq('is_active', true)
    .order('district', { ascending: true });

  if (error) throw error;
  const districts = (data ?? []).map((row) => row.district as string);
  return [...new Set(districts)];
}

// --- Admin operations (for future use) ---

export function validateTouristPlace(input: TouristPlaceInput): string[] {
  const errors: string[] = [];
  if (!input.name?.trim()) errors.push('Name is required.');
  if (!input.district?.trim()) errors.push('District is required.');
  if (!input.category?.trim()) errors.push('Category is required.');
  if (input.latitude < -90 || input.latitude > 90)
    errors.push('Latitude must be between -90 and 90.');
  if (input.longitude < -180 || input.longitude > 180)
    errors.push('Longitude must be between -180 and 180.');
  return errors;
}

export async function createTouristPlace(input: TouristPlaceInput): Promise<TouristPlace> {
  if (!supabase) throw new Error('Database is not configured.');

  const errors = validateTouristPlace(input);
  if (errors.length > 0) throw new Error(errors.join(' '));

  const { data, error } = await supabase
    .from('tourist_places')
    .insert({
      name: input.name,
      district: input.district,
      city: input.city ?? null,
      description: input.description,
      latitude: input.latitude,
      longitude: input.longitude,
      category: input.category,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as TouristPlace;
}

export async function updateTouristPlace(
  id: string,
  updates: Partial<TouristPlaceInput>
): Promise<TouristPlace> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('tourist_places')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as TouristPlace;
}

export async function deactivateTouristPlace(id: string): Promise<void> {
  if (!supabase) throw new Error('Database is not configured.');

  const { error } = await supabase
    .from('tourist_places')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

export { isSupabaseConfigured };
