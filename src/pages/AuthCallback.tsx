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
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading');
  const [msg, setMsg] = useState<string>('Processing…');

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const errorDesc = url.searchParams.get('error_description') || url.searchParams.get('error');
        const code = url.searchParams.get('code');
        const token_hash = url.searchParams.get('token_hash');
        const type = url.searchParams.get('type'); // signup | recovery | invite | email_change

        if (errorDesc) {
          setStatus('error');
          setMsg(errorDesc);
          return;
        }

        if (code) {
          // New-style PKCE callback: exchange ?code= for a session (email confirm, magic link, etc.)
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          try { localStorage.removeItem('lunebeam-store'); } catch {}
          setStatus('success');
          setMsg('Email confirmed! Redirecting…');
          return;
        }

        if (token_hash && type) {
          // Token-hash callback (signup, invite, email change, recovery)
          const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
          if (error) throw error;
          if (type === 'recovery') {
            setStatus('ready');
            setMsg('You are signed in for password recovery.');
            return;
          }
          try { localStorage.removeItem('lunebeam-store'); } catch {}
          setStatus('success');
          setMsg('Email confirmed! Redirecting…');
          return;
        }

        // Old-style hash callback: #access_token=...&type=recovery
        const hash = window.location.hash || '';
        const hashParams = getHashParams(hash);
        const legacyType = hashParams['type'];

        if (hash && (hashParams['access_token'] || hashParams['refresh_token'])) {
          // Supabase v1 hash tokens — set them as session
          const { error } = await supabase.auth.setSession({
            access_token: hashParams['access_token'],
            refresh_token: hashParams['refresh_token']
          });
          if (error) throw error;
          if (legacyType === 'recovery') {
            setStatus('ready');
            setMsg('You are signed in for password recovery.');
            return;
          } else {
            try { localStorage.removeItem('lunebeam-store'); } catch {}
            setStatus('success');
            setMsg('Email confirmed! Redirecting…');
            return;
          }
        }

        // If already signed in (e.g., provider callback), proceed
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          try { localStorage.removeItem('lunebeam-store'); } catch {}
          setStatus('success');
          setMsg('Signed in! Redirecting…');
          return;
        }

        setStatus('error');
        setMsg('Invalid or expired link. Please request a new one.');
      } catch (e: any) {
        setStatus('error');
        setMsg(e?.message || 'Something went wrong.');
      }
    })();
  }, []);

  // Redirects based on intent with delay for success
  useEffect(() => {
    if (status === 'ready') {
      nav('/auth/reset', { replace: true });
    }
    if (status === 'success') {
      // Show confirmation message for 2 seconds before redirecting
      setTimeout(() => {
        nav('/', { replace: true });
      }, 2000);
    }
  }, [status, nav]);

  // Show a simple loading state while processing
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full space-y-4 p-6 text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Email confirmed!</h1>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show error state only if there's an error
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full space-y-4 p-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Authentication Error</h1>
          <p className="text-muted-foreground mt-2">{msg}</p>
          <button 
            onClick={() => nav('/auth/request-reset')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Request new link
          </button>
        </div>
      </div>
    );
  }

  // Show minimal loading for other states
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}