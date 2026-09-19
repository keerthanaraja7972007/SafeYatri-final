import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Circle as LeafletCircle, CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { AlertCircle, CloudRain, Database, Loader2, MapPin, RefreshCw, Search, Siren, Thermometer } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getTouristPlaces } from '@/services/touristPlacesService';
import { getRecentWeatherDataByTouristPlace, getWeatherDataCount } from '@/services/weatherDataService';
import { getSosSnapshot, subscribeToSos } from '@/services/sosSessionStore';
import type { TouristPlace } from '@/types/touristPlaces';
import type { WeatherData } from '@/types/weatherData';
import DataQualityDashboard from '@/components/DataQualityDashboard';
import FeatureEngineeringDashboard from '@/components/FeatureEngineeringDashboard';
import 'leaflet/dist/leaflet.css';
import '@/pages/SafetyMap.css';

type LoadState = 'loading' | 'success' | 'error' | 'empty';

export default function Admin() {
  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherRecordCount, setWeatherRecordCount] = useState<number | null>(null);
  const [weatherState, setWeatherState] = useState<LoadState>('loading');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [search, setSearch] = useState('');
  const sos = useSosSnapshot();

  const loadPlaces = () => {
    if (!isSupabaseConfigured) { setLoadState('error'); return; }
    setLoadState('loading');
    Promise.all([getTouristPlaces(), getWeatherDataCount()]).then(([data, weatherCount]) => {
      setPlaces(data);
      setWeatherRecordCount(weatherCount);
      setSelectedPlaceId((current) => current ?? data[0]?.id ?? null);
      setLoadState(data.length ? 'success' : 'empty');
    }).catch(() => setLoadState('error'));
  };

  useEffect(() => { loadPlaces(); }, []);

  const selectedPlace = places.find((place) => place.id === selectedPlaceId) ?? null;
  useEffect(() => {
    if (!selectedPlace) { setWeather(null); setWeatherState('empty'); return; }
    setWeatherState('loading');
    getRecentWeatherDataByTouristPlace(selectedPlace.id).then((records) => {
      setWeather(records[0] ?? null);
      setWeatherState(records.length ? 'success' : 'empty');
    }).catch(() => setWeatherState('error'));
  }, [selectedPlace]);

  const filteredPlaces = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? places.filter((place) => `${place.name} ${place.district} ${place.category}`.toLowerCase().includes(query)) : places;
  }, [places, search]);

  return <div className="min-h-screen bg-saf-bg"><Navbar /><main className="mx-auto max-w-[1600px] px-4 pb-12 pt-24 sm:px-6 lg:px-8">
    <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="flex items-center gap-2 text-sm font-bold text-saf-indigo"><Database className="h-4 w-4" />Admin monitoring</div><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-saf-text">SAFEYATRI operations</h1><p className="mt-2 text-sm text-saf-muted">Read-only monitoring of available application data and the current browser SOS prototype.</p></div><button onClick={loadPlaces} disabled={loadState === 'loading'} className="inline-flex items-center justify-center gap-2 rounded-xl border border-saf-border bg-saf-white px-4 py-2.5 text-sm font-bold text-saf-text shadow-soft disabled:opacity-50"><RefreshCw className={loadState === 'loading' ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />Refresh</button></header>

    {loadState === 'loading' && <LoadingState />}
    {loadState === 'error' && <ErrorState onRetry={loadPlaces} />}
    {loadState !== 'loading' && loadState !== 'error' && <div className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Tourist places" value={places.length ? String(places.length) : 'Unavailable'} icon={MapPin} /><Metric label="Weather records" value={weatherRecordCount === null ? 'Unavailable' : String(weatherRecordCount)} icon={CloudRain} /><Metric label="Geo-fence" value="1 DEMO zone" icon={MapPin} /><Metric label="Active SOS" value={sos.activeSession ? 'Active' : 'None'} icon={Siren} /></div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]"><section className="rounded-2xl border border-saf-border bg-saf-white shadow-card"><div className="border-b border-saf-border p-5"><p className="text-xs font-bold uppercase tracking-wider text-saf-muted">Tourist place monitoring</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">{filteredPlaces.length} places</h2><label className="relative mt-4 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-saf-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search places, districts, categories" className="w-full rounded-xl border border-saf-border bg-saf-bg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-saf-blue" /></label></div><div className="max-h-[520px] overflow-y-auto p-2">{filteredPlaces.map((place) => <button key={place.id} onClick={() => setSelectedPlaceId(place.id)} className={`mb-1 w-full rounded-xl p-3 text-left ${place.id === selectedPlaceId ? 'bg-saf-blue text-white' : 'hover:bg-saf-bg'}`}><p className="text-sm font-bold">{place.name}</p><p className={`mt-1 text-xs ${place.id === selectedPlaceId ? 'text-white/75' : 'text-saf-muted'}`}>{place.district} · {place.category}</p></button>)}</div></section><section className="space-y-6"><div className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Selected place</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">{selectedPlace?.name ?? 'Unavailable'}</h2></div>{selectedPlace && <span className="rounded-full bg-saf-blue/10 px-3 py-1 text-xs font-bold text-saf-blue">{selectedPlace.category}</span>}</div>{selectedPlace && <div className="mt-4 grid gap-3 sm:grid-cols-4"><Info label="District" value={selectedPlace.district} /><Info label="Latitude" value={selectedPlace.latitude.toFixed(5)} /><Info label="Longitude" value={selectedPlace.longitude.toFixed(5)} /><Info label="City" value={selectedPlace.city ?? 'Unavailable'} /></div>}</div><div className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><div className="flex items-center gap-2"><Thermometer className="h-5 w-5 text-saf-cyan" /><div><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Weather monitoring</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">Latest stored observation</h2></div></div><WeatherMonitoring weather={weather} state={weatherState} /></div></section></div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]"><EmergencyMonitoring activeSession={sos.activeSession} history={sos.history} /><MapMonitoring places={places} activeSession={sos.activeSession} /></div>
      <DataQualityDashboard />
      <FeatureEngineeringDashboard />
    </div>}
  </main><Footer /></div>;
}

