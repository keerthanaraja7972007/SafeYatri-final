import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/i18n';
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AlertCircle, CalendarDays, LocateFixed, MapPin, Search, ShieldCheck, Thermometer, Wind, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getTouristPlaces, isSupabaseConfigured } from '@/services/touristPlacesService';
import { getRecentWeatherDataByTouristPlace } from '@/services/weatherDataService';
import { fetchDrivingRoute } from '@/services/routingService';
import type { RouteResult } from '@/services/routingService';
import type { TouristPlace } from '@/types/touristPlaces';
import type { WeatherData } from '@/types/weatherData';
import 'leaflet/dist/leaflet.css';
import './SafetyMap.css';

type LoadState = 'loading' | 'success' | 'empty' | 'error';
type LocationState = 'idle' | 'loading' | 'active' | 'error';
type RoutingState = 'idle' | 'loading' | 'success' | 'error';
type GeoFenceState = 'outside' | 'inside' | 'idle';
const tamilNaduCenter: [number, number] = [10.9, 78.4];

function createPlaceIcon(selected: boolean) {
  return L.divIcon({
    className: 'safeyatri-place-marker',
    html: `<span class="safeyatri-place-marker__pin${selected ? ' is-selected' : ''}"><span></span></span>`,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -36],
  });
}

const userLocationIcon = L.divIcon({
  className: 'safeyatri-user-marker',
  html: '<span class="safeyatri-user-marker__dot"><span></span></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -16],
});

