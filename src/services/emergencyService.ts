import { supabase } from '@/lib/supabase';
import type { EmergencyService, EmergencyServiceInput, EmergencyServiceType } from '@/types/emergencyServices';

const DATABASE_PAGE_SIZE = 1000;
let integratedServicesPromise: Promise<EmergencyService[]> | null = null;

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

function getEmergencyServiceIdentity(service: EmergencyService): string {
  const name = service.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return `${name}|${service.district.trim().toLowerCase()}|${service.latitude?.toFixed(4) ?? ''}|${service.longitude?.toFixed(4) ?? ''}`;
}

async function mergeRealWorldEmergencyServices(existing: EmergencyService[]): Promise<EmergencyService[]> {
  integratedServicesPromise ??= fetch(`${import.meta.env.BASE_URL}data/realWorldEmergencyServices.json`)
    .then(async (response) => {
      if (!response.ok) throw new Error(`Integrated emergency data returned HTTP ${response.status}.`);
      return response.json() as Promise<EmergencyService[]>;
    })
    .catch((error: unknown) => {
      integratedServicesPromise = null;
      throw error;
    });
  const realWorldEmergencyServices = await integratedServicesPromise;
  const existingKeys = new Set(existing.map(getEmergencyServiceIdentity));
  const additions = realWorldEmergencyServices.filter((service) => !existingKeys.has(getEmergencyServiceIdentity(service)));
  return [...existing, ...additions];
}

async function getFallbackEmergencyServices(): Promise<EmergencyService[]> {
  return mergeRealWorldEmergencyServices([]);
}

export async function getEmergencyServices(): Promise<EmergencyService[]> {
  const client = supabase;
  if (!client) return getFallbackEmergencyServices();

  try {
    const records = await fetchAllPages<EmergencyService>((from, to) => client
      .from('emergency_services')
      .select('*')
      .order('district', { ascending: true })
      .order('name', { ascending: true })
      .range(from, to));
    return mergeRealWorldEmergencyServices(records);
  } catch {
    return getFallbackEmergencyServices();
  }
}

export async function getEmergencyServicesByDistrict(district: string): Promise<EmergencyService[]> {
  const client = supabase;
  if (!client) {
    return (await getFallbackEmergencyServices()).filter((service) => service.district === district);
  }

  try {
    const records = await fetchAllPages<EmergencyService>((from, to) => client
      .from('emergency_services')
      .select('*')
      .eq('district', district)
      .order('name', { ascending: true })
      .range(from, to));
    const services = await mergeRealWorldEmergencyServices(records);
    return services.filter((service) => service.district === district);
  } catch {
    return (await getFallbackEmergencyServices()).filter((service) => service.district === district);
  }
}

export async function getEmergencyServicesByType(type: EmergencyServiceType): Promise<EmergencyService[]> {
  const client = supabase;
  if (!client) {
    return (await getFallbackEmergencyServices()).filter((service) => service.type === type);
  }

  try {
    const records = await fetchAllPages<EmergencyService>((from, to) => client
      .from('emergency_services')
      .select('*')
      .eq('type', type)
      .order('district', { ascending: true })
      .range(from, to));
    const services = await mergeRealWorldEmergencyServices(records);
    return services.filter((service) => service.type === type);
  } catch {
    return (await getFallbackEmergencyServices()).filter((service) => service.type === type);
  }
}

export async function createEmergencyService(input: EmergencyServiceInput): Promise<EmergencyService> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('emergency_services')
    .insert({
      name: input.name,
      type: input.type,
      district: input.district,
      address: input.address ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      phone: input.phone ?? null,
      availability_status: input.availability_status ?? null,
      source: input.source,
    })
    .select()
    .single();

  if (error) throw error;
  return data as EmergencyService;
}
