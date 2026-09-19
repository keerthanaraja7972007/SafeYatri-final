import { useCallback, useEffect, useState } from 'react';
import ExploreDashboard from '@/components/ExploreDashboard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getTouristPlaces, isSupabaseConfigured } from '@/services/touristPlacesService';
import type { TouristPlace } from '@/types/touristPlaces';

type State = 'loading' | 'success' | 'error' | 'empty';

export default function Dashboard() {
  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [state, setState] = useState<State>('loading');

  const fetchPlaces = useCallback(async () => {
    setState('loading');
    try {
      const data = await getTouristPlaces();
      setPlaces(data);
      setState(data.length === 0 ? 'empty' : 'success');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState('error');
      return;
    }
    fetchPlaces();
  }, [fetchPlaces]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <ExploreDashboard places={places} state={state} onRetry={fetchPlaces} />
      </main>
      <Footer />
    </div>
  );
}
