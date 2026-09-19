export type TouristCategory =
  | 'Heritage'
  | 'Beach'
  | 'Hill Station'
  | 'Temple'
  | 'Wildlife'
  | 'Waterfall'
  | 'Adventure'
  | 'Cultural'
  | 'Pilgrimage';

export interface TouristPlace {
  id: string;
  name: string;
  district: string;
  city: string | null;
  description: string;
  latitude: number;
  longitude: number;
  category: TouristCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TouristPlaceInput {
  name: string;
  district: string;
  city?: string | null;
  description: string;
  latitude: number;
  longitude: number;
  category: TouristCategory;
  is_active?: boolean;
}
