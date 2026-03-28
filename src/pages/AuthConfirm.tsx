import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthConfirm() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted && data.session?.user) {
        navigate('/home');
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && mounted) {
        navigate('/home');
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-mint text-4xl animate-pulse">
          ⏳
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Confirming your account…</h1>
        <p className="text-sm text-muted-foreground">
          Please wait while we verify your email and sign you in.
        </p>
      </div>
    </div>
  );
}
