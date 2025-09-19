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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { loadProfile } = useStore();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthProvider: Auth state change:', event, session?.user?.email);
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
        
        // Load user profile when signed in
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            localStorage.removeItem('lunebeam-store');
            console.log('AuthProvider: Cleared persisted store on sign in');
          } catch (e) {
            console.warn('AuthProvider: Failed to clear persisted store on sign in');
          }
          console.log('AuthProvider: User signed in, loading profile...');
          setTimeout(() => {
            loadProfile().then(() => {
              console.log('AuthProvider: Profile loaded after sign in');
            }).catch((error) => {
              console.error('AuthProvider: Failed to load profile after sign in:', error);
            });
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthProvider: Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Load profile if user is already signed in
      if (session?.user) {
        console.log('AuthProvider: Existing session found, loading profile...');
        setTimeout(() => {
          loadProfile().then(() => {
            console.log('AuthProvider: Profile loaded for existing session');
          }).catch((error) => {
            console.error('AuthProvider: Failed to load profile for existing session:', error);
          });
        }, 0);
      }
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
      {children}
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