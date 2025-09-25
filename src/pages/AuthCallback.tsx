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
        const code = url.searchParams.get('code');
        const token = url.searchParams.get('token');
        const email = url.searchParams.get('email');

        // Handle account claim tokens - create account automatically
        if (token && email) {
          console.log('Processing account claim token:', token, email);
          
          // Sign out any existing user first to prevent conflicts
          await supabase.auth.signOut();
          
          // Validate the claim token using edge function (bypasses RLS)
          const { data: validationResult, error: validationError } = await supabase.functions.invoke(
            'validate-claim-token',
            {
              body: { token, email: email.toLowerCase() }
            }
          );

          console.log('Validation result:', validationResult, 'Error:', validationError);

          if (validationError || !validationResult?.success) {
            setStatus('error');
            setMsg(validationResult?.error || 'Invalid or expired invitation link. Please request a new invitation.');
            return;
          }

          const claimData = validationResult.claimData;

          // Create user account automatically with a temporary password
          const tempPassword = crypto.randomUUID();
          console.log('Creating user account for:', email.toLowerCase());
          
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: email.toLowerCase(),
            password: tempPassword,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: {
                first_name: claimData.first_name || 'User'
              }
            }
          });

          console.log('Signup result:', authData, 'Error:', signUpError);

          if (signUpError) {
            console.error('Auto signup error:', signUpError);
            
            // Check if user already exists
            if (signUpError.message?.includes('already registered')) {
              // Try to sign in with a magic link instead
              const { error: magicLinkError } = await supabase.auth.signInWithOtp({
                email: email.toLowerCase(),
                options: {
                  emailRedirectTo: `${window.location.origin}/auth?mode=setup`
                }
              });
              
              if (magicLinkError) {
                setStatus('error');
                setMsg('Account exists but failed to send login link. Please contact support.');
                return;
              }
              
              setStatus('success');
              setMsg('Login link sent to your email. Please check your email to continue setup.');
              return;
            } else {
              setStatus('error');
              setMsg(`Failed to create account: ${signUpError.message}`);
              return;
            }
          }

          // Store claim token for completing the claim process after password setup
          sessionStorage.setItem('claimToken', token);
          sessionStorage.setItem('claimEmail', email);
          
          // Set success and redirect to password setup
          setStatus('ready');
          setMsg('Account created! Setting up your password...');
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
      const claimToken = sessionStorage.getItem('claimToken');
      if (claimToken) {
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