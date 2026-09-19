import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Camera, CameraOff, LocateFixed, MapPin, ShieldCheck, Siren, ToggleRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getTouristPlaces } from '@/services/touristPlacesService';
import { getRecentWeatherDataByTouristPlace } from '@/services/weatherDataService';
import type { TouristPlace } from '@/types/touristPlaces';
import type { WeatherData } from '@/types/weatherData';
import 'leaflet/dist/leaflet.css';
import '@/pages/SafetyMap.css';

type CameraState = 'idle' | 'loading' | 'active' | 'denied' | 'unsupported';
type LocationState = 'idle' | 'loading' | 'ready' | 'error';

function distanceMeters(source: [number, number] | null, destination: TouristPlace | null) {
  if (!source || !destination) return null;
  const radians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = radians(destination.latitude - source[0]);
  const longitudeDelta = radians(destination.longitude - source[1]);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(source[0])) * Math.cos(radians(destination.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(source: [number, number] | null, destination: TouristPlace | null) {
  if (!source || !destination) return null;
  const radians = (value: number) => value * Math.PI / 180;
  const y = Math.sin(radians(destination.longitude - source[1])) * Math.cos(radians(destination.latitude));
  const x = Math.cos(radians(source[0])) * Math.sin(radians(destination.latitude)) - Math.sin(radians(source[0])) * Math.cos(radians(destination.latitude)) * Math.cos(radians(destination.longitude - source[1]));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export default function ArSafety() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [womenSafetyMode, setWomenSafetyMode] = useState(false);

  useEffect(() => {
    getTouristPlaces().then((data) => { setPlaces(data); setSelectedId(data[0]?.id ?? null); }).catch(() => setPlaces([]));
  }, []);

  const selectedPlace = places.find((place) => place.id === selectedId) ?? null;
  useEffect(() => {
    if (!selectedPlace) { setWeather(null); return; }
    getRecentWeatherDataByTouristPlace(selectedPlace.id).then((records) => setWeather(records[0] ?? null)).catch(() => setWeather(null));
  }, [selectedPlace]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setCameraState('unsupported'); return; }
    setCameraState('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraState('active');
    } catch { setCameraState('denied'); }
  };

  const stopCamera = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; setCameraState('idle'); };
  const getLocation = () => {
    if (!navigator.geolocation) { setLocationState('error'); setLocationMessage('Location services are not supported by this browser.'); return; }
    setLocationState('loading');
    navigator.geolocation.getCurrentPosition(({ coords }) => { setLocation([coords.latitude, coords.longitude]); setLocationState('ready'); setLocationMessage(null); }, (error) => { setLocationState('error'); setLocationMessage(error.code === error.PERMISSION_DENIED ? 'Location permission was denied.' : 'Current location is unavailable.'); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };

  const distance = distanceMeters(location, selectedPlace);
  const direction = bearing(location, selectedPlace);
  const insideDemoZone = distance !== null && distance <= 1000;
  const mapCenter: [number, number] = selectedPlace ? [selectedPlace.latitude, selectedPlace.longitude] : [10.9, 78.4];

  return <div className="min-h-screen bg-saf-bg"><Navbar /><main className="mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8"><div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="flex items-center gap-2 text-sm font-bold text-saf-indigo"><Camera className="h-4 w-4" />AR-style safety view</div><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-saf-text">Explore with live context</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-saf-muted">A browser demonstration layer for destination, weather, GPS, and configured-zone context. This is not verified spatial AR or a safety prediction.</p></div><Link to="/emergency" className="inline-flex items-center justify-center gap-2 rounded-xl bg-saf-red px-4 py-3 text-sm font-bold text-white shadow-soft"><Siren className="h-4 w-4" />SOS</Link></div>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"><section className="relative min-h-[600px] overflow-hidden rounded-2xl border border-saf-border bg-slate-900 shadow-card"><div className="absolute inset-0">{cameraState === 'active' ? <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" /> : <MapContainer center={mapCenter} zoom={selectedPlace ? 11 : 7} className="h-full w-full"><TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{places.map((place) => <Marker key={place.id} position={[place.latitude, place.longitude]}><Popup>{place.name}</Popup></Marker>)}{selectedPlace && <Circle center={mapCenter} radius={1000} pathOptions={{ color: '#2563EB', dashArray: '6 6', fillOpacity: 0.08 }} />}{location && <CircleMarker center={location} radius={8} pathOptions={{ color: '#2563EB', fillColor: '#60A5FA', fillOpacity: 0.9 }} />}</MapContainer>}</div><div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/55 via-transparent to-slate-950/70" /><div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3"><span className="rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white">AR-STYLE DEMONSTRATION</span><span className="rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white">{cameraState === 'active' ? 'Camera active' : 'Map fallback'}</span></div><div className="absolute bottom-5 left-4 right-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/20 bg-slate-950/75 p-4 text-white backdrop-blur"><p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Destination</p><p className="mt-1 text-lg font-extrabold">{selectedPlace?.name ?? 'Unavailable'}</p><p className="mt-1 text-xs text-white/70">{selectedPlace?.district ?? 'Select a destination'}</p></div><div className="rounded-2xl border border-white/20 bg-slate-950/75 p-4 text-white backdrop-blur"><p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Proximity</p><p className="mt-1 text-lg font-extrabold">{distance === null ? 'Unavailable' : distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`}</p><p className="mt-1 text-xs text-white/70">{direction === null ? 'Direction unavailable' : `Approximate bearing ${Math.round(direction)}°`}</p></div></div></section>
      <aside className="space-y-4"><section className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">View controls</p><label className="mt-4 block text-sm font-bold text-saf-text">Destination<select value={selectedId ?? ''} onChange={(event) => setSelectedId(event.target.value || null)} className="mt-2 w-full rounded-xl border border-saf-border bg-saf-bg px-3 py-2.5 text-sm font-medium"><option value="">Unavailable</option>{places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></label><div className="mt-4 grid gap-2"><button onClick={cameraState === 'active' ? stopCamera : startCamera} className="inline-flex items-center justify-center gap-2 rounded-xl bg-saf-blue px-4 py-3 text-sm font-bold text-white">{cameraState === 'active' ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}{cameraState === 'loading' ? 'Requesting camera...' : cameraState === 'active' ? 'Stop camera' : 'Enable camera'}</button><button onClick={getLocation} disabled={locationState === 'loading'} className="inline-flex items-center justify-center gap-2 rounded-xl border border-saf-border px-4 py-3 text-sm font-bold text-saf-text disabled:opacity-50"><LocateFixed className="h-4 w-4" />{locationState === 'loading' ? 'Locating...' : 'Use current location'}</button></div>{(cameraState === 'denied' || cameraState === 'unsupported') && <p className="mt-3 text-sm text-saf-red">{cameraState === 'denied' ? 'Camera permission was denied. The map fallback remains available.' : 'Camera is unavailable in this browser. The map fallback remains available.'}</p>}{locationMessage && <p className="mt-3 text-sm text-saf-red">{locationMessage}</p>}</section><section className="rounded-2xl border border-saf-border bg-saf-white p-5 shadow-card"><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Context overlay</p><div className="mt-4 space-y-3 text-sm"><div className="flex items-center justify-between"><span className="text-saf-muted">Configured zone</span><strong className={insideDemoZone ? 'text-saf-orange' : 'text-saf-text'}>{insideDemoZone ? 'Inside DEMO zone' : 'Outside / unavailable'}</strong></div><div className="flex items-center justify-between"><span className="text-saf-muted">Women Safety Mode</span><button onClick={() => setWomenSafetyMode((current) => !current)} className="inline-flex items-center gap-1 font-bold text-saf-blue"><ToggleRight className="h-4 w-4" />{womenSafetyMode ? 'ON' : 'OFF'}</button></div><div className="flex items-center justify-between"><span className="text-saf-muted">Weather</span><strong className="text-saf-text">{weather ? `${weather.temperature ?? 'Unavailable'} °C` : 'Unavailable'}</strong></div></div><p className="mt-4 text-xs leading-5 text-saf-muted">The configured zone is a destination-proximity demonstration, not a danger classification. Direction is approximate and does not use device heading.</p></section><Link to="/emergency" className="flex items-center justify-center gap-2 rounded-xl bg-saf-red px-4 py-3 text-sm font-extrabold text-white"><Siren className="h-4 w-4" />Open existing SOS workflow</Link></aside></div>
  </main><Footer /></div>;
}
