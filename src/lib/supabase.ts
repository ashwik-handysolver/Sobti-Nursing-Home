import { createClient } from '@supabase/supabase-js';

// Values come from .env.local (VITE_ prefix makes them available to the browser app)
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

// "Keep me logged in": the session is kept in localStorage (survives closing the browser) or,
// when unticked, in sessionStorage (ends when the tab or browser is closed). Ticked by default.
const KEEP_SIGNED_IN_KEY = 'meetmind_keep_signed_in';

export const getKeepSignedIn = (): boolean => {
  try {
    return localStorage.getItem(KEEP_SIGNED_IN_KEY) !== '0';
  } catch {
    return true;
  }
};

export const setKeepSignedIn = (keep: boolean) => {
  try {
    localStorage.setItem(KEEP_SIGNED_IN_KEY, keep ? '1' : '0');
  } catch {}
};

const sessionStore = {
  getItem: (key: string) => {
    try {
      return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      const [keep, drop] = getKeepSignedIn() ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
      keep.setItem(key, value);
      drop.removeItem(key);
    } catch {}
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {}
  },
};

export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!, { auth: { storage: sessionStore, persistSession: true } })
  : null;
