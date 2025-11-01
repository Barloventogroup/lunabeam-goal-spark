import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from '@/components/auth/auth-provider'
import { useStore } from '@/store/useStore'

// For testing - expose reset function to console
if (typeof window !== 'undefined') {
  (window as any).resetOnboarding = () => {
    useStore.getState().resetOnboarding();
    console.log('Onboarding reset! Refresh the page to see role selection.');
  };

  // Global error handlers to reveal JS exceptions inside Capacitor WKWebView
  window.addEventListener('error', (e) => {
    console.error('[GlobalError]', (e as any).message, (e as any).error?.stack || (e as any).error);
  });
  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    console.error('[UnhandledRejection]', e.reason);
  });
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
