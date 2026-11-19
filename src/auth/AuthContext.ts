import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export type SafeyatriRole = 'user' | 'admin';
export type Profile = { id: string; email: string; full_name: string; role: SafeyatriRole };
export type AuthContextValue = { session: Session | null; user: User | null; profile: Profile | null; loading: boolean; isDemoAdmin: boolean; activateDemoAdmin: () => void; clearDemoAdmin: () => void; refreshProfile: () => Promise<void> };
export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
