import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { touristPlacesSeed } from '@/data/touristPlacesSeed';
import { attachRiskAssessments } from '@/services/riskAssessmentService';
import type { TouristPlace, TouristPlaceInput, TouristCategory } from '@/types/touristPlaces';

const DATABASE_PAGE_SIZE = 1000;
let integratedTouristPlacesPromise: Promise<TouristPlace[]> | null = null;

async function fetchAllPages<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const records: T[] = [];
  for (let from = 0; ; from += DATABASE_PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + DATABASE_PAGE_SIZE - 1);
    if (error) throw error;
    const page = data ?? [];
    records.push(...page);
    if (page.length < DATABASE_PAGE_SIZE) return records;
  }
}

function getTouristPlaceIdentity(place: Pick<TouristPlace, 'name' | 'district'>): string {
  const name = place.name.split(',')[0].normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return `${name}|${place.district.trim().toLowerCase()}`;
}

function getIntegratedTouristPlaces(): Promise<TouristPlace[]> {
  integratedTouristPlacesPromise ??= fetch(`${import.meta.env.BASE_URL}data/realWorldTouristPlaces.json`)
    .then(async (response) => {
      if (!response.ok) throw new Error(`Integrated tourist data returned HTTP ${response.status}.`);
      return response.json() as Promise<TouristPlace[]>;
    })
    .catch((error: unknown) => {
      integratedTouristPlacesPromise = null;
      throw error;
    });
  return integratedTouristPlacesPromise;
}

async function mergeRealWorldTouristPlaces(existing: TouristPlace[]): Promise<TouristPlace[]> {
  const realWorldTouristPlaces = await getIntegratedTouristPlaces();
  const existingKeys = new Set(existing.map(getTouristPlaceIdentity));
  const additions = realWorldTouristPlaces.filter((place) => !existingKeys.has(getTouristPlaceIdentity(place)));
  return attachRiskAssessments([...existing, ...additions].map((place) => ({ ...place })));
}

async function attachRiskAssessment(place: TouristPlace | null): Promise<TouristPlace | null> {
  if (!place) return null;
  return (await attachRiskAssessments([place]))[0];
}

async function getFallbackTouristPlaces(): Promise<TouristPlace[]> {
  return mergeRealWorldTouristPlaces(touristPlacesSeed);
}

function fallbackFilterByCategory(data: TouristPlace[], category: TouristCategory): TouristPlace[] {
  return data.filter((place) => place.category === category && place.is_active !== false);
}

async function resolveTouristPlaces<T>(
  request: () => Promise<T>,
  fallbackValue: () => Promise<T>
): Promise<T> {
  try {
    return await request();
  } catch {
    return fallbackValue();
  }
}

export async function getTouristPlaces(): Promise<TouristPlace[]> {
  const client = supabase;
  if (!client) return getFallbackTouristPlaces();

  return resolveTouristPlaces(async () => {
    const results = await fetchAllPages<TouristPlace>((from, to) => client
      .from('tourist_places')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range(from, to));
    return results.length > 0 ? mergeRealWorldTouristPlaces(results) : getFallbackTouristPlaces();
  }, getFallbackTouristPlaces);
}

export async function getTouristPlaceById(id: string): Promise<TouristPlace | null> {
  const client = supabase;
  if (!client) {
    const match = (await getFallbackTouristPlaces()).find((place) => place.id === id) ?? null;
    return match;
  }

  return resolveTouristPlaces(async () => {
    const { data, error } = await client
      .from('tourist_places')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    const place = (data as TouristPlace | null) ?? (await getFallbackTouristPlaces()).find((place) => place.id === id) ?? null;
    return attachRiskAssessment(place);
  }, async () => attachRiskAssessment((await getFallbackTouristPlaces()).find((place) => place.id === id) ?? null));
}

export async function getTouristPlacesByDistrict(district: string): Promise<TouristPlace[]> {
  const client = supabase;
  if (!client) {
    return (await getFallbackTouristPlaces()).filter((place) => place.district === district && place.is_active !== false);
  }

  return resolveTouristPlaces(async () => {
    const results = await fetchAllPages<TouristPlace>((from, to) => client
      .from('tourist_places')
      .select('*')
      .eq('district', district)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range(from, to));
    const places = results.length > 0 ? await mergeRealWorldTouristPlaces(results) : await getFallbackTouristPlaces();
    return places.filter((place) => place.district === district && place.is_active !== false);
  }, async () => (await getFallbackTouristPlaces()).filter((place) => place.district === district && place.is_active !== false));
}

export async function getTouristPlacesByCategory(category: TouristCategory): Promise<TouristPlace[]> {
  const client = supabase;
  if (!client) {
    return fallbackFilterByCategory(await getFallbackTouristPlaces(), category);
  }

  return resolveTouristPlaces(async () => {
    const results = await fetchAllPages<TouristPlace>((from, to) => client
      .from('tourist_places')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range(from, to));
    const places = results.length > 0 ? await mergeRealWorldTouristPlaces(results) : await getFallbackTouristPlaces();
    return fallbackFilterByCategory(places, category);
  }, async () => fallbackFilterByCategory(await getFallbackTouristPlaces(), category));
}

export async function getDistricts(): Promise<string[]> {
  const client = supabase;
  if (!client) {
    const districts = (await getFallbackTouristPlaces()).map((place) => place.district);
    return [...new Set(districts)].sort();
  }

  return resolveTouristPlaces(async () => {
    const data = await fetchAllPages<{ district: string }>((from, to) => client
      .from('tourist_places')
      .select('district')
      .eq('is_active', true)
      .order('district', { ascending: true })
      .range(from, to));
    const districts = data.map((row) => row.district);
    const realWorldTouristPlaces = await getIntegratedTouristPlaces();
    districts.push(...realWorldTouristPlaces.map((place) => place.district));
    return [...new Set(districts)].sort();
  }, async () => [...new Set((await getFallbackTouristPlaces()).map((place) => place.district))].sort());
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
  return (await attachRiskAssessment(data as TouristPlace))!;
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
  return (await attachRiskAssessment(data as TouristPlace))!;
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
