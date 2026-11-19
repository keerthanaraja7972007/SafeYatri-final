import type { TouristRiskLevel } from '@/types/touristPlaces';

export function getRiskMarkerClass(level?: TouristRiskLevel | null): string {
  if (level === 'LOW RISK') return 'safeyatri-place-marker__pin--low';
  if (level === 'MODERATE RISK') return 'safeyatri-place-marker__pin--moderate';
  if (level === 'HIGH RISK') return 'safeyatri-place-marker__pin--high';
  return 'safeyatri-place-marker__pin--unavailable';
}
