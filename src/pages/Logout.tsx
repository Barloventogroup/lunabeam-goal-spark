import { useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

const Logout = () => {
  useEffect(() => {
    (async () => {
      try {
        console.log('Logout: Signing out...');
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Logout: signOut error (ignored):', e);
      } finally {
        try {
          localStorage.removeItem('lunebeam-store');
          localStorage.clear();
          console.log('Logout: Cleared local storage');
        } catch (e) {
          console.warn('Logout: Failed to clear local storage');
        }
        // Hard redirect to ensure a clean auth flow
        window.location.replace('/auth');
      }
    })();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
};

export default Logout;
