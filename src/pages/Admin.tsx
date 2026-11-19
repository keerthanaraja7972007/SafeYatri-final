import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Circle as LeafletCircle, CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { AlertCircle, CloudRain, Database, Loader2, MapPin, RefreshCw, Search, Siren, Thermometer } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getTouristPlaces } from '@/services/touristPlacesService';
import { getRecentWeatherDataByTouristPlace, getWeatherDataCount } from '@/services/weatherDataService';
import { getSosSnapshot, subscribeToSos } from '@/services/sosSessionStore';
import type { TouristPlace } from '@/types/touristPlaces';
import type { WeatherData } from '@/types/weatherData';
import DataQualityDashboard from '@/components/DataQualityDashboard';
import FeatureEngineeringDashboard from '@/components/FeatureEngineeringDashboard';
import { realWorldDistrictCoverage } from '@/data/realWorldDistrictCoverage';
import 'leaflet/dist/leaflet.css';
import '@/pages/SafetyMap.css';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthContext';
import { getRiskAssessmentDistribution } from '@/services/riskAssessmentService';

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
    setLoadState('loading');
    Promise.all([getTouristPlaces(), getWeatherDataCount().catch(() => null)]).then(([data, weatherCount]) => {
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
  const integratedTouristCount = realWorldDistrictCoverage.reduce((total, entry) => total + entry.touristPlaceCount, 0);
  const integratedEmergencyCount = realWorldDistrictCoverage.reduce((total, entry) => total + entry.emergencyFacilityCount, 0);

  return <div className="min-h-screen bg-saf-bg"><Navbar /><main className="mx-auto max-w-[1600px] px-4 pb-12 pt-24 sm:px-6 lg:px-8">
    <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="flex items-center gap-2 text-sm font-bold text-saf-indigo"><Database className="h-4 w-4" />Admin monitoring</div><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-saf-text">SAFEYATRI operations</h1><p className="mt-2 text-sm text-saf-muted">Read-only monitoring of available application data and the current browser SOS prototype.</p></div><button onClick={loadPlaces} disabled={loadState === 'loading'} className="inline-flex items-center justify-center gap-2 rounded-xl border border-saf-border bg-saf-white px-4 py-2.5 text-sm font-bold text-saf-text shadow-soft disabled:opacity-50"><RefreshCw className={loadState === 'loading' ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />Refresh</button></header>

    <AdminAccountsPanel />
    {loadState === 'loading' && <LoadingState />}
    {loadState === 'error' && <ErrorState onRetry={loadPlaces} />}
    {loadState !== 'loading' && loadState !== 'error' && <div className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Tourist places" value={places.length ? String(places.length) : 'Unavailable'} icon={MapPin} /><Metric label="Weather records" value={weatherRecordCount === null ? 'Unavailable' : String(weatherRecordCount)} icon={CloudRain} /><Metric label="Geo-fence" value="1 DEMO zone" icon={MapPin} /><Metric label="Active SOS" value={sos.activeSession ? 'Active' : 'None'} icon={Siren} /></div>
      <section className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Integrated data coverage</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">{integratedTouristCount.toLocaleString()} tourist places · {integratedEmergencyCount.toLocaleString()} emergency facilities</h2><p className="mt-1 text-sm text-saf-muted">Integrated records only. Source district/location labels are preserved; aliases and localities are not merged into guessed districts.</p></div><span className="text-xs font-semibold text-saf-muted">{realWorldDistrictCoverage.length} source labels</span></div><div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-saf-border"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-saf-bg text-xs uppercase tracking-wide text-saf-muted"><tr><th className="px-3 py-2">Source district/location</th><th className="px-3 py-2 text-right">Tourist places</th><th className="px-3 py-2 text-right">Emergency facilities</th></tr></thead><tbody className="divide-y divide-saf-border">{realWorldDistrictCoverage.map((entry) => <tr key={entry.district}><th scope="row" className="px-3 py-2 font-medium text-saf-text">{entry.district}</th><td className="px-3 py-2 text-right tabular-nums">{entry.touristPlaceCount.toLocaleString()}</td><td className="px-3 py-2 text-right tabular-nums">{entry.emergencyFacilityCount.toLocaleString()}</td></tr>)}</tbody></table></div></section>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]"><section className="rounded-2xl border border-saf-border bg-saf-white shadow-card"><div className="border-b border-saf-border p-5"><p className="text-xs font-bold uppercase tracking-wider text-saf-muted">Tourist place monitoring</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">{filteredPlaces.length} places</h2><label className="relative mt-4 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-saf-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search places, districts, categories" className="w-full rounded-xl border border-saf-border bg-saf-bg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-saf-blue" /></label></div><div className="max-h-[520px] overflow-y-auto p-2">{filteredPlaces.map((place) => <button key={place.id} onClick={() => setSelectedPlaceId(place.id)} className={`mb-1 w-full rounded-xl p-3 text-left ${place.id === selectedPlaceId ? 'bg-saf-blue text-white' : 'hover:bg-saf-bg'}`}><p className="text-sm font-bold">{place.name}</p><p className={`mt-1 text-xs ${place.id === selectedPlaceId ? 'text-white/75' : 'text-saf-muted'}`}>{place.district} · {place.category}</p></button>)}</div></section><section className="space-y-6"><div className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Selected place</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">{selectedPlace?.name ?? 'Unavailable'}</h2></div>{selectedPlace && <span className="rounded-full bg-saf-blue/10 px-3 py-1 text-xs font-bold text-saf-blue">{selectedPlace.category}</span>}</div>{selectedPlace && <div className="mt-4 grid gap-3 sm:grid-cols-4"><Info label="District" value={selectedPlace.district} /><Info label="Latitude" value={selectedPlace.latitude.toFixed(5)} /><Info label="Longitude" value={selectedPlace.longitude.toFixed(5)} /><Info label="City" value={selectedPlace.city ?? 'Unavailable'} /></div>}</div><div className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><div className="flex items-center gap-2"><Thermometer className="h-5 w-5 text-saf-cyan" /><div><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Weather monitoring</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">Latest stored observation</h2></div></div><WeatherMonitoring weather={weather} state={weatherState} /></div></section></div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]"><EmergencyMonitoring activeSession={sos.activeSession} history={sos.history} /><MapMonitoring places={places} activeSession={sos.activeSession} /></div>
      <DataQualityDashboard />
      <FeatureEngineeringDashboard />
    </div>}
  </main><Footer /></div>;
}

function useSosSnapshot() { return useSyncExternalStore(subscribeToSos, getSosSnapshot, getSosSnapshot); }

type AdminUser = { id: string; email: string; full_name: string; role: string; created_at: string; last_sign_in_at: string | null };
type AdminActivity = { id: string; email: string | null; full_name: string | null; event_type: string; resource_id: string | null; created_at: string };
function AdminAccountsPanel() {
  const authState = useAuth();
  const [overview, setOverview] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [risk, setRisk] = useState<Awaited<ReturnType<typeof getRiskAssessmentDistribution>> | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState<'all' | 'login' | 'logout' | 'tourist_place_viewed' | 'risk_assessment_viewed' | 'emergency_search'>('all');
  const [activityLimit, setActivityLimit] = useState(10);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    if (authState.isDemoAdmin && authState.profile?.role !== 'admin') {
      setOverview(null); setUsers([]); setActivity([]); setLoading(false);
      setError('The built-in demo admin is a local demonstration session. Account and activity details require a Supabase-authenticated account with the admin role.');
      return;
    }
    const [summary, people, events, distribution] = await Promise.all([
      supabase?.rpc('get_safeyatri_admin_overview'),
      supabase?.rpc('get_safeyatri_admin_users'),
      supabase?.rpc('get_safeyatri_admin_activity'),
      getRiskAssessmentDistribution().catch(() => null),
    ]);
    if (summary?.error || people?.error || events?.error) setError('Account and activity data could not be loaded. Check that the SAFEYATRI auth migration is applied.');
    if (summary?.data) setOverview(summary.data as Record<string, number>);
    if (people?.data) setUsers(people.data as AdminUser[]);
    if (events?.data) setActivity(events.data as AdminActivity[]);
    setRisk(distribution);
    setLoading(false);
  }, [authState.isDemoAdmin, authState.profile?.role]);
  useEffect(() => { void load(); }, [load]);
  const shownUsers = users.filter(user => (roleFilter === 'all' || user.role === roleFilter)
    && `${user.full_name} ${user.email}`.toLowerCase().includes(search.trim().toLowerCase()));
  const totalAdmins = users.filter((user) => user.role === 'admin').length;
  const filteredActivity = activity.filter((item) => activityFilter === 'all' || item.event_type === activityFilter).slice(0, activityLimit);
  const stats = [
    ['Total registered users', overview?.total_users ?? users.length],
    ['Total admins', totalAdmins],
    ['Active users (30 days)', overview?.active_users_30d],
    ['Application events', overview?.total_events ?? activity.length],
  ] as const;
  return <section className="mt-8 space-y-6">
    <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Accounts and activity</p><h2 className="mt-1 text-2xl font-extrabold text-saf-text">Administration</h2><p className="mt-1 text-sm text-saf-muted">Active user means at least one successful login recorded in the last 30 days.</p></div><button onClick={() => void load()} disabled={loading} className="rounded-xl border border-saf-border bg-white px-4 py-2 text-sm font-bold text-saf-text disabled:opacity-50">{loading ? 'Loading…' : 'Refresh'}</button></div>
    {error && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value]) => <div key={label} className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><p className="text-2xl font-extrabold text-saf-text">{value === undefined ? loading ? 'Loading…' : 'Unavailable' : value}</p><p className="mt-1 text-sm text-saf-muted">{label}</p></div>)}</div>
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">SAFEYATRI ML Risk Assessment</p><h3 className="mt-1 text-lg font-extrabold text-saf-text">{risk ? `${risk.total.toLocaleString()} assessed places` : loading ? 'Loading risk data…' : 'Risk data unavailable'}</h3><p className="mt-1 text-xs text-saf-muted">Evidence-based risk assessment derived from available emergency-accessibility and contextual data. These categories are not guaranteed predictions of actual tourist safety.</p>{risk && <div className="mt-5 space-y-4">{(['LOW RISK', 'MODERATE RISK', 'HIGH RISK'] as const).map((level) => { const count = risk.counts[level]; const color = level === 'LOW RISK' ? 'bg-green-500' : level === 'MODERATE RISK' ? 'bg-amber-500' : 'bg-red-500'; return <div key={level}><div className="flex justify-between text-sm"><span className="font-semibold text-saf-text">{level}</span><span className="tabular-nums text-saf-muted">{count.toLocaleString()}</span></div><div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-saf-bg"><div className={`h-full rounded-full ${color}`} style={{ width: `${risk.total ? count / risk.total * 100 : 0}%` }} /></div></div>; })}</div>}</section>
      <section className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><p className="text-xs font-bold uppercase tracking-wider text-saf-red">SOS data availability</p><h3 className="mt-1 text-lg font-extrabold text-saf-text">Persistent SOS history unavailable</h3><p className="mt-2 text-sm text-saf-muted">Persistent SOS history is unavailable because SOS sessions are currently stored only in the user's browser session.</p></section>
    </div>
    <section className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">User management</p><h3 className="mt-1 text-lg font-extrabold text-saf-text">{loading ? 'Loading users…' : `${shownUsers.length} users`}</h3></div><div className="flex gap-2"><input aria-label="Search users" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name or email" className="min-w-0 rounded-xl border border-saf-border px-3 py-2 text-sm" /><select aria-label="Filter user role" value={roleFilter} onChange={event => setRoleFilter(event.target.value)} className="rounded-xl border border-saf-border px-3 py-2 text-sm"><option value="all">All roles</option><option value="user">Users</option><option value="admin">Admins</option></select></div></div><div className="mt-4 overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="border-b border-saf-border text-xs uppercase text-saf-muted"><tr><th className="px-3 py-3">Name</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Created</th><th className="px-3 py-3">Last login</th></tr></thead><tbody className="divide-y divide-saf-border">{shownUsers.map(person => <tr key={person.id}><td className="px-3 py-3 font-semibold text-saf-text">{person.full_name || '—'}</td><td className="px-3 py-3 text-saf-muted">{person.email}</td><td className="px-3 py-3 capitalize">{person.role}</td><td className="px-3 py-3 text-saf-muted">{new Date(person.created_at).toLocaleDateString()}</td><td className="px-3 py-3 text-saf-muted">{person.last_sign_in_at ? new Date(person.last_sign_in_at).toLocaleString() : 'Not recorded'}</td></tr>)}{!loading && shownUsers.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-saf-muted">No matching users.</td></tr>}</tbody></table></div></section>
    <section className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Persistent activity log</p><h3 className="mt-1 text-lg font-extrabold text-saf-text">Recent user activity</h3></div><div className="flex flex-wrap items-center gap-2"><select aria-label="Filter activity type" value={activityFilter} onChange={event => setActivityFilter(event.target.value as typeof activityFilter)} className="rounded-xl border border-saf-border px-3 py-2 text-sm"><option value="all">All</option><option value="login">Login</option><option value="logout">Logout</option><option value="tourist_place_viewed">Place Viewed</option><option value="risk_assessment_viewed">Risk Viewed</option><option value="emergency_search">Emergency Search</option></select><button onClick={() => setActivityLimit((value) => value + 10)} className="rounded-xl border border-saf-border bg-white px-3 py-2 text-sm font-bold text-saf-text">Load more</button></div></div><div className="mt-4 max-h-96 overflow-auto"><table className="min-w-[750px] w-full text-left text-sm"><thead className="sticky top-0 border-b border-saf-border bg-white text-xs uppercase text-saf-muted"><tr><th className="px-3 py-3">Type</th><th className="px-3 py-3">User</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Resource</th><th className="px-3 py-3">Timestamp</th></tr></thead><tbody className="divide-y divide-saf-border">{filteredActivity.map(event => <tr key={event.id}><td className="px-3 py-3 font-semibold text-saf-text">{event.event_type.replace(/_/g, ' ')}</td><td className="px-3 py-3 text-saf-muted">{event.full_name || '—'}</td><td className="px-3 py-3 text-saf-muted">{event.email || '—'}</td><td className="px-3 py-3 text-saf-muted">{event.resource_id || '—'}</td><td className="px-3 py-3 text-saf-muted">{new Date(event.created_at).toLocaleString()}</td></tr>)}</tbody></table>{!loading && filteredActivity.length === 0 && <p className="py-6 text-center text-sm text-saf-muted">No activity events recorded for this filter.</p>}</div></section>
  </section>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof MapPin }) { return <div className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><Icon className="h-5 w-5 text-saf-blue" /><p className="mt-4 text-2xl font-extrabold text-saf-text">{value}</p><p className="mt-1 text-sm text-saf-muted">{label}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-saf-border bg-saf-bg p-3"><p className="text-xs text-saf-muted">{label}</p><p className="mt-1 truncate text-sm font-bold text-saf-text">{value}</p></div>; }
function LoadingState() { return <div className="flex justify-center py-24"><Loader2 className="h-9 w-9 animate-spin text-saf-blue" /></div>; }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <div className="mt-8 rounded-2xl border border-saf-red/20 bg-saf-red/10 p-6 text-center"><AlertCircle className="mx-auto h-8 w-8 text-saf-red" /><p className="mt-3 font-bold text-saf-text">Unable to load monitoring data.</p><button onClick={onRetry} className="mt-4 rounded-xl bg-saf-blue px-4 py-2 text-sm font-bold text-white">Try again</button></div>; }
function WeatherMonitoring({ weather, state }: { weather: WeatherData | null; state: LoadState }) { if (state === 'loading') return <p className="mt-5 text-sm text-saf-muted">Loading stored weather...</p>; if (state === 'error') return <p className="mt-5 text-sm text-saf-red">Weather could not be loaded.</p>; if (!weather) return <p className="mt-5 text-sm text-saf-muted">No weather records available for this place.</p>; const value = (field: number | string | null, suffix = '') => field === null ? 'Unavailable' : `${field}${suffix}`; return <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5"><Info label="Temperature" value={value(weather.temperature, ' °C')} /><Info label="Humidity" value={value(weather.humidity, '%')} /><Info label="Precipitation" value={value(weather.precipitation, ' mm')} /><Info label="Wind" value={value(weather.wind_speed, ' km/h')} /><Info label="Code / recorded" value={`${value(weather.weather_code)} · ${new Date(weather.recorded_at).toLocaleString()}`} /></div>; }
function EmergencyMonitoring({ activeSession, history }: { activeSession: ReturnType<typeof getSosSnapshot>['activeSession']; history: ReturnType<typeof getSosSnapshot>['history'] }) {
  const locationText = activeSession && activeSession.latitude !== null && activeSession.longitude !== null ? `${activeSession.latitude.toFixed(6)}, ${activeSession.longitude.toFixed(6)}` : 'Location unavailable';

  return <section className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><div className="flex items-center gap-2"><Siren className="h-5 w-5 text-saf-red" /><div><p className="text-xs font-bold uppercase tracking-wider text-saf-red">Prototype / Current Browser Session</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">Emergency monitoring</h2></div></div>{activeSession ? <div className="mt-5 rounded-xl border border-saf-red/20 bg-saf-red/10 p-4"><p className="font-bold text-saf-text">Active SOS session</p><p className="mt-2 text-xs text-saf-muted">ID: {activeSession.id}</p><p className="mt-1 text-sm text-saf-text">{locationText}</p><p className="mt-1 text-xs text-saf-muted">Started {new Date(activeSession.startedAt).toLocaleString()}</p><p className="mt-3 text-xs text-saf-red">No responder notification or emergency contact has been confirmed.</p></div> : <p className="mt-5 text-sm text-saf-muted">No active local SOS session.</p>}{history.length > 0 && <p className="mt-4 text-sm font-bold text-saf-text">{history.length} completed local session{history.length === 1 ? '' : 's'}</p>}</section>;
}
function MapMonitoring({ places, activeSession }: { places: TouristPlace[]; activeSession: ReturnType<typeof getSosSnapshot>['activeSession'] }) {
  const selected = places[0];
  const activeLocation = activeSession && activeSession.latitude !== null && activeSession.longitude !== null ? [activeSession.latitude, activeSession.longitude] as [number, number] : null;

  return <section className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-saf-blue" /><div><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Map monitoring</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">Places and configured zone</h2></div></div>{selected ? <div className="mt-4 h-[360px] overflow-hidden rounded-xl"><MapContainer center={[selected.latitude, selected.longitude]} zoom={7} className="h-full w-full"><TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker key={selected.id} position={[selected.latitude, selected.longitude]}><Popup>{selected.name}<br />{selected.district}</Popup></Marker><LeafletCircle center={[selected.latitude, selected.longitude]} radius={1000} pathOptions={{ color: '#2563EB', dashArray: '6 6', fillOpacity: 0.06 }} />{activeLocation && <CircleMarker center={activeLocation} radius={8} pathOptions={{ color: '#DC2626', fillColor: '#FCA5A5', fillOpacity: 0.9 }}><Popup>Active local SOS location</Popup></CircleMarker>}</MapContainer></div> : <p className="mt-5 text-sm text-saf-muted">Map unavailable without tourist-place data.</p>}<p className="mt-3 text-xs text-saf-muted">One destination is shown in this monitoring map; all {places.length.toLocaleString()} places remain in the monitor list. The circle is a DEMO configured destination-proximity zone, not an unsafe-area designation.</p></section>;
}