function calculateDistanceMeters(
  userLocation: [number, number],
  destination: TouristPlace | null
): number | null {
  if (!destination) return null;
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(destination.latitude - userLocation[0]);
  const longitudeDelta = toRadians(destination.longitude - userLocation[1]);
  const latitudeOne = toRadians(userLocation[0]);
  const latitudeTwo = toRadians(destination.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeOne) * Math.cos(latitudeTwo) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function formatDistance(distanceMeters: number | null): string {
  if (distanceMeters === null) return 'Select a destination to calculate distance.';
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m away`;
  return `${(distanceMeters / 1000).toFixed(1)} km away`;
}

function formatRouteDuration(durationSeconds: number): string {
  const minutes = Math.round(durationSeconds / 60);
  if (minutes < 60) return `${minutes} min estimated`; 
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} hr ${remainingMinutes} min estimated`;
}

function isWithinDemoZone(userLocation: [number, number] | null, destination: TouristPlace | null): boolean {
  if (!userLocation || !destination) return false;
  const distance = calculateDistanceMeters(userLocation, destination);
  return distance !== null && distance <= 1000;
}

function MapFocus({ place, userLocation, focusTarget }: { place: TouristPlace | null; userLocation: [number, number] | null; focusTarget: 'place' | 'user' }) {
  const map = useMap();

  useEffect(() => {
    if (focusTarget === 'user' && userLocation) map.flyTo(userLocation, 12, { duration: 0.8 });
    else if (focusTarget === 'place' && place) map.flyTo([place.latitude, place.longitude], 12, { duration: 0.8 });
  }, [focusTarget, map, place, userLocation]);

  return null;
}

function WeatherValue({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Thermometer }) {
  return <div className="rounded-xl border border-saf-border bg-saf-bg px-3 py-2"><div className="flex items-center gap-1.5 text-xs text-saf-muted">{Icon && <Icon className="h-3.5 w-3.5" />}{label}</div><p className="mt-1 font-bold text-saf-text">{value}</p></div>;
}

function WeatherPanel({ weather, state }: { weather: WeatherData | null; state: LoadState }) {
  if (state === 'loading') return <p className="text-sm text-saf-muted">Loading latest stored weather...</p>;
  if (state === 'error') return <p className="text-sm text-saf-red">Weather could not be loaded.</p>;
  if (!weather) return <p className="text-sm text-saf-muted">No stored weather record is available.</p>;
  const value = (field: number | string | null, suffix = '') => field === null || field === undefined ? 'Unavailable' : `${field}${suffix}`;
  return <div className="grid grid-cols-2 gap-2 text-sm">
    <WeatherValue label="Temperature" value={value(weather.temperature, ' °C')} icon={Thermometer} />
    <WeatherValue label="Humidity" value={value(weather.humidity, '%')} />
    <WeatherValue label="Precipitation" value={value(weather.precipitation, ' mm')} />
    <WeatherValue label="Wind speed" value={value(weather.wind_speed, ' km/h')} icon={Wind} />
    <WeatherValue label="Weather code" value={value(weather.weather_code)} />
    <WeatherValue label="Visibility" value={value(weather.visibility, ' km')} />
    <WeatherValue label="District" value={value(weather.district)} />
    <WeatherValue label="Source" value={value(weather.source)} />
    <p className="col-span-2 pt-1 text-xs text-saf-muted">Recorded {new Date(weather.recorded_at).toLocaleString()}</p>
  </div>;
}

function WeatherHistory({ records, state }: { records: WeatherData[]; state: LoadState }) {
  if (state === 'loading') return <p className="text-sm text-saf-muted">Loading recent historical conditions...</p>;
  if (state === 'error') return <p className="text-sm text-saf-red">Historical weather could not be loaded.</p>;
  if (records.length === 0) return <p className="text-sm text-saf-muted">No historical weather records are available for this place.</p>;

  const value = (field: number | string | null, suffix = '') => field === null || field === undefined ? 'Unavailable' : `${field}${suffix}`;
  return <div className="overflow-x-auto rounded-xl border border-saf-border">
    <table className="min-w-[720px] w-full text-left text-xs">
      <thead className="bg-saf-bg text-[11px] uppercase tracking-wide text-saf-muted"><tr><th className="px-3 py-3 font-bold">Recorded</th><th className="px-3 py-3 font-bold">Temperature</th><th className="px-3 py-3 font-bold">Humidity</th><th className="px-3 py-3 font-bold">Precipitation</th><th className="px-3 py-3 font-bold">Wind speed</th><th className="px-3 py-3 font-bold">Weather code</th></tr></thead>
      <tbody className="divide-y divide-saf-border bg-saf-white">{records.map((record) => <tr key={record.id} className="text-saf-text"><td className="whitespace-nowrap px-3 py-3 font-semibold">{new Date(record.recorded_at).toLocaleString()}</td><td className="px-3 py-3">{value(record.temperature, ' °C')}</td><td className="px-3 py-3">{value(record.humidity, '%')}</td><td className="px-3 py-3">{value(record.precipitation, ' mm')}</td><td className="px-3 py-3">{value(record.wind_speed, ' km/h')}</td><td className="px-3 py-3">{value(record.weather_code)}</td></tr>)}</tbody>
    </table>
  </div>;
}

export default function SafetyMap() {
  const { t } = useTranslation();
  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherHistory, setWeatherHistory] = useState<WeatherData[]>([]);
  const [weatherState, setWeatherState] = useState<LoadState>('loading');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<'place' | 'user'>('place');
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routingState, setRoutingState] = useState<RoutingState>('idle');
  const [routingMessage, setRoutingMessage] = useState<string | null>(null);
  const [womenSafetyMode, setWomenSafetyMode] = useState(false);
  const [routeRequest, setRouteRequest] = useState(0);
  const [geoFenceState, setGeoFenceState] = useState<GeoFenceState>('idle');
  const [geoFenceMessage, setGeoFenceMessage] = useState<string | null>(null);
  const lastGeoFenceState = useRef<GeoFenceState>('idle');
  const watchId = useRef<number | null>(null);
  const routeAbortController = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoadState('error'); return; }
    getTouristPlaces().then((data) => {
      setPlaces(data); setSelectedId(data[0]?.id ?? null); setLoadState(data.length > 0 ? 'success' : 'empty');
    }).catch(() => setLoadState('error'));
  }, []);

  const selectedPlace = places.find((place) => place.id === selectedId) ?? null;
  const filteredPlaces = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? places.filter((place) => `${place.name} ${place.district}`.toLowerCase().includes(query)) : places;
  }, [places, search]);

  useEffect(() => {
    if (!selectedPlace) { setWeather(null); setWeatherHistory([]); return; }
    setWeatherState('loading');
    getRecentWeatherDataByTouristPlace(selectedPlace.id).then((records) => {
      setWeather(records[0] ?? null); setWeatherHistory(records); setWeatherState('success');
    }).catch(() => setWeatherState('error'));
  }, [selectedPlace]);

  useEffect(() => {
    const nextState = userLocation && selectedPlace
      ? isWithinDemoZone(userLocation, selectedPlace) ? 'inside' : 'outside'
      : 'idle';
    setGeoFenceState(nextState);
    if (nextState !== lastGeoFenceState.current) {
      if (nextState === 'inside') setGeoFenceMessage('Entered DEMO configured proximity zone. This is not an unsafe-area designation.');
      if (nextState === 'outside' && lastGeoFenceState.current === 'inside') setGeoFenceMessage('Exited DEMO configured proximity zone.');
      lastGeoFenceState.current = nextState;
    }
  }, [selectedPlace, userLocation]);

  useEffect(() => {
    if (!userLocation || !selectedPlace || locationState !== 'active') return;
    setRoutingState('loading');
    setRoutingMessage(null);
    routeAbortController.current?.abort();
    const controller = new AbortController();
    routeAbortController.current = controller;
    fetchDrivingRoute(
      { latitude: userLocation[0], longitude: userLocation[1] },
      { latitude: selectedPlace.latitude, longitude: selectedPlace.longitude },
      controller.signal
    ).then((result) => {
      if (!controller.signal.aborted) { setRoute(result); setRoutingState('success'); }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) { setRoute(null); setRoutingState('error'); setRoutingMessage(error instanceof Error ? error.message : 'Route could not be calculated.'); }
    });
    return () => controller.abort();
  }, [locationState, selectedPlace, userLocation, womenSafetyMode, routeRequest]);

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current);
    routeAbortController.current?.abort();
  }, []);

  const selectPlace = (place: TouristPlace) => {
    setSelectedId(place.id);
    setLocationMessage(null);
    setFocusTarget('place');
    setRoute(null);
    setRoutingState('idle');
    setRoutingMessage(null);
    setRouteRequest((current) => current + 1);
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationState('error');
      setLocationMessage('Location services are not available in this browser.');
      return;
    }
    if (watchId.current !== null) return;
    setLocationState('loading');
    setLocationMessage(null);
    watchId.current = navigator.geolocation.watchPosition(({ coords }) => {
      setUserLocation([coords.latitude, coords.longitude]);
      setFocusTarget((current) => current === 'place' ? 'user' : current);
      setLocationState('active');
      setLocationMessage(null);
    }, (error) => {
      const message = error.code === error.PERMISSION_DENIED
        ? 'Location permission was denied.'
        : error.code === error.TIMEOUT
          ? 'Location request timed out. Tracking will keep trying.'
          : 'Your location is currently unavailable. Tracking will keep trying.';
      setLocationState('error');
      setLocationMessage(message);
      if (error.code === error.PERMISSION_DENIED && watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };

  const stopLocationTracking = () => {
    if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current);
    watchId.current = null;
    setLocationState('idle');
    setUserLocation(null);
    setLocationMessage(null);
    setFocusTarget('place');
    setRoute(null);
    setRoutingState('idle');
    setGeoFenceState('idle');
    setGeoFenceMessage(null);
    lastGeoFenceState.current = 'idle';
  };

  const distanceMeters = calculateDistanceMeters(userLocation ?? [0, 0], selectedPlace);
  const demoZoneRadiusMeters = 1000;

  return <div className="min-h-screen bg-saf-bg">
    <Navbar />
    <main className="mx-auto max-w-[1600px] px-4 pb-8 pt-24 sm:px-6 lg:px-8">
      <div className="mb-4 flex justify-end">
        <Link
          to="/ar-safety"
          className="inline-flex items-center justify-center rounded-xl border border-saf-blue px-4 py-2.5 text-sm font-bold text-saf-blue transition hover:bg-saf-blue/10"
        >
          {t('openArSafety')}
        </Link>
      </div>
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="flex items-center gap-2 text-sm font-semibold text-saf-blue"><MapPin className="h-4 w-4" />Tamil Nadu Explorer</div><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-saf-text sm:text-4xl">Tourist Safety Map</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-saf-muted">Explore verified tourist places and their latest stored weather conditions. Safety risk modeling is pending validation.</p></div><button onClick={locationState === 'active' ? stopLocationTracking : startLocationTracking} disabled={locationState === 'loading'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-saf-blue px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-saf-indigo disabled:cursor-wait disabled:opacity-70"><LocateFixed className="h-4 w-4" />{locationState === 'loading' ? 'Enabling location...' : locationState === 'active' ? 'Stop location' : 'Enable location'}</button></div>
      {locationState !== 'idle' && <div className="mb-4 flex flex-col gap-2 rounded-xl border border-saf-border bg-saf-white px-4 py-3 text-sm shadow-soft sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-saf-text">{locationState === 'active' ? 'Live location tracking enabled' : locationState === 'loading' ? 'Requesting location permission...' : 'Location tracking unavailable'}</p>{userLocation && <p className="mt-1 text-xs text-saf-muted">Latitude {userLocation[0].toFixed(6)} · Longitude {userLocation[1].toFixed(6)}</p>}</div>{locationState === 'active' && <p className="font-bold text-saf-blue">{formatDistance(distanceMeters)}</p>}</div>}
      {locationMessage && <div className="mb-4 flex items-center justify-between rounded-xl border border-saf-orange/20 bg-saf-orange/10 px-4 py-3 text-sm text-saf-text"><span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-saf-orange" />{locationMessage}</span><button onClick={() => setLocationMessage(null)} aria-label="Dismiss location message"><X className="h-4 w-4" /></button></div>}
      {geoFenceMessage && <div className="mb-4 flex items-center justify-between rounded-xl border border-saf-blue/20 bg-saf-blue/10 px-4 py-3 text-sm text-saf-text"><span><strong>Geo-fence notice:</strong> {geoFenceMessage}</span><button onClick={() => setGeoFenceMessage(null)} aria-label="Dismiss geo-fence notice"><X className="h-4 w-4" /></button></div>}
      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="order-2 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-saf-border bg-saf-white shadow-card lg:order-1 lg:h-[calc(100vh-190px)]"><div className="border-b border-saf-border p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-saf-muted">Destinations</p><p className="mt-1 text-lg font-extrabold text-saf-text">{filteredPlaces.length} places</p></div><span className="rounded-full bg-saf-blue/10 px-2.5 py-1 text-xs font-bold text-saf-blue">18 total</span></div><label className="relative mt-4 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-saf-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tourist places..." className="w-full rounded-xl border border-saf-border bg-saf-bg py-2.5 pl-9 pr-3 text-sm text-saf-text outline-none transition focus:border-saf-blue focus:ring-2 focus:ring-saf-blue/10" /></label></div><div className="no-scrollbar max-h-[390px] overflow-y-auto p-2 lg:max-h-none lg:flex-1">{loadState === 'loading' && <p className="p-4 text-sm text-saf-muted">Loading tourist places...</p>}{loadState === 'error' && <p className="p-4 text-sm text-saf-red">Tourist places could not be loaded.</p>}{loadState === 'empty' && <p className="p-4 text-sm text-saf-muted">No active tourist places found.</p>}{loadState === 'success' && filteredPlaces.length === 0 && <p className="p-4 text-sm text-saf-muted">No places match your search.</p>}{filteredPlaces.map((place) => { const selected = place.id === selectedId; return <button key={place.id} onClick={() => selectPlace(place)} className={`group mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${selected ? 'bg-saf-blue text-white shadow-soft' : 'text-saf-text hover:bg-saf-bg'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-white/15' : 'bg-saf-blue/10 text-saf-blue'}`}><MapPin className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{place.name}</span><span className={`mt-0.5 block truncate text-xs ${selected ? 'text-white/75' : 'text-saf-muted'}`}>{place.district} · {place.category}</span></span><span className={`text-xs font-bold ${selected ? 'text-white' : 'text-saf-blue'}`}>View</span></button>; })}</div></aside>
        <section className="order-1 flex min-h-0 flex-col gap-4 lg:order-2"><div className="grid gap-3 xl:grid-cols-[1fr_auto]"><div className="rounded-2xl border border-saf-border bg-saf-white p-4 shadow-card"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Smart route</p><p className="mt-1 text-sm font-bold text-saf-text">{userLocation ? 'Current location' : 'Enable location to choose a source'} <span className="px-1 text-saf-muted">to</span> {selectedPlace?.name ?? 'Select a destination'}</p></div><button onClick={() => setRouteRequest((current) => current + 1)} disabled={!userLocation || !selectedPlace || routingState === 'loading'} className="rounded-xl bg-saf-blue px-4 py-2.5 text-sm font-bold text-white transition hover:bg-saf-indigo disabled:cursor-not-allowed disabled:opacity-50">{routingState === 'loading' ? 'Calculating...' : 'Calculate route'}</button></div>{routingState === 'success' && route && <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-saf-muted"><span><strong className="text-saf-text">{(route.distanceMeters / 1000).toFixed(1)} km</strong> road distance</span><span><strong className="text-saf-text">{formatRouteDuration(route.durationSeconds)}</strong></span></div>}{routingState === 'error' && <p className="mt-3 text-sm text-saf-red">{routingMessage}</p>}{routingState === 'idle' && <p className="mt-3 text-xs text-saf-muted">{!userLocation ? 'Enable location to calculate a road route.' : !selectedPlace ? 'Select a tourist destination to calculate a route.' : 'Ready to calculate a road route.'}</p>}</div><label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-saf-border bg-saf-white p-4 shadow-card"><input type="checkbox" checked={womenSafetyMode} onChange={(event) => setWomenSafetyMode(event.target.checked)} className="h-4 w-4 accent-saf-blue" /><span><span className="block text-sm font-bold text-saf-text">Women Safety Mode</span><span className="mt-0.5 block text-xs text-saf-muted">{womenSafetyMode ? 'Active · configured data only' : 'Off'}</span></span></label></div><div className="rounded-xl border border-saf-border bg-saf-white px-4 py-3 text-xs text-saf-muted"><strong className="text-saf-text">Geo-fence:</strong> {geoFenceState === 'inside' ? 'Inside DEMO configured proximity zone' : geoFenceState === 'outside' ? 'Outside configured zone' : 'Waiting for live location'} · 1 km demonstration radius around the selected destination. This is not an unsafe-area claim.{womenSafetyMode && ' Women Safety Mode has no police, hospital, or road-safety dataset to apply yet.'}</div><div className="relative h-[500px] overflow-hidden rounded-2xl border border-saf-border bg-slate-200 shadow-card lg:h-[calc(100vh-190px)]"><MapContainer center={tamilNaduCenter} zoom={7} scrollWheelZoom className="h-full w-full"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapFocus place={selectedPlace} userLocation={userLocation} focusTarget={focusTarget} />{places.map((place) => <Marker key={place.id} position={[place.latitude, place.longitude]} icon={createPlaceIcon(place.id === selectedId)} eventHandlers={{ click: () => selectPlace(place) }}><Popup><div className="min-w-[190px]"><p className="font-extrabold text-saf-text">{place.name}</p><p className="mt-1 text-xs text-saf-muted">{place.district} · {place.category}</p><p className="mt-2 text-xs text-saf-muted">{place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}</p></div></Popup></Marker>)}{selectedPlace && <Circle center={[selectedPlace.latitude, selectedPlace.longitude]} radius={demoZoneRadiusMeters} pathOptions={{ color: '#2563EB', fillColor: '#60A5FA', fillOpacity: 0.08, weight: 2, dashArray: '6 6' }} />}{userLocation && <Marker position={userLocation} icon={userLocationIcon}><Popup><div className="text-sm"><p className="font-extrabold text-saf-text">Your current location</p><p className="mt-1 text-xs text-saf-muted">{userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}</p><p className="mt-1 text-xs font-bold text-saf-blue">{formatDistance(distanceMeters)}</p></div></Popup></Marker>}{route && <Polyline positions={route.coordinates} pathOptions={{ color: womenSafetyMode ? '#16A34A' : '#4F46E5', weight: 5, opacity: 0.82 }} />}</MapContainer><div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-saf-border bg-white/95 px-3 py-2 shadow-soft"><p className="text-xs font-bold text-saf-text">Tamil Nadu</p><p className="text-[11px] text-saf-muted">OpenStreetMap</p></div></div>
          {selectedPlace && <div className="space-y-4"><div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]"><article className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Selected destination</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">{selectedPlace.name}</h2></div><span className="rounded-full bg-saf-cyan/10 px-3 py-1 text-xs font-bold text-saf-blue">{selectedPlace.category}</span></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-saf-muted">District</p><p className="mt-1 font-bold text-saf-text">{selectedPlace.district}</p></div><div><p className="text-xs text-saf-muted">Coordinates</p><p className="mt-1 font-bold text-saf-text">{selectedPlace.latitude.toFixed(4)}, {selectedPlace.longitude.toFixed(4)}</p></div></div><p className="mt-4 border-t border-saf-border pt-4 text-sm leading-6 text-saf-muted">{selectedPlace.description}</p></article><article className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Latest stored weather</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">Current conditions</h2></div><Thermometer className="h-5 w-5 text-saf-cyan" /></div><div className="mt-4"><WeatherPanel weather={weather} state={weatherState} /></div><div className="mt-4 flex items-center gap-2 border-t border-saf-border pt-3 text-xs text-saf-muted"><ShieldCheck className="h-4 w-4 text-saf-green" />Safety risk model: Pending validation</div></article></div><article className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><div className="mb-4 flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Historical conditions</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">Recent observations</h2></div><div className="flex items-center gap-2 text-xs text-saf-muted"><CalendarDays className="h-4 w-4 text-saf-cyan" />Last 24 stored records</div></div><WeatherHistory records={weatherHistory} state={weatherState} /></article></div>}
        </section>
      </div>
      <p className="mt-5 text-center text-xs text-saf-muted">Weather values are displayed from stored source records only. This map does not provide ML risk predictions.</p>
    </main><Footer />
  </div>;
}
