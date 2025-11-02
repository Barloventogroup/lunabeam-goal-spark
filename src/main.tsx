import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from '@/components/auth/auth-provider'
import { useStore } from '@/store/useStore'

// CRITICAL: Unregister any service workers to prevent stale cache in iOS
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('🧹 Unregistered service worker:', registration.scope);
    });
  });
}

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
