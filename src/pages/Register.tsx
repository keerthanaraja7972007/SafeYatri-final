import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserRoundPlus } from 'lucide-react';
import Logo from '@/components/Logo';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function Register() {
  const [fullName, setFullName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const navigate = useNavigate();
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setMessage('');
    if (fullName.trim().length < 2) { setError('Enter your full name.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (password.length < 8) { setError('Use a password with at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (!supabase) { setError('Authentication is not configured.'); return; }
    setBusy(true);
    const { data, error: signupError } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim() }, emailRedirectTo: `${window.location.origin}/login` } });
    setBusy(false);
    if (signupError) { setError(/already|registered|exists/i.test(signupError.message) ? 'An account with this email already exists.' : signupError.message); return; }
    if (data.session) { navigate('/dashboard', { replace: true }); return; }
    setMessage('Account request received. Check your email to verify the address before signing in.');
  }
  return <main className="min-h-screen bg-saf-bg px-4 py-10 sm:py-16"><div className="mx-auto max-w-lg"><Link to="/" className="mx-auto mb-7 block w-fit"><Logo /></Link><section className="rounded-3xl border border-saf-border bg-saf-white p-6 shadow-card sm:p-9"><div className="text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-saf-blue/10 text-saf-blue"><UserRoundPlus /></span><h1 className="mt-4 text-2xl font-extrabold text-saf-text">Create your account</h1><p className="mt-2 text-sm text-saf-muted">Join SAFEYATRI to personalize your experience</p></div>{!isSupabaseConfigured && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Supabase authentication is not configured for this environment.</p>}
  <form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-sm font-semibold text-saf-text">Full name<input autoComplete="name" required value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-saf-border px-3.5 py-3 outline-none focus:border-saf-blue" /></label><label className="block text-sm font-semibold text-saf-text">Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-saf-border px-3.5 py-3 outline-none focus:border-saf-blue" /></label><label className="block text-sm font-semibold text-saf-text">Password<span className="relative mt-1.5 block"><input type={visible ? 'text' : 'password'} autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-saf-border px-3.5 py-3 pr-12 outline-none focus:border-saf-blue" /><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-saf-muted">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></span><span className="mt-1 block text-xs font-normal text-saf-muted">At least 8 characters.</span></label><label className="block text-sm font-semibold text-saf-text">Confirm password<input type={visible ? 'text' : 'password'} autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-1.5 w-full rounded-xl border border-saf-border px-3.5 py-3 outline-none focus:border-saf-blue" /></label>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}<button disabled={busy || !isSupabaseConfigured} className="w-full rounded-xl gradient-blue-indigo px-4 py-3 font-bold text-white disabled:opacity-60">{busy ? 'Creating account…' : 'Create account'}</button></form><p className="mt-6 text-center text-sm text-saf-muted">Already have an account? <Link to="/login" className="font-bold text-saf-blue">Sign in</Link></p></section></div></main>;
}
