import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// DEV BYPASS: Set to true to skip Supabase auth
const DEV_BYPASS_AUTH = true;

const MOCK_USER = {
  id: 'dev-mock-user-001',
  email: 'dev@calmtrip.local',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
} as unknown as User;

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(DEV_BYPASS_AUTH ? MOCK_USER : null);
  const [loading, setLoading] = useState(DEV_BYPASS_AUTH ? false : true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;

    let mounted = true;

    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted) {
          setUser(user);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return { user, loading, error };
};
