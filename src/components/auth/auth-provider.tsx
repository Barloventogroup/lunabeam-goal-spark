import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string) => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Make force login available globally for debugging
declare global {
  interface Window {
    forceLogin: () => void;
  }
}

if (typeof window !== 'undefined') {
  window.forceLogin = () => {
    console.log('Forcing login page...');
    localStorage.setItem('force-logout', 'true');
    window.location.reload();
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [contextReady, setContextReady] = useState(false);
  const { loadProfile } = useStore();

  useEffect(() => {
    let watchdogTimer: NodeJS.Timeout | null = null;
    let cleanupDone = false;

    const markReady = () => {
      if (!cleanupDone) {
        setContextReady(true);
        if (watchdogTimer) {
          clearTimeout(watchdogTimer);
          watchdogTimer = null;
        }
      }
    };

    // AGGRESSIVE OPTIMIZATION: Skip session check entirely on /auth pages
    const isAuthPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');
    
    if (isAuthPage) {
      // Instantly mark as ready for auth pages - no session check needed
      console.log('AuthProvider: On auth page, skipping session check for instant load');
      setLoading(false);
      setContextReady(true);
      setSession(null);
      setUser(null);
    }

    // Reduced watchdog timer: force ready after 1 second for non-auth pages
    watchdogTimer = setTimeout(() => {
      if (!cleanupDone && !isAuthPage) {
        console.warn('AuthProvider: Watchdog timer fired - forcing context ready');
        setLoading(false);
        setContextReady(true);
      }
    }, 1000);

    // Force logout and redirect to auth if there are persistent auth issues
    const forceLogout = () => {
      console.log('AuthProvider: Forcing logout due to persistent auth issues');
      supabase.auth.signOut().then(() => {
        setSession(null);
        setUser(null);
        setLoading(false);
        markReady();
        try {
          localStorage.removeItem('lunebeam-store');
          localStorage.clear();
        } catch (e) {
          console.warn('AuthProvider: Failed to clear local storage');
        }
        window.location.href = '/auth';
      });
    };

    // Check for force logout flag
    if (localStorage.getItem('force-logout') === 'true') {
      localStorage.removeItem('force-logout');
      forceLogout();
      return;
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthProvider: Auth state change:', event, session?.user?.email || 'no user');
        
        if (event === 'SIGNED_OUT') {
          try {
            localStorage.removeItem('lunebeam-store');
          } catch (e) {
            console.warn('AuthProvider: Failed to clear persisted store on sign out');
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        markReady();
        
        // Load user profile when signed in (skip on auth pages)
        if (event === 'SIGNED_IN' && session?.user) {
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          const isOnAuthPage = currentPath.startsWith('/auth');
          
          if (!isOnAuthPage) {
            console.log('AuthProvider: User signed in, loading profile');
            
            // Check for pending supporter invite
            const pendingInvite = localStorage.getItem('pending_supporter_invite');
            if (pendingInvite) {
              console.log('AuthProvider: Processing pending supporter invite');
              setTimeout(async () => {
                try {
                  const { PermissionsService } = await import('@/services/permissionsService');
                  await PermissionsService.acceptSupporterInvite(pendingInvite);
                  localStorage.removeItem('pending_supporter_invite');
                  console.log('AuthProvider: Supporter invite accepted');
                  window.location.href = '/';
                } catch (error) {
                  console.error('AuthProvider: Failed to accept supporter invite:', error);
                  localStorage.removeItem('pending_supporter_invite');
                }
              }, 1000);
            } else {
              setTimeout(() => {
                loadProfile().catch((error) => {
                  console.error('AuthProvider: Failed to load profile after sign in:', error);
                });
              }, 0);
            }
          } else {
            console.log('AuthProvider: On auth page, skipping profile load');
          }
        }
      }
    );

    // Check for existing session with defensive error handling
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthProvider: Initial session check:', session?.user?.email || 'no session');
        
        // Handle stale JWT token error
        if (error?.message?.includes('User from sub claim in JWT does not exist')) {
          console.log('AuthProvider: Detected stale JWT token, signing out');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          try {
            localStorage.removeItem('lunebeam-store');
          } catch (e) {
            console.warn('AuthProvider: Failed to clear persisted store');
          }
          markReady();
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        markReady();
        
        // Load profile if user is already signed in (skip on auth pages)
        if (session?.user) {
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          const isOnAuthPage = currentPath.startsWith('/auth');
          
          if (!isOnAuthPage) {
            setTimeout(() => {
              loadProfile().catch((error) => {
                console.error('AuthProvider: Failed to load profile for existing session:', error);
                if (error?.message?.includes('User from sub claim in JWT does not exist')) {
                  console.log('AuthProvider: Profile load failed with stale token, signing out');
                  supabase.auth.signOut();
                }
              });
            }, 0);
          } else {
            console.log('AuthProvider: On auth page, skipping profile load for existing session');
          }
        }
      } catch (sessionError) {
        console.error('AuthProvider: Session check failed:', sessionError);
        setSession(null);
        setUser(null);
        setLoading(false);
        markReady();
      }
    };

    // Only check session if NOT on auth page
    if (!isAuthPage) {
      initializeSession();
    }

    return () => {
      cleanupDone = true;
      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
      }
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = async (email: string, password: string, firstName: string) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
  };

  // Check if we're on /auth - if so, render children immediately to avoid blocking
  const isAuthPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');
  const shouldRenderChildren = contextReady || isAuthPage;

  return (
    <AuthContext.Provider value={value}>
      {shouldRenderChildren ? children : (
        <div className="min-h-[100dvh] flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}