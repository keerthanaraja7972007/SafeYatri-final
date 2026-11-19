import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function RequireRole({ role }: { role: 'user' | 'admin' }) {
  const { user, profile, loading, isDemoAdmin } = useAuth();
  const location = useLocation();
  if (role === 'admin' && isDemoAdmin) return <Outlet />;
  if (!isSupabaseConfigured) return <main className="mx-auto max-w-xl px-6 py-24 text-center"><h1 className="text-2xl font-bold text-saf-text">Authentication is not configured</h1><p className="mt-3 text-saf-muted">Set the existing Supabase environment variables to use account features.</p></main>;
  if (loading) return <main className="px-6 py-24 text-center text-saf-muted">Checking your session…</main>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!profile) return <main className="px-6 py-24 text-center text-saf-muted">Your SAFEYATRI profile could not be loaded. Please sign in again.</main>;
  if (role === 'admin' && profile.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
