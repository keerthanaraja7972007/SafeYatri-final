const DEMO_ADMIN_EMAIL = 'keerthanaraja797@gmail.com';
const DEMO_ADMIN_PASSWORD_DIGEST = '355e5501997ec8140fb22841995b69005134b1482a54c9eab5784673fe1cb710';

export async function matchesDemoAdminCredentials(email: string, password: string) {
  if (email !== DEMO_ADMIN_EMAIL) return false;
  const bytes = new TextEncoder().encode(password);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return hex === DEMO_ADMIN_PASSWORD_DIGEST;
}
