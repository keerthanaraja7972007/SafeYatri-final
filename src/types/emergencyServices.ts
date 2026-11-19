export type EmergencyServiceType =
  | 'Police'
  | 'Hospital'
  | 'Ambulance'
  | 'Fire & Rescue'
  | 'Tourist Assistance';

export interface EmergencyService {
  id: string;
  name: string;
  type: EmergencyServiceType;
  facility_subtype?: string | null;
  district: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  availability_status: string | null;
  source: string;
  created_at: string;
}

export interface EmergencyServiceInput {
  name: string;
  type: EmergencyServiceType;
  district: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  availability_status?: string | null;
  source: string;
}
