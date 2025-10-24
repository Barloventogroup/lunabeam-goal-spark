import React, { useMemo } from 'react';
import { Capacitor } from '@capacitor/core';

const SafeAreaDebugger: React.FC = () => {
  const show = useMemo(() => {
    if (typeof window === 'undefined') return false;
    
    // Check URL parameters
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const hasDebugParam = params.get('debug') === 'safearea' || hashParams.get('debug') === 'safearea';
    
    // Auto-enable on native platforms in development mode
    const isNative = Capacitor.isNativePlatform();
    const isDev = import.meta.env.DEV;
    
    return hasDebugParam || (isNative && isDev);
  }, []);

  if (!show) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'env(safe-area-inset-top)',
          background: 'rgba(0, 150, 255, 0.25)',
          zIndex: 9998,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'env(safe-area-inset-bottom)',
          background: 'rgba(0, 150, 255, 0.25)',
          zIndex: 9998,
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

export default SafeAreaDebugger;