function useSosSnapshot() { return useSyncExternalStore(subscribeToSos, getSosSnapshot, getSosSnapshot); }

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof MapPin }) { return <div className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><Icon className="h-5 w-5 text-saf-blue" /><p className="mt-4 text-2xl font-extrabold text-saf-text">{value}</p><p className="mt-1 text-sm text-saf-muted">{label}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-saf-border bg-saf-bg p-3"><p className="text-xs text-saf-muted">{label}</p><p className="mt-1 truncate text-sm font-bold text-saf-text">{value}</p></div>; }
function LoadingState() { return <div className="flex justify-center py-24"><Loader2 className="h-9 w-9 animate-spin text-saf-blue" /></div>; }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <div className="mt-8 rounded-2xl border border-saf-red/20 bg-saf-red/10 p-6 text-center"><AlertCircle className="mx-auto h-8 w-8 text-saf-red" /><p className="mt-3 font-bold text-saf-text">Unable to load monitoring data.</p><button onClick={onRetry} className="mt-4 rounded-xl bg-saf-blue px-4 py-2 text-sm font-bold text-white">Try again</button></div>; }
function WeatherMonitoring({ weather, state }: { weather: WeatherData | null; state: LoadState }) { if (state === 'loading') return <p className="mt-5 text-sm text-saf-muted">Loading stored weather...</p>; if (state === 'error') return <p className="mt-5 text-sm text-saf-red">Weather could not be loaded.</p>; if (!weather) return <p className="mt-5 text-sm text-saf-muted">No weather records available for this place.</p>; const value = (field: number | string | null, suffix = '') => field === null ? 'Unavailable' : `${field}${suffix}`; return <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5"><Info label="Temperature" value={value(weather.temperature, ' °C')} /><Info label="Humidity" value={value(weather.humidity, '%')} /><Info label="Precipitation" value={value(weather.precipitation, ' mm')} /><Info label="Wind" value={value(weather.wind_speed, ' km/h')} /><Info label="Code / recorded" value={`${value(weather.weather_code)} · ${new Date(weather.recorded_at).toLocaleString()}`} /></div>; }
function EmergencyMonitoring({ activeSession, history }: { activeSession: ReturnType<typeof getSosSnapshot>['activeSession']; history: ReturnType<typeof getSosSnapshot>['history'] }) { return <section className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><div className="flex items-center gap-2"><Siren className="h-5 w-5 text-saf-red" /><div><p className="text-xs font-bold uppercase tracking-wider text-saf-red">Prototype / Current Browser Session</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">Emergency monitoring</h2></div></div>{activeSession ? <div className="mt-5 rounded-xl border border-saf-red/20 bg-saf-red/10 p-4"><p className="font-bold text-saf-text">Active SOS session</p><p className="mt-2 text-xs text-saf-muted">ID: {activeSession.id}</p><p className="mt-1 text-sm text-saf-text">{activeSession.latitude.toFixed(6)}, {activeSession.longitude.toFixed(6)}</p><p className="mt-1 text-xs text-saf-muted">Started {new Date(activeSession.startedAt).toLocaleString()}</p><p className="mt-3 text-xs text-saf-red">No responder notification or emergency contact has been confirmed.</p></div> : <p className="mt-5 text-sm text-saf-muted">No active local SOS session.</p>}{history.length > 0 && <p className="mt-4 text-sm font-bold text-saf-text">{history.length} completed local session{history.length === 1 ? '' : 's'}</p>}</section>; }
function MapMonitoring({ places, activeSession }: { places: TouristPlace[]; activeSession: ReturnType<typeof getSosSnapshot>['activeSession'] }) { const selected = places[0]; return <section className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-saf-blue" /><div><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Map monitoring</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">Places and configured zone</h2></div></div>{selected ? <div className="mt-4 h-[360px] overflow-hidden rounded-xl"><MapContainer center={[selected.latitude, selected.longitude]} zoom={7} className="h-full w-full"><TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{places.map((place) => <Marker key={place.id} position={[place.latitude, place.longitude]}><Popup>{place.name}<br />{place.district}</Popup></Marker>)}<LeafletCircle center={[selected.latitude, selected.longitude]} radius={1000} pathOptions={{ color: '#2563EB', dashArray: '6 6', fillOpacity: 0.06 }} />{activeSession && <CircleMarker center={[activeSession.latitude, activeSession.longitude]} radius={8} pathOptions={{ color: '#DC2626', fillColor: '#FCA5A5', fillOpacity: 0.9 }}><Popup>Active local SOS location</Popup></CircleMarker>}</MapContainer></div> : <p className="mt-5 text-sm text-saf-muted">Map unavailable without tourist-place data.</p>}<p className="mt-3 text-xs text-saf-muted">The circle is a DEMO configured destination-proximity zone, not an unsafe-area designation.</p></section>; }
