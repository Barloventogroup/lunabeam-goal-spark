import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Lottie from 'lottie-react';
import loadingLunaAnimation from '@/assets/loading-luna-animation.json';

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
        const code = url.searchParams.get('code');
        const token = url.searchParams.get('token');
        const email = url.searchParams.get('email');

        // Handle account claim tokens (email optional)
        if (token) {
          console.log('Processing account claim with token:', token, 'email:', email);
          
          try {
            // Use claim-bootstrap to validate token and get temporary credentials
            const { data: bootstrapData, error: bootstrapError } = await supabase.functions.invoke(
              'claim-bootstrap',
              {
                body: email ? { token, email: email.toLowerCase() } : { token }
              }
            );

            console.log('Bootstrap result:', bootstrapData, 'Error:', bootstrapError);

            if (bootstrapError || !bootstrapData?.success) {
              console.error('Claim bootstrap failed:', bootstrapError || bootstrapData?.error);
              setStatus('error');
              setMsg(bootstrapData?.error || 'Invalid or expired invitation link');
              return;
            }

            // Sign in immediately with the temporary password
            console.log('Signing in with temporary credentials for:', bootstrapData.email);
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: bootstrapData.email,
              password: bootstrapData.tempPassword
            });

            if (signInError) {
              console.error('Temporary sign-in failed:', signInError);
              setStatus('error');
              setMsg('Failed to authenticate account');
              return;
            }

            console.log('✅ Successfully signed in with temporary credentials');
            
            // Store claim info for password setup
            sessionStorage.setItem('claimData', JSON.stringify({
              individual_id: bootstrapData.individualId,
              first_name: bootstrapData.firstName,
              token: token
            }));
            
            // Confirm session and navigate to setup while maintaining React context
            await supabase.auth.getSession();
            nav('/auth?mode=setup', { replace: true });
            return;
            
          } catch (error) {
            console.error('Account claim processing error:', error);
            setStatus('error');
            setMsg('Failed to process account claim');
            return;
          }
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

        // Old-style hash callback: #access_token=...&type=recovery
        const hash = window.location.hash || '';
        const hashParams = getHashParams(hash);
        const type = hashParams['type'];

        if (hash && (hashParams['access_token'] || hashParams['refresh_token'])) {
          // Supabase v1 hash tokens — set them as session
          const { error } = await supabase.auth.setSession({
            access_token: hashParams['access_token'],
            refresh_token: hashParams['refresh_token']
          });
          if (error) throw error;
          if (type === 'recovery') {
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
  }, [status, nav]);

  // Redirects based on intent with delay for success
  useEffect(() => {
    if (status === 'ready') {
      // Check if this is a claim setup
      const claimData = sessionStorage.getItem('claimData');
      if (claimData) {
        nav('/auth?mode=setup', { replace: true });
      } else {
        nav('/auth/reset', { replace: true });
      }
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
      <div className="min-h-screen w-screen bg-white flex items-center justify-center overflow-hidden">
        <Lottie
          animationData={loadingLunaAnimation}
          loop={false}
          style={{ width: '120vmax', height: '120vmax' }}
        />
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