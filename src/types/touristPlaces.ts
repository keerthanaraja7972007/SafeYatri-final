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

export type TouristRiskLevel = 'LOW RISK' | 'MODERATE RISK' | 'HIGH RISK';

export interface TouristRiskAssessment {
  place_id: string;
  risk_level: TouristRiskLevel;
  risk_score: number;
  kmeans_cluster: number;
  isolation_forest_anomaly: number;
  explanation: string;
  top_positive_safety_factors: string;
  top_limited_access_factors: string;
  top_contextual_risk_factors: string;
}

export interface TouristPlace {
  id: string;
  name: string;
  district: string;
  city: string | null;
  location_label?: string | null;
  name_ta?: string | null;
  source_url?: string | null;
  description: string;
  latitude: number;
  longitude: number;
  category: TouristCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  risk_assessment?: TouristRiskAssessment | null;
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
