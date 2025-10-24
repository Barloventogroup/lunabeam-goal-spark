import React, { useMemo } from 'react';

const SafeAreaDebugger: React.FC = () => {
  const show = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === 'safearea';
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
