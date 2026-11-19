import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthContext, type Profile } from './AuthContext';

const DEMO_ADMIN_SESSION_KEY = 'safeyatri-demo-admin-session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoAdmin, setIsDemoAdmin] = useState(() => window.localStorage.getItem(DEMO_ADMIN_SESSION_KEY) === 'active');

  const activateDemoAdmin = useCallback(() => {
    window.localStorage.setItem(DEMO_ADMIN_SESSION_KEY, 'active');
    setIsDemoAdmin(true);
  }, []);

  const clearDemoAdmin = useCallback(() => {
    window.localStorage.removeItem(DEMO_ADMIN_SESSION_KEY);
    setIsDemoAdmin(false);
  }, []);

  const loadProfile = async (user: User | null) => {
    if (!user || !supabase) { setProfile(null); return; }
    const { data, error } = await supabase.from('profiles').select('id,email,full_name,role').eq('id', user.id).maybeSingle();
    if (error || !data || (data.role !== 'user' && data.role !== 'admin')) { setProfile(null); return; }
    setProfile(data as Profile);
  };

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      await loadProfile(data.session?.user ?? null);
      if (alive) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setProfile(null);
      else queueMicrotask(() => { void loadProfile(nextSession.user); });
      setLoading(false);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  const value = useMemo(() => ({ session, user: session?.user ?? null, profile, loading, isDemoAdmin, activateDemoAdmin, clearDemoAdmin, refreshProfile: () => loadProfile(session?.user ?? null) }), [session, profile, loading, isDemoAdmin, activateDemoAdmin, clearDemoAdmin]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
