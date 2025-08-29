import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

function getHashParams(hash: string) {
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(h);
  return Object.fromEntries(params.entries());
}

export default function AuthCallback() {
  const nav = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState<string>('Processing…');

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (code) {
          // New-style PKCE callback: exchange ?code= for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          // After exchange, show reset form ONLY if this was a recovery flow
          setStatus('ready');
          setMsg('You are signed in for password recovery.');
          return;
        }

        // Old-style hash callback: #access_token=...&type=recovery
        const hash = window.location.hash || '';
        const hashParams = getHashParams(hash);
        const type = hashParams['type'];

        if (hash && (hashParams['access_token'] || hashParams['refresh_token'])) {
          // Supabase v1 hash tokens — set them as session
          const { data, error } = await supabase.auth.setSession({
            access_token: hashParams['access_token'],
            refresh_token: hashParams['refresh_token']
          });
          if (error) throw error;
          if (type === 'recovery') {
            setStatus('ready');
            setMsg('You are signed in for password recovery.');
            return;
          }
        }

        // Fallback: try auth state event (older flows)
        const { data: sub } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY') {
            setStatus('ready');
            setMsg('You are signed in for password recovery.');
          }
        });
        // Give it a moment; if nothing, assume error
        setTimeout(() => {
          if (status === 'loading') {
            setStatus('error');
            setMsg('No valid recovery token found. Request a new reset link.');
          }
        }, 1200);

        return () => { sub.subscription.unsubscribe(); };
      } catch (e: any) {
        setStatus('error');
        setMsg(e?.message || 'Something went wrong.');
      }
    })();
  }, [status]);

  // When ready, go to reset screen
  useEffect(() => {
    if (status === 'ready') {
      nav('/auth/reset', { replace: true });
    }
  }, [status, nav]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-4 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Auth Callback</h1>
          <p className="text-muted-foreground mt-2">{msg}</p>
          {status === 'error' && (
            <button 
              onClick={() => nav('/auth/request-reset')}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Request new link
            </button>
          )}
        </div>
      </div>
    </div>
  );
}