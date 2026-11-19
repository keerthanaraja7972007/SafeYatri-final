import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { AlertTriangle, Home, MapPin, Navigation, Phone, ShieldAlert, ShieldCheck, Siren } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getEmergencyServices } from '@/services/emergencyService';
import { completeSosSession, getSosSnapshot, startSosSession, subscribeToSos } from '@/services/sosSessionStore';
import type { EmergencyService } from '@/types/emergencyServices';
import 'leaflet/dist/leaflet.css';
import '@/pages/SafetyMap.css';

const STORAGE_KEY = 'safeyatri-women-safety-session';

type LocationState = 'loading' | 'available' | 'denied' | 'unavailable';

function createSessionId() {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `sos-${Date.now()}`;
}

function formatDistance(meters: number | null) {
  if (meters === null || Number.isNaN(meters)) return 'Distance unavailable';
  return meters < 1000 ? `${Math.round(meters)} m away` : `${(meters / 1000).toFixed(1)} km away`;
}

function getNearestFacilities(location: [number, number] | null, facilities: EmergencyService[], type: 'Police' | 'Hospital') {
  return facilities
    .filter((facility) => facility.type === type && facility.latitude !== null && facility.longitude !== null)
    .map((facility) => {
      if (!location) return { facility, distance: null };
      const radians = (value: number) => value * Math.PI / 180;
      const latitudeDelta = radians(facility.latitude! - location[0]);
      const longitudeDelta = radians(facility.longitude! - location[1]);
      const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(location[0])) * Math.cos(radians(facility.latitude!)) * Math.sin(longitudeDelta / 2) ** 2;
      const distance = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { facility, distance };
    })
    .sort((left, right) => {
      if (left.distance === null || right.distance === null) return left.facility.name.localeCompare(right.facility.name);
      return left.distance - right.distance;
    })
    .slice(0, 3);
}

