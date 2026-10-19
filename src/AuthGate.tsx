import React, { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import App from './App';
import { AuthPage } from './components/AuthPage';
import { isSupabaseConfigured, supabase } from './lib/supabase';

export interface AppUser {
  id: string;
  email: string;
  name: string;
}

// Shows the login page until there is a Supabase session, then the app
export const AuthGate: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [signedOutNotice, setSignedOutNotice] = useState<string | null>(null);
  // Set when the user chooses Log out, so that sign-out is not reported as an expired session
  const signingOutRef = useRef(false);

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_OUT') {
        setSignedOutNotice(signingOutRef.current ? null : 'Your session has expired. Log in again to continue.');
        signingOutRef.current = false;
      }
      if (event === 'SIGNED_IN') setSignedOutNotice(null);
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-sm text-gray-700 bg-gray-50">
        Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart the app.
      </div>
    );
  }
  if (checking) return <div className="min-h-screen bg-gray-50" />;
  if (recovering) return <AuthPage initialMode="reset" onPasswordReset={() => setRecovering(false)} />;
  if (!session) return <AuthPage key={signedOutNotice || 'login'} initialNotice={signedOutNotice || undefined} />;

  const user: AppUser = {
    id: session.user.id,
    email: session.user.email || '',
    name: (session.user.user_metadata?.full_name as string) || session.user.email || 'Signed in',
  };
  // Keyed by user so switching accounts starts from a clean state
  return <App key={user.id} user={user} onSignOut={() => {
        signingOutRef.current = true;
        supabase!.auth.signOut();
      }} />;
};
