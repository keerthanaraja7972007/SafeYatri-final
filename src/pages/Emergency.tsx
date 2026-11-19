import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Loader2, MapPin, PhoneCall, Search, ShieldAlert, Siren, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getEmergencyServices } from '@/services/emergencyService';
import { completeSosSession, getSosSnapshot, startSosSession, subscribeToSos } from '@/services/sosSessionStore';
import { recordActivity } from '@/services/activityService';
import type { EmergencyService, EmergencyServiceType } from '@/types/emergencyServices';

type LocationState = 'idle' | 'capturing' | 'ready' | 'error';

type FacilityFilter = 'All' | EmergencyServiceType | 'PHC';
type FacilityLoadState = 'idle' | 'loading' | 'success' | 'error';

function createSessionId() {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `sos-${Date.now()}`;
}

function errorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) return 'SOS is active, but location access is unavailable. Enable Location.';
  if (error.code === error.TIMEOUT) return 'Location capture timed out. Please try SOS again when you have a clearer signal.';
  return 'Your current location is unavailable. The SOS session remains active without coordinates.';
}

function calculateFacilityDistance(location: [number, number] | null, facility: EmergencyService): number | null {
  if (!location || facility.latitude === null || facility.longitude === null) return null;
  const radians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = radians(facility.latitude - location[0]);
  const longitudeDelta = radians(facility.longitude - location[1]);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(location[0])) * Math.cos(radians(facility.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function FacilityFinder({ location }: { location: [number, number] | null }) {
  const [facilities, setFacilities] = useState<EmergencyService[]>([]);
  const [loadState, setLoadState] = useState<FacilityLoadState>('idle');
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedType, setSelectedType] = useState<FacilityFilter>('All');
  const [visibleCount, setVisibleCount] = useState(30);

  useEffect(() => {
    if (search.trim().length < 3) return;
    const timer = window.setTimeout(() => { void recordActivity('emergency_search'); }, 1200);
    return () => window.clearTimeout(timer);
  }, [search]);

  const districts = useMemo(() => ['All', ...new Set(facilities.map((facility) => facility.district).sort())], [facilities]);
  const filteredFacilities = useMemo(() => facilities
    .map((facility) => ({ facility, distance: calculateFacilityDistance(location, facility) }))
    .filter(({ facility }) => {
      const matchesSearch = !search.trim() || `${facility.name} ${facility.district} ${facility.address ?? ''} ${facility.facility_subtype ?? ''}`.toLowerCase().includes(search.trim().toLowerCase());
      const matchesDistrict = selectedDistrict === 'All' || facility.district === selectedDistrict;
      const matchesType = selectedType === 'All'
        || (selectedType === 'PHC' ? facility.facility_subtype === 'Primary Health Centre / Clinic' : facility.type === selectedType);
      return matchesSearch && matchesDistrict && matchesType;
    })
    .sort((left, right) => location && left.distance !== null && right.distance !== null
      ? left.distance - right.distance
      : left.facility.district.localeCompare(right.facility.district) || left.facility.name.localeCompare(right.facility.name)),
  [facilities, location, search, selectedDistrict, selectedType]);

  const loadFacilities = async () => {
    setLoadState('loading');
    try {
      setFacilities(await getEmergencyServices());
      setLoadState('success');
      setVisibleCount(30);
    } catch {
      setLoadState('error');
    }
  };

  const visibleFacilities = filteredFacilities.slice(0, visibleCount);

  return <section className="mt-5 rounded-2xl border border-saf-border bg-saf-white p-6 shadow-card">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Emergency facility lookup</p>
        <h2 className="mt-1 text-xl font-extrabold text-saf-text">Police, hospitals, PHCs and response facilities</h2>
        <p className="mt-1 text-sm text-saf-muted">{loadState === 'success' ? `${facilities.length.toLocaleString()} integrated and database facilities` : 'Facility data loads only when requested.'}{location ? ' Results are ordered by distance from the active SOS location.' : ''}</p>
      </div>
      <button onClick={loadFacilities} disabled={loadState === 'loading'} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-saf-blue px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{loadState === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}{loadState === 'success' ? 'Refresh facilities' : 'Load facilities'}</button>
    </div>
    {loadState === 'error' && <p role="alert" className="mt-4 text-sm text-saf-red">Facilities could not be loaded. Please retry.</p>}
    {loadState === 'success' && <>
      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
        <label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-saf-muted" /><input value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(30); }} placeholder="Search name, address or facility type" className="w-full rounded-xl border border-saf-border bg-saf-bg py-2.5 pl-9 pr-3 text-sm" /></label>
        <select aria-label="Filter emergency facilities by type" value={selectedType} onChange={(event) => { setSelectedType(event.target.value as FacilityFilter); setVisibleCount(30); }} className="rounded-xl border border-saf-border bg-saf-bg px-3 py-2.5 text-sm">
          <option value="All">All facility types</option><option value="Police">Police stations</option><option value="Hospital">Hospitals</option><option value="PHC">PHCs / clinics</option><option value="Fire & Rescue">Fire / rescue</option><option value="Ambulance">Ambulance</option>
        </select>
        <select aria-label="Filter emergency facilities by source district label" value={selectedDistrict} onChange={(event) => { setSelectedDistrict(event.target.value); setVisibleCount(30); }} className="rounded-xl border border-saf-border bg-saf-bg px-3 py-2.5 text-sm">
          {districts.map((district) => <option key={district} value={district}>{district === 'All' ? 'All source area labels' : district}</option>)}
        </select>
      </div>
      <p className="mt-4 text-xs text-saf-muted">Showing {visibleFacilities.length} of {filteredFacilities.length} matching facilities. Source area labels are shown as supplied.</p>
      <div className="mt-3 divide-y divide-saf-border">
        {visibleFacilities.map(({ facility, distance }) => <article key={facility.id} className="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-start">
          <div><h3 className="font-bold text-saf-text">{facility.name}</h3><p className="mt-1 text-sm text-saf-muted">{facility.facility_subtype ?? facility.type} · {facility.district}</p>{facility.address && <p className="mt-1 text-xs text-saf-muted">{facility.address}</p>}{facility.phone ? <a href={`tel:${facility.phone}`} className="mt-1 inline-block text-sm font-semibold text-saf-blue">{facility.phone}</a> : <p className="mt-1 inline-block text-sm text-saf-muted">Contact information unavailable.</p>}</div>
          <div className="shrink-0 text-left sm:text-right"><p className="text-xs font-semibold text-saf-muted">{facility.availability_status ?? 'Availability not listed'}</p>{distance !== null && <p className="mt-1 text-sm font-bold text-saf-blue">{distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`} away</p>}</div>
        </article>)}
        {filteredFacilities.length === 0 && <p className="py-8 text-center text-sm text-saf-muted">No facilities match these filters.</p>}
      </div>
      {visibleCount < filteredFacilities.length && <button onClick={() => setVisibleCount((count) => count + 30)} className="mt-3 rounded-lg border border-saf-border px-4 py-2 text-sm font-semibold text-saf-text">Show more facilities</button>}
    </>}
  </section>;
}

export default function Emergency() {
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [confirmActivate, setConfirmActivate] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const { activeSession, history } = useSyncExternalStore(subscribeToSos, getSosSnapshot, getSosSnapshot);

  const startSos = () => {
    setConfirmActivate(false);
    const startedAt = new Date().toISOString();

    if (!navigator.geolocation) {
      startSosSession({
        id: createSessionId(),
        startedAt,
        endedAt: null,
        status: 'active',
        latitude: null,
        longitude: null,
        accuracy: null,
      });
      setLocationState('error');
      setLocationError('SOS is active, but location access is unavailable. Enable Location.');
      return;
    }

    setLocationState('capturing');
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      startSosSession({
        id: createSessionId(),
        startedAt,
        endedAt: null,
        status: 'active',
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy ?? null,
      });
      setLocationState('ready');
    }, (error) => {
      startSosSession({
        id: createSessionId(),
        startedAt,
        endedAt: null,
        status: 'active',
        latitude: null,
        longitude: null,
        accuracy: null,
      });
      setLocationState('error');
      setLocationError(errorMessage(error));
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };

  const closeSession = (status: 'cancelled' | 'resolved') => {
    setConfirmEnd(false);
    if (!activeSession) return;
    completeSosSession(status);
    setLocationState('idle');
  };

  return <div className="min-h-screen bg-saf-bg">
    <Navbar />
    <main className="mx-auto max-w-5xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <div className="flex items-center gap-2 text-sm font-bold text-saf-red"><Siren className="h-4 w-4" />Emergency response</div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-saf-text sm:text-4xl">SOS support session</h1>
        <p className="mt-3 text-sm leading-6 text-saf-muted">This demo workflow stores the current SOS state in the browser session and shows the nearest real emergency facilities. It does not contact police or ambulance dispatch automatically.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-2xl border border-saf-red/20 bg-saf-white p-6 shadow-card">
          {!activeSession && <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-saf-red/10"><ShieldAlert className="h-7 w-7 text-saf-red" /></div>
            <h2 className="mt-5 text-xl font-extrabold text-saf-text">Start an SOS session</h2>
            <p className="mt-2 text-sm leading-6 text-saf-muted">When you activate SOS, SAFEYATRI requests one current location fix and checks nearby real facilities. Your coordinates remain in browser memory and are not sent to Supabase.</p>
            <button onClick={() => setConfirmActivate(true)} disabled={locationState === 'capturing'} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-saf-red px-5 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-70"><Siren className="h-5 w-5" />{locationState === 'capturing' ? 'Capturing current location...' : 'Activate SOS'}</button>
          </>}

          {activeSession && <>
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-saf-red">Active session</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">SOS ACTIVE</h2></div><span className="flex items-center gap-1.5 rounded-full bg-saf-red/10 px-3 py-1 text-xs font-bold text-saf-red"><span className="h-2 w-2 animate-pulse rounded-full bg-saf-red" />ACTIVE</span></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-saf-border bg-saf-bg p-4"><p className="text-xs text-saf-muted">Current time</p><p className="mt-1 font-bold text-saf-text">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div><div className="rounded-xl border border-saf-border bg-saf-bg p-4"><p className="text-xs text-saf-muted">Location status</p><p className="mt-1 font-bold text-saf-text">{activeSession.latitude !== null && activeSession.longitude !== null ? 'AVAILABLE' : 'UNAVAILABLE'}</p></div></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-saf-border bg-saf-bg p-4"><p className="text-xs text-saf-muted">Latitude</p><p className="mt-1 font-bold text-saf-text">{activeSession.latitude !== null ? activeSession.latitude.toFixed(6) : 'Unavailable'}</p></div><div className="rounded-xl border border-saf-border bg-saf-bg p-4"><p className="text-xs text-saf-muted">Longitude</p><p className="mt-1 font-bold text-saf-text">{activeSession.longitude !== null ? activeSession.longitude.toFixed(6) : 'Unavailable'}</p></div></div>
            {activeSession.accuracy !== null && <p className="mt-3 text-sm text-saf-muted">Location accuracy: {activeSession.accuracy.toFixed(0)} m</p>}
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-saf-orange/20 bg-saf-orange/10 p-3 text-sm leading-5 text-saf-text"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-saf-orange" />{activeSession.latitude !== null && activeSession.longitude !== null ? `Location captured once at ${new Date(activeSession.startedAt).toLocaleString()}. Live tracking is not active for this SOS session.` : 'SOS is active, but location access is unavailable. Enable Location.'}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => setConfirmEnd(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-saf-green px-4 py-3 text-sm font-bold text-white"><CheckCircle2 className="h-4 w-4" />End SOS</button><button onClick={() => setConfirmEnd(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-saf-border bg-saf-white px-4 py-3 text-sm font-bold text-saf-text"><XCircle className="h-4 w-4" />End session</button></div>
          </>}

          {locationError && <p className="mt-4 rounded-xl border border-saf-red/20 bg-saf-red/10 p-3 text-sm leading-5 text-saf-red">{locationError}</p>}
        </section>

        <section className="rounded-2xl border border-saf-border bg-saf-white p-6 shadow-card"><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">SOS session status</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">What the workflow shows</h2><div className="mt-5 space-y-4"><Step icon={Siren} title="SOS activated" text="The user confirms the action before the session starts." /><Step icon={MapPin} title="Location obtained / unavailable" text="If permission is allowed, the current coordinates are captured once for the active session; otherwise the UI clearly shows the limitation." /><Step icon={PhoneCall} title="Nearest services identified" text="The system lists the nearest real police and hospital facilities from the existing dataset." /><Step icon={Clock3} title="User can end SOS" text="The session ends only when the user confirms they want to stop it." /></div><div className="mt-6 border-t border-saf-border pt-5"><Link to="/women-safety" className="text-sm font-bold text-saf-blue hover:text-saf-indigo">Back to Women Safety</Link></div></section>
      </div>

      <FacilityFinder location={activeSession && activeSession.latitude !== null && activeSession.longitude !== null ? [activeSession.latitude, activeSession.longitude] : null} />
      <section className="mt-5 rounded-2xl border border-saf-border bg-saf-white p-6 shadow-card"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-saf-muted">Current browser session</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">Emergency history</h2></div><span className="rounded-full bg-saf-bg px-3 py-1 text-xs font-bold text-saf-muted">{history.length} completed</span></div>{history.length === 0 ? <p className="mt-5 text-sm text-saf-muted">No completed SOS sessions in this browser session.</p> : <div className="mt-5 overflow-x-auto"><table className="min-w-[620px] w-full text-left text-sm"><thead className="border-b border-saf-border text-xs uppercase tracking-wide text-saf-muted"><tr><th className="px-3 py-3">Started</th><th className="px-3 py-3">Location</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Ended</th></tr></thead><tbody className="divide-y divide-saf-border">{history.map((session) => <tr key={session.id}><td className="px-3 py-3 text-saf-text">{new Date(session.startedAt).toLocaleString()}</td><td className="px-3 py-3 text-saf-muted">{session.latitude !== null && session.longitude !== null ? `${session.latitude.toFixed(4)}, ${session.longitude.toFixed(4)}` : 'Location unavailable'}</td><td className="px-3 py-3 font-bold capitalize text-saf-text">{session.status}</td><td className="px-3 py-3 text-saf-muted">{session.endedAt ? new Date(session.endedAt).toLocaleString() : 'Unavailable'}</td></tr>)}</tbody></table></div>}</section>
    </main>
    <Footer />

    {confirmActivate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"><div className="w-full max-w-md rounded-2xl border border-saf-border bg-saf-white p-6 shadow-card"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-saf-red/10 text-saf-red"><Siren className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-saf-red">Emergency SOS</p><h3 className="text-xl font-extrabold text-saf-text">Are you sure you want to activate SOS?</h3></div></div><p className="mt-4 text-sm leading-6 text-saf-muted">This demo session captures your current location once and lists the nearest emergency facilities. It does not dispatch police or ambulance services automatically.</p><div className="mt-5 flex gap-3"><button type="button" onClick={() => setConfirmActivate(false)} className="flex-1 rounded-xl border border-saf-border bg-saf-white px-4 py-3 text-sm font-bold text-saf-text">CANCEL</button><button type="button" onClick={startSos} className="flex-1 rounded-xl bg-saf-red px-4 py-3 text-sm font-bold text-white">ACTIVATE SOS</button></div></div></div>}

    {confirmEnd && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"><div className="w-full max-w-md rounded-2xl border border-saf-border bg-saf-white p-6 shadow-card"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-saf-green/10 text-saf-green"><CheckCircle2 className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-saf-red">End SOS</p><h3 className="text-xl font-extrabold text-saf-text">Are you sure you want to end the active SOS session?</h3></div></div><p className="mt-4 text-sm leading-6 text-saf-muted">Ending the session closes the current demo safety workflow and returns the user to the normal safety state. No persistent SOS history is created by this browser-only flow.</p><div className="mt-5 flex gap-3"><button type="button" onClick={() => setConfirmEnd(false)} className="flex-1 rounded-xl border border-saf-border bg-saf-white px-4 py-3 text-sm font-bold text-saf-text">CANCEL</button><button type="button" onClick={() => closeSession('resolved')} className="flex-1 rounded-xl bg-saf-green px-4 py-3 text-sm font-bold text-white">END SOS</button></div></div></div>}
  </div>;
}

function Step({ icon: Icon, title, text }: { icon: typeof MapPin; title: string; text: string }) {
  return <div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-saf-blue/10"><Icon className="h-4 w-4 text-saf-blue" /></div><div><p className="text-sm font-bold text-saf-text">{title}</p><p className="mt-1 text-sm leading-5 text-saf-muted">{text}</p></div></div>;
}