export default function WomenSafety() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'active';
    } catch {
      return false;
    }
  });
  const [locationState, setLocationState] = useState<LocationState>('loading');
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<EmergencyService[]>([]);
  const [confirmingSos, setConfirmingSos] = useState(false);
  const sos = useSyncExternalStore(subscribeToSos, getSosSnapshot, getSosSnapshot);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, enabled ? 'active' : 'inactive');
    } catch {
      // session-only storage is best effort; the page still works without it.
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLocation(null);
      setLocationState('denied');
      setLocationMessage(null);
      return;
    }

    if (!navigator.geolocation) {
      setLocation(null);
      setLocationState('unavailable');
      setLocationMessage('Location permission is required for location-based safety features.');
      return;
    }

    setLocationState('loading');
    setLocationMessage(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation([coords.latitude, coords.longitude]);
        setLocationState('available');
        setLocationMessage(null);
      },
      (error) => {
        setLocation(null);
        setLocationState(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
        setLocationMessage('Location permission is required for location-based safety features.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void getEmergencyServices().then((records) => setFacilities(records)).catch(() => setFacilities([]));
  }, [enabled]);

  const policeFacilities = useMemo(() => getNearestFacilities(location, facilities, 'Police'), [facilities, location]);
  const hospitalFacilities = useMemo(() => getNearestFacilities(location, facilities, 'Hospital'), [facilities, location]);

  const nearestPolice = policeFacilities[0]?.facility ?? null;
  const nearestHospital = hospitalFacilities[0]?.facility ?? null;
  const isActiveSession = Boolean(sos.activeSession);
  const currentStatus = enabled ? (isActiveSession ? 'SOS ACTIVE' : 'Monitoring active') : 'Inactive';

  const activateSos = () => {
    setConfirmingSos(false);
    const now = new Date().toISOString();

    if (!navigator.geolocation) {
      startSosSession({
        id: createSessionId(),
        startedAt: now,
        endedAt: null,
        status: 'active',
        latitude: null,
        longitude: null,
        accuracy: null,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        startSosSession({
          id: createSessionId(),
          startedAt: now,
          endedAt: null,
          status: 'active',
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy ?? null,
        });
      },
      (error) => {
        startSosSession({
          id: createSessionId(),
          startedAt: now,
          endedAt: null,
          status: 'active',
          latitude: null,
          longitude: null,
          accuracy: null,
        });
        setLocationState(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
        setLocationMessage('SOS is active, but location access is unavailable.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const facilityCall = (phone: string | null | undefined) => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="min-h-screen bg-saf-bg">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-saf-green"><ShieldCheck className="h-4 w-4" />Women Safety Mode</div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-saf-text">Safety dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              <span className={`h-2 w-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {enabled ? 'ACTIVE' : 'INACTIVE'}
            </span>
            <button
              type="button"
              onClick={() => setEnabled((current) => !current)}
              className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-white ${enabled ? 'bg-saf-red' : 'bg-saf-blue'}`}
            >
              {enabled ? 'Disable mode' : 'Enable mode'}
            </button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border border-saf-border bg-saf-white p-6 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Safety status</p>
                <h2 className="mt-1 text-xl font-extrabold text-saf-text">Women Safety Mode: {enabled ? 'ON' : 'OFF'}</h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${isActiveSession ? 'bg-saf-red/10 text-saf-red' : 'bg-saf-green/10 text-saf-green'}`}>
                {isActiveSession ? 'SOS ACTIVE' : 'SAFE'}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-saf-border bg-saf-bg p-4">
                <p className="text-xs uppercase tracking-wide text-saf-muted">Current safety status</p>
                <p className="mt-2 text-lg font-extrabold text-saf-text">{currentStatus}</p>
              </div>
              <div className="rounded-xl border border-saf-border bg-saf-bg p-4">
                <p className="text-xs uppercase tracking-wide text-saf-muted">Location</p>
                <p className="mt-2 text-lg font-extrabold text-saf-text">{locationState === 'available' ? 'AVAILABLE' : 'UNAVAILABLE'}</p>
              </div>
            </div>

            {locationMessage && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{locationMessage}</span>
              </div>
            )}

            {location && (
              <div className="mt-4 rounded-xl border border-saf-border bg-saf-bg p-4 text-sm text-saf-text">
                <p className="font-semibold">Current location</p>
                <p className="mt-1">Latitude: {location[0].toFixed(6)}</p>
                <p>Longitude: {location[1].toFixed(6)}</p>
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setConfirmingSos(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-saf-red px-4 py-3 text-sm font-bold text-white shadow-soft">
                <Siren className="h-4 w-4" />
                SOS
              </button>
              <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-saf-border bg-saf-white px-4 py-3 text-sm font-bold text-saf-text">
                <Home className="h-4 w-4" />
                Return to SafeYatri home
              </Link>
            </div>

            {(nearestPolice || nearestHospital) && (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-saf-muted">Nearby emergency facilities</p>
                {nearestPolice && (
                  <div className="rounded-xl border border-saf-border bg-saf-bg p-3">
                    <p className="font-bold text-saf-text">Nearest police station</p>
                    <p className="mt-1 text-sm text-saf-muted">{nearestPolice.name} · {formatDistance(policeFacilities[0]?.distance ?? null)}</p>
                    {nearestPolice.phone ? (
                      <button type="button" onClick={() => facilityCall(nearestPolice.phone)} className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-saf-blue"><Phone className="h-4 w-4" /> CALL</button>
                    ) : (
                      <p className="mt-2 text-sm text-saf-muted">Contact information unavailable.</p>
                    )}
                  </div>
                )}
                {nearestHospital && (
                  <div className="rounded-xl border border-saf-border bg-saf-bg p-3">
                    <p className="font-bold text-saf-text">Nearest hospital / clinic</p>
                    <p className="mt-1 text-sm text-saf-muted">{nearestHospital.name} · {formatDistance(hospitalFacilities[0]?.distance ?? null)}</p>
                    {nearestHospital.phone ? (
                      <button type="button" onClick={() => facilityCall(nearestHospital.phone)} className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-saf-blue"><Phone className="h-4 w-4" /> CALL</button>
                    ) : (
                      <p className="mt-2 text-sm text-saf-muted">Contact information unavailable.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card">
              <p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Quick actions</p>
              <div className="mt-4 space-y-2">
                <button type="button" onClick={() => setConfirmingSos(true)} className="flex w-full items-center justify-between rounded-xl border border-saf-red/20 bg-saf-red/5 px-4 py-3 text-left text-sm font-bold text-saf-red"><span className="flex items-center gap-2"><Siren className="h-4 w-4" />SOS</span><Navigation className="h-4 w-4" /></button>
                <button type="button" onClick={() => nearestPolice && facilityCall(nearestPolice.phone)} disabled={!nearestPolice?.phone} className="flex w-full items-center justify-between rounded-xl border border-saf-border bg-saf-bg px-4 py-3 text-left text-sm font-bold text-saf-text disabled:cursor-not-allowed disabled:opacity-50"><span className="flex items-center gap-2"><MapPin className="h-4 w-4" />Nearby Police</span>{nearestPolice?.phone ? <Phone className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}</button>
                <button type="button" onClick={() => nearestHospital && facilityCall(nearestHospital.phone)} disabled={!nearestHospital?.phone} className="flex w-full items-center justify-between rounded-xl border border-saf-border bg-saf-bg px-4 py-3 text-left text-sm font-bold text-saf-text disabled:cursor-not-allowed disabled:opacity-50"><span className="flex items-center gap-2"><MapPin className="h-4 w-4" />Nearby Hospital</span>{nearestHospital?.phone ? <Phone className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}</button>
                <button type="button" onClick={() => setLocationMessage(location ? 'Location ready for emergency sharing.' : 'Location permission is required for location-based safety features.') } className="flex w-full items-center justify-between rounded-xl border border-saf-border bg-saf-bg px-4 py-3 text-left text-sm font-bold text-saf-text"><span className="flex items-center gap-2"><Navigation className="h-4 w-4" />Share/prepare current location</span><MapPin className="h-4 w-4" /></button>
                <Link to="/" className="flex w-full items-center justify-between rounded-xl border border-saf-border bg-saf-bg px-4 py-3 text-left text-sm font-bold text-saf-text"><span className="flex items-center gap-2"><Home className="h-4 w-4" />Return to SafeYatri home</span><Home className="h-4 w-4" /></Link>
              </div>
            </section>

            <section className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card">
              <p className="text-xs font-bold uppercase tracking-wider text-saf-red">SOS status</p>
              <div className="mt-3 rounded-xl border border-saf-red/20 bg-saf-red/5 p-4">
                <p className="text-xs uppercase tracking-wide text-saf-muted">Status</p>
                <p className="mt-1 text-lg font-extrabold text-saf-text">{isActiveSession ? 'ACTIVE' : 'INACTIVE'}</p>
                {isActiveSession && sos.activeSession && (
                  <>
                    <p className="mt-2 text-sm text-saf-muted">Started: {new Date(sos.activeSession.startedAt).toLocaleString()}</p>
                    <p className="mt-1 text-sm text-saf-muted">Location: {sos.activeSession.latitude !== null && sos.activeSession.longitude !== null ? `${sos.activeSession.latitude.toFixed(6)}, ${sos.activeSession.longitude.toFixed(6)}` : 'Unavailable'}</p>
                    {sos.activeSession.accuracy !== null && <p className="mt-1 text-sm text-saf-muted">Accuracy: {sos.activeSession.accuracy.toFixed(0)} m</p>}
                    <button type="button" onClick={() => completeSosSession('resolved')} className="mt-3 inline-flex items-center justify-center rounded-xl bg-saf-green px-4 py-2 text-sm font-bold text-white">End SOS</button>
                  </>
                )}
              </div>
            </section>
          </aside>
        </div>

        {enabled && location && (
          <section className="mt-6 rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Location-aware safety view</p>
            <div className="mt-4 h-[280px] overflow-hidden rounded-xl">
              <MapContainer center={location} zoom={13} className="h-full w-full">
                <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={location}><Popup>Your current location</Popup></Marker>
                {nearestPolice && nearestPolice.latitude !== null && nearestPolice.longitude !== null && (
                  <Marker position={[nearestPolice.latitude, nearestPolice.longitude]}><Popup>{nearestPolice.name}</Popup></Marker>
                )}
                {nearestHospital && nearestHospital.latitude !== null && nearestHospital.longitude !== null && (
                  <Marker position={[nearestHospital.latitude, nearestHospital.longitude]}><Popup>{nearestHospital.name}</Popup></Marker>
                )}
              </MapContainer>
            </div>
          </section>
        )}

        {confirmingSos && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-md rounded-2xl border border-saf-border bg-saf-white p-6 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-saf-red/10 text-saf-red"><Siren className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-saf-red">Emergency SOS</p>
                  <h3 className="text-xl font-extrabold text-saf-text">Are you sure you want to activate SOS?</h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-saf-muted">This demo helps you prepare an emergency session using your current location and nearby facilities. It does not send alerts to police or ambulance dispatch automatically.</p>
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={() => setConfirmingSos(false)} className="flex-1 rounded-xl border border-saf-border bg-saf-white px-4 py-3 text-sm font-bold text-saf-text">CANCEL</button>
                <button type="button" onClick={activateSos} className="flex-1 rounded-xl bg-saf-red px-4 py-3 text-sm font-bold text-white">ACTIVATE SOS</button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
