import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from '@/components/auth/auth-provider'
import { useStore } from '@/store/useStore'

// PHASE 4: DIAGNOSTIC LOGGING
console.log('🚀 main.tsx EXECUTING');
console.log('🚀 main.tsx Origin:', window.location.origin);
console.log('🚀 main.tsx Href:', window.location.href);

// PHASE 1: NUCLEAR SERVICE WORKER ELIMINATION
const CURRENT_BUILD = import.meta.env.VITE_BUILD_ID || 'dev';
const LAST_BUILD_KEY = 'last_build_id';
const SW_CLEARED_KEY = 'sw_cleared_session';

async function nukeServiceWorkers() {
  console.log('🧨 Starting Service Worker nuclear elimination...');
  
  // PHASE 4: DIAGNOSTIC LOGGING
  console.log('🧨 VITE_BUILD_ID:', CURRENT_BUILD);
  
  // Check if we've already cleared this session
  const clearedThisSession = sessionStorage.getItem(SW_CLEARED_KEY);
  const lastBuild = localStorage.getItem(LAST_BUILD_KEY);
  const buildChanged = lastBuild !== CURRENT_BUILD;
  
  console.log('🧨 Last Build:', lastBuild);
  console.log('🧨 Build Changed:', buildChanged);
  console.log('🧨 Cleared This Session:', clearedThisSession);
  
  if (clearedThisSession && !buildChanged) {
    console.log('✅ SW already cleared this session');
    return;
  }

  try {
    // 1. Unregister ALL service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`🧹 Found ${registrations.length} service workers to unregister`);
      
      await Promise.all(
        registrations.map(async (registration) => {
          await registration.unregister();
          console.log('🧹 Unregistered SW:', registration.scope);
        })
      );

      // Wait for active SW to finish unregistering
      if (navigator.serviceWorker.controller) {
        await navigator.serviceWorker.ready.then(reg => reg.unregister());
        console.log('🧹 Unregistered active controller');
      }
    }

    // 2. Delete ALL caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`🧹 Found ${cacheNames.length} caches to delete:`, cacheNames);
      
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          await caches.delete(cacheName);
          console.log('🧹 Deleted cache:', cacheName);
        })
      );
    }

    // 3. Mark this session as cleared
    sessionStorage.setItem(SW_CLEARED_KEY, 'true');
    localStorage.setItem(LAST_BUILD_KEY, CURRENT_BUILD);
    
    console.log('✅ Service Worker nuclear elimination complete');
    
    // 4. Force reload if build changed (only once)
    if (buildChanged && !clearedThisSession) {
      console.log('🔄 Build changed, forcing reload...');
      window.location.reload();
      return;
    }
  } catch (error) {
    console.error('❌ Error during SW elimination:', error);
  }
}

// Run before React renders (async IIFE to avoid top-level await)
(async () => {
  await nukeServiceWorkers();
})();

// For testing - expose reset function to console
if (typeof window !== 'undefined') {
  (window as any).resetOnboarding = () => {
    useStore.getState().resetOnboarding();
    console.log('Onboarding reset! Refresh the page to see role selection.');
  };
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
