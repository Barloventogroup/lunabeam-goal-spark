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
    // Force logout and redirect to auth if there are persistent auth issues
    const forceLogout = () => {
      console.log('AuthProvider: Forcing logout due to persistent auth issues');
      supabase.auth.signOut().then(() => {
        setSession(null);
        setUser(null);
        setLoading(false);
        try {
          localStorage.removeItem('lunebeam-store');
          localStorage.clear(); // Clear all localStorage
          console.log('AuthProvider: Cleared all local storage');
        } catch (e) {
          console.warn('AuthProvider: Failed to clear local storage');
        }
        // Force redirect to auth page
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
        console.log('AuthProvider: Auth state change:', event, session?.user?.email);
        console.log('AuthProvider: Current URL:', window.location.href);
        console.log('AuthProvider: Session details:', session);
        if (event === 'SIGNED_OUT') {
          try {
            localStorage.removeItem('lunebeam-store');
            console.log('AuthProvider: Cleared persisted store on sign out');
          } catch (e) {
            console.warn('AuthProvider: Failed to clear persisted store on sign out');
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setContextReady(true);
        
        // Load user profile when signed in
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('AuthProvider: User signed in, loading profile for user:', session.user.id, session.user.email, session.user.user_metadata);
          
          // Check for pending supporter invite
          const pendingInvite = localStorage.getItem('pending_supporter_invite');
          if (pendingInvite) {
            console.log('AuthProvider: Processing pending supporter invite...');
            setTimeout(async () => {
              try {
                // Import here to avoid circular dependency
                const { PermissionsService } = await import('@/services/permissionsService');
                await PermissionsService.acceptSupporterInvite(pendingInvite);
                localStorage.removeItem('pending_supporter_invite');
                console.log('AuthProvider: Supporter invite accepted successfully');
                
                // Redirect to dashboard
                window.location.href = '/';
              } catch (error) {
                console.error('AuthProvider: Failed to accept supporter invite:', error);
                localStorage.removeItem('pending_supporter_invite');
              }
            }, 1000);
          } else {
            // Don't clear store immediately - let profile load first
            setTimeout(() => {
              loadProfile().then(() => {
                console.log('AuthProvider: Profile loaded after sign in');
              }).catch((error) => {
                console.error('AuthProvider: Failed to load profile after sign in:', error);
              });
            }, 0);
          }
        }
      }
    );

    // Check for existing session with error handling for stale tokens
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('AuthProvider: Initial session check:', session?.user?.email, error);
      
      // Handle stale JWT token error
      if (error?.message?.includes('User from sub claim in JWT does not exist')) {
        console.log('AuthProvider: Detected stale JWT token, signing out...');
        supabase.auth.signOut().then(() => {
          setSession(null);
          setUser(null);
          setLoading(false);
          try {
            localStorage.removeItem('lunebeam-store');
            console.log('AuthProvider: Cleared persisted store due to stale token');
          } catch (e) {
            console.warn('AuthProvider: Failed to clear persisted store');
          }
        });
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setContextReady(true);
      
      // Load profile if user is already signed in
      if (session?.user) {
        console.log('AuthProvider: Existing session found, loading profile...');
        setTimeout(() => {
          loadProfile().then(() => {
            console.log('AuthProvider: Profile loaded for existing session');
          }).catch((error) => {
            console.error('AuthProvider: Failed to load profile for existing session:', error);
            // If profile loading fails due to auth issues, try to refresh session
            if (error?.message?.includes('User from sub claim in JWT does not exist')) {
              console.log('AuthProvider: Profile load failed with stale token, signing out...');
              supabase.auth.signOut();
            }
          });
        }, 0);
      }
    }).catch((sessionError) => {
      console.error('AuthProvider: Session check failed:', sessionError);
      // Handle session errors by clearing everything
      setSession(null);
      setUser(null);
      setLoading(false);
      setContextReady(true);
    });

    return () => subscription.unsubscribe();
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

  return (
    <AuthContext.Provider value={value}>
      {contextReady ? children : (
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