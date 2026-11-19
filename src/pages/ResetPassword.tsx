import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [done, setDone] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (password.length < 8) { setError('Use a password with at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (!supabase) { setError('Authentication is not configured.'); return; }
    setBusy(true); const { error: updateError } = await supabase.auth.updateUser({ password }); setBusy(false);
    if (updateError) setError(updateError.message); else { await supabase.auth.signOut(); setDone(true); window.setTimeout(() => navigate('/login', { replace: true }), 1600); }
  }
  return <main className="min-h-screen bg-saf-bg px-4 py-10 sm:py-16"><div className="mx-auto max-w-lg"><Link to="/" className="mx-auto mb-7 block w-fit"><Logo /></Link><section className="rounded-3xl border border-saf-border bg-saf-white p-6 shadow-card sm:p-9"><h1 className="text-center text-2xl font-extrabold text-saf-text">Set a new password</h1>{done ? <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-center text-sm text-green-800">Password updated. You can now sign in with your new password.</p> : !ready ? <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Open this page from the password reset email link. If your link expired, request another from Login.</p> : <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-semibold text-saf-text">New password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-saf-border px-3.5 py-3" /></label><label className="block text-sm font-semibold text-saf-text">Confirm new password<input type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-1.5 w-full rounded-xl border border-saf-border px-3.5 py-3" /></label>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className="w-full rounded-xl gradient-blue-indigo px-4 py-3 font-bold text-white disabled:opacity-60">{busy ? 'Updating…' : 'Update password'}</button></form>}<Link to="/login" className="mt-6 block text-center text-sm font-semibold text-saf-blue">Back to Login</Link></section></div></main>;
}
