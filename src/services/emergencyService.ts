import { supabase } from '@/lib/supabase';
import type { EmergencyService, EmergencyServiceInput, EmergencyServiceType } from '@/types/emergencyServices';

export async function getEmergencyServices(): Promise<EmergencyService[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('emergency_services')
    .select('*')
    .order('district', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as EmergencyService[];
}

export async function getEmergencyServicesByDistrict(district: string): Promise<EmergencyService[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('emergency_services')
    .select('*')
    .eq('district', district)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as EmergencyService[];
}

export async function getEmergencyServicesByType(type: EmergencyServiceType): Promise<EmergencyService[]> {
  if (!supabase) throw new Error('Database is not configured.');

  const { data, error } = await supabase
    .from('emergency_services')
    .select('*')
    .eq('type', type)
    .order('district', { ascending: true });

  if (error) throw error;
  return (data ?? []) as EmergencyService[];
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
