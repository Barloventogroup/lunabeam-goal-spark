import React, { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';

const SafeAreaProbe: React.FC = () => {
  const [insets, setInsets] = useState({ top: '0px', bottom: '0px', left: '0px', right: '0px' });
  
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

  useEffect(() => {
    if (!show) return;

    const measureInsets = () => {
      // Create a temporary probe element to measure env() values
      const probe = document.createElement('div');
      probe.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 1px;
        height: 1px;
        pointer-events: none;
        opacity: 0;
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
      `;
      
      document.body.appendChild(probe);
      
      const computedStyle = window.getComputedStyle(probe);
      const measured = {
        top: computedStyle.paddingTop,
        bottom: computedStyle.paddingBottom,
        left: computedStyle.paddingLeft,
        right: computedStyle.paddingRight,
      };
      
      document.body.removeChild(probe);
      
      console.log('🔍 Safe Area Probe Results:');
      console.log(`  env(safe-area-inset-top):    ${measured.top}`);
      console.log(`  env(safe-area-inset-bottom): ${measured.bottom}`);
      console.log(`  env(safe-area-inset-left):   ${measured.left}`);
      console.log(`  env(safe-area-inset-right):  ${measured.right}`);
      
      if (measured.top === '0px' && measured.bottom === '0px') {
        console.warn('⚠️ All safe area insets are 0px - viewport-fit=cover may not be working!');
      }
      
      setInsets(measured);
    };

    // Measure after a short delay to ensure CSS is loaded
    const timer = setTimeout(measureInsets, 500);
    
    return () => clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        zIndex: 9999,
        pointerEvents: 'none',
        whiteSpace: 'pre-line',
      }}
    >
      {`Safe Area Insets:
Top: ${insets.top}
Bottom: ${insets.bottom}
Left: ${insets.left}
Right: ${insets.right}`}
    </div>
  );
};

export default SafeAreaProbe;
