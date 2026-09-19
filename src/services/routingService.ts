export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
}

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

/** Fetches a road route from the public OSRM demo service. No API key is required. */
export async function fetchDrivingRoute(
  source: RoutePoint,
  destination: RoutePoint,
  signal?: AbortSignal
): Promise<RouteResult> {
  const url = `${OSRM_BASE_URL}/${source.longitude},${source.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=false`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Routing service returned HTTP ${response.status}.`);

  const payload = await response.json() as {
    code?: string;
    routes?: Array<{
      distance: number;
      duration: number;
      geometry?: { coordinates?: [number, number][] };
    }>;
  };
  const route = payload.routes?.[0];
  if (payload.code !== 'Ok' || !route?.geometry?.coordinates?.length) {
    throw new Error('No drivable route was found between the selected locations.');
  }

  return {
    coordinates: route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}
