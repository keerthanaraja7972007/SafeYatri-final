import { useState, useSyncExternalStore } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, MapPin, PhoneCall, ShieldAlert, Siren, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { completeSosSession, getSosSnapshot, startSosSession, subscribeToSos } from '@/services/sosSessionStore';

type LocationState = 'idle' | 'capturing' | 'ready' | 'error';

function createSessionId() {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `sos-${Date.now()}`;
}

function errorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) return 'Location permission was denied. SOS needs a current browser location to begin.';
  if (error.code === error.TIMEOUT) return 'Location capture timed out. Please try SOS again when you have a clearer signal.';
  return 'Your current location is unavailable. No emergency session was created.';
}

export default function Emergency() {
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const { activeSession, history } = useSyncExternalStore(subscribeToSos, getSosSnapshot, getSosSnapshot);

  const startSos = () => {
    if (!navigator.geolocation) {
      setLocationState('error');
      setLocationError('Location services are not supported by this browser. No emergency session was created.');
      return;
    }

    setLocationState('capturing');
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      startSosSession({
        id: createSessionId(),
        startedAt: new Date().toISOString(),
        endedAt: null,
        status: 'active',
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      setLocationState('ready');
    }, (error) => {
      setLocationState('error');
      setLocationError(errorMessage(error));
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };

  const closeSession = (status: 'cancelled' | 'resolved') => {
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
        <p className="mt-3 text-sm leading-6 text-saf-muted">Capture your current browser location and prepare a local emergency session. This prototype does not contact responders automatically.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-2xl border border-saf-red/20 bg-saf-white p-6 shadow-card">
          {!activeSession && <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-saf-red/10"><ShieldAlert className="h-7 w-7 text-saf-red" /></div>
            <h2 className="mt-5 text-xl font-extrabold text-saf-text">Start an SOS session</h2>
            <p className="mt-2 text-sm leading-6 text-saf-muted">When you activate SOS, SAFEYATRI requests one current location fix. Your coordinates remain in browser memory and are not sent to Supabase.</p>
            <button onClick={startSos} disabled={locationState === 'capturing'} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-saf-red px-5 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-70"><Siren className="h-5 w-5" />{locationState === 'capturing' ? 'Capturing current location...' : 'Activate SOS'}</button>
          </>}

          {activeSession && <>
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-saf-red">Active session</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">Emergency session in progress</h2></div><span className="flex items-center gap-1.5 rounded-full bg-saf-red/10 px-3 py-1 text-xs font-bold text-saf-red"><span className="h-2 w-2 animate-pulse rounded-full bg-saf-red" />Active</span></div>
            <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl border border-saf-border bg-saf-bg p-4"><p className="text-xs text-saf-muted">Latitude</p><p className="mt-1 font-bold text-saf-text">{activeSession.latitude.toFixed(6)}</p></div><div className="rounded-xl border border-saf-border bg-saf-bg p-4"><p className="text-xs text-saf-muted">Longitude</p><p className="mt-1 font-bold text-saf-text">{activeSession.longitude.toFixed(6)}</p></div></div>
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-saf-orange/20 bg-saf-orange/10 p-3 text-sm leading-5 text-saf-text"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-saf-orange" />Location captured once at {new Date(activeSession.startedAt).toLocaleString()}. Live tracking is not active for this SOS session.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => closeSession('resolved')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-saf-green px-4 py-3 text-sm font-bold text-white"><CheckCircle2 className="h-4 w-4" />Mark resolved</button><button onClick={() => closeSession('cancelled')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-saf-border bg-saf-white px-4 py-3 text-sm font-bold text-saf-text"><XCircle className="h-4 w-4" />Cancel session</button></div>
          </>}

          {locationError && <p className="mt-4 rounded-xl border border-saf-red/20 bg-saf-red/10 p-3 text-sm leading-5 text-saf-red">{locationError}</p>}
        </section>

        <section className="rounded-2xl border border-saf-border bg-saf-white p-6 shadow-card"><p className="text-xs font-bold uppercase tracking-wider text-saf-blue">Responder preparation</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">What this workflow does</h2><div className="mt-5 space-y-4"><Step icon={MapPin} title="Capture location" text="A one-time browser location fix is attached to the session." /><Step icon={PhoneCall} title="Prepare response" text="The session records that assistance is needed, but no responder notification is sent by this prototype." /><Step icon={Clock3} title="Track status" text="You can keep the session active, mark it resolved, or cancel it." /></div><div className="mt-6 border-t border-saf-border pt-5"><Link to="/safety-map" className="text-sm font-bold text-saf-blue hover:text-saf-indigo">Return to Safety Map</Link></div></section>
      </div>

      <section className="mt-5 rounded-2xl border border-saf-border bg-saf-white p-6 shadow-card"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-saf-muted">Current browser session</p><h2 className="mt-1 text-xl font-extrabold text-saf-text">Emergency history</h2></div><span className="rounded-full bg-saf-bg px-3 py-1 text-xs font-bold text-saf-muted">{history.length} completed</span></div>{history.length === 0 ? <p className="mt-5 text-sm text-saf-muted">No completed SOS sessions in this browser session.</p> : <div className="mt-5 overflow-x-auto"><table className="min-w-[620px] w-full text-left text-sm"><thead className="border-b border-saf-border text-xs uppercase tracking-wide text-saf-muted"><tr><th className="px-3 py-3">Started</th><th className="px-3 py-3">Location</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Ended</th></tr></thead><tbody className="divide-y divide-saf-border">{history.map((session) => <tr key={session.id}><td className="px-3 py-3 text-saf-text">{new Date(session.startedAt).toLocaleString()}</td><td className="px-3 py-3 text-saf-muted">{session.latitude.toFixed(4)}, {session.longitude.toFixed(4)}</td><td className="px-3 py-3 font-bold capitalize text-saf-text">{session.status}</td><td className="px-3 py-3 text-saf-muted">{session.endedAt ? new Date(session.endedAt).toLocaleString() : 'Unavailable'}</td></tr>)}</tbody></table></div>}</section>
    </main>
    <Footer />
  </div>;
}

function Step({ icon: Icon, title, text }: { icon: typeof MapPin; title: string; text: string }) {
  return <div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-saf-blue/10"><Icon className="h-4 w-4 text-saf-blue" /></div><div><p className="text-sm font-bold text-saf-text">{title}</p><p className="mt-1 text-sm leading-5 text-saf-muted">{text}</p></div></div>;
}
