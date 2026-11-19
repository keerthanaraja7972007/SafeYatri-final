export type SosSessionStatus = 'active' | 'cancelled' | 'resolved';

export interface SosSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  status: SosSessionStatus;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
}

interface SosSnapshot {
  activeSession: SosSession | null;
  history: SosSession[];
}

let snapshot: SosSnapshot = { activeSession: null, history: [] };
const listeners = new Set<() => void>();

export function getSosSnapshot(): SosSnapshot {
  return snapshot;
}

export function subscribeToSos(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function startSosSession(session: SosSession) {
  snapshot = { ...snapshot, activeSession: session };
  notify();
}

export function completeSosSession(status: 'cancelled' | 'resolved') {
  if (!snapshot.activeSession) return;
  const completed = { ...snapshot.activeSession, status, endedAt: new Date().toISOString() };
  snapshot = { activeSession: null, history: [completed, ...snapshot.history] };
  notify();
}

function notify() {
  listeners.forEach((listener) => listener());
}
