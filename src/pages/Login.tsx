import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/auth/AuthContext';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { matchesDemoAdminCredentials } from '@/auth/demoAdmin';

export default function Login() {
  const [mode, setMode] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile, activateDemoAdmin, clearDemoAdmin } = useAuth();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setNotice('');
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (!password) { setError('Enter your password.'); return; }
    if (mode === 'admin' && email === 'keerthanaraja797@gmail.com') {
      setBusy(true);
      if (await matchesDemoAdminCredentials(email, password)) {
        activateDemoAdmin();
        navigate('/admin', { replace: true });
      } else {
        setError('Invalid admin credentials.');
      }
      setBusy(false);
      return;
    }
    clearDemoAdmin();
    if (!supabase) { setError(mode === 'admin' ? 'Invalid admin credentials.' : 'Authentication is not configured.'); return; }
    setBusy(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError || !data.user) { setError(mode === 'admin' ? 'Invalid admin credentials.' : authError?.message ?? 'Sign in failed.'); setBusy(false); return; }
    await refreshProfile();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    if (profile?.role !== 'user' && profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Your SAFEYATRI account profile could not be verified. Contact support.'); setBusy(false); return;
    }
    if (mode === 'admin' && profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Invalid admin credentials.'); setBusy(false); return;
    }
    navigate(mode === 'admin' ? '/admin' : from && from !== '/login' ? from : '/dashboard', { replace: true });
  }

  async function resetPassword() {
    if (!supabase || !email.trim()) { setError('Enter your email first to request a password reset.'); return; }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    if (resetError) setError(resetError.message); else setNotice('If this email is registered, a password reset link has been sent.');
  }

  return <main className="min-h-screen bg-saf-bg px-4 py-10 sm:py-16"><div className="mx-auto max-w-lg"><Link to="/" className="mx-auto mb-7 block w-fit"><Logo /></Link><section className="rounded-3xl border border-saf-border bg-saf-white p-6 shadow-card sm:p-9"><div className="text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-saf-blue/10 text-saf-blue"><ShieldCheck /></span><h1 className="mt-4 text-2xl font-extrabold text-saf-text">Welcome to SAFEYATRI</h1><p className="mt-2 text-sm text-saf-muted">Sign in to your account</p></div>
    <div className="mt-7 grid grid-cols-2 rounded-xl bg-saf-bg p-1"><button type="button" onClick={() => { setMode('user'); setError(''); }} className={`rounded-lg px-3 py-2.5 text-sm font-bold ${mode === 'user' ? 'bg-saf-white text-saf-blue shadow-soft' : 'text-saf-muted'}`}>User Login</button><button type="button" onClick={() => { setMode('admin'); setError(''); }} className={`rounded-lg px-3 py-2.5 text-sm font-bold ${mode === 'admin' ? 'bg-saf-white text-saf-blue shadow-soft' : 'text-saf-muted'}`}>Admin Login</button></div>
    {!isSupabaseConfigured && mode === 'user' && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Supabase authentication is not configured for this environment.</p>}
    <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-semibold text-saf-text">Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-saf-border bg-white px-3.5 py-3 outline-none focus:border-saf-blue" /></label><label className="block text-sm font-semibold text-saf-text">Password<span className="relative mt-1.5 block"><input type={visible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-saf-border bg-white px-3.5 py-3 pr-12 outline-none focus:border-saf-blue" /><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-saf-muted">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label><button type="button" onClick={resetPassword} className="block text-sm font-semibold text-saf-blue">Forgot password?</button>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>}<button disabled={busy || (mode === 'user' && !isSupabaseConfigured)} className="w-full rounded-xl gradient-blue-indigo px-4 py-3 font-bold text-white disabled:opacity-60">{busy ? 'Signing in…' : mode === 'admin' ? 'Sign in as administrator' : 'Sign in'}</button></form>
    <p className="mt-6 text-center text-sm text-saf-muted">New to SAFEYATRI? <Link to="/register" className="font-bold text-saf-blue">Create an account</Link></p><Link to="/" className="mt-5 block text-center text-sm font-semibold text-saf-muted">Back to SAFEYATRI</Link>
  </section></div></main>;
}
