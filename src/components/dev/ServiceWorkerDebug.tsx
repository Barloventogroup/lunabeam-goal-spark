import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface DiagnosticInfo {
  activeServiceWorkers: string[];
  cacheNames: string[];
  origin: string;
  buildId: string;
}

const ServiceWorkerDebug: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo>({
    activeServiceWorkers: [],
    cacheNames: [],
    origin: '',
    buildId: ''
  });
  const [isVisible, setIsVisible] = useState(false);

  const loadDiagnostics = async () => {
    const info: DiagnosticInfo = {
      activeServiceWorkers: [],
      cacheNames: [],
      origin: window.location.origin,
      buildId: import.meta.env.VITE_BUILD_ID || 'dev'
    };

    // Check for active service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      info.activeServiceWorkers = registrations.map(reg => reg.scope);
    }

    // Check for caches
    if ('caches' in window) {
      info.cacheNames = await caches.keys();
    }

    setDiagnostics(info);
  };

  const forceClearAll = async () => {
    console.log('🧨 Force clearing all data...');
    
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }

    // Delete all caches
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
    }

    // Clear storage
    localStorage.clear();
    sessionStorage.clear();

    console.log('✅ All data cleared, reloading...');
    window.location.reload();
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-16 right-2 z-[9999] px-2 py-1 rounded-md text-[10px] bg-purple-500/70 text-white border border-purple-300 shadow-sm"
      >
        SW Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-16 right-2 z-[9999] w-80 max-h-96 overflow-y-auto bg-background/95 backdrop-blur border border-border rounded-lg shadow-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">SW Diagnostics</h3>
        <button onClick={() => setIsVisible(false)} className="text-xs">✕</button>
      </div>
      
      <div className="space-y-2 text-xs font-mono">
        <div>
          <div className="font-bold">Origin:</div>
          <div className="text-muted-foreground break-all">{diagnostics.origin}</div>
        </div>

        <div>
          <div className="font-bold">Build ID:</div>
          <div className="text-muted-foreground">{diagnostics.buildId}</div>
        </div>

        <div>
          <div className="font-bold">Service Workers:</div>
          {diagnostics.activeServiceWorkers.length === 0 ? (
            <div className="text-green-500">✅ None active</div>
          ) : (
            <div className="text-red-500">
              ⚠️ {diagnostics.activeServiceWorkers.length} active:
              {diagnostics.activeServiceWorkers.map((sw, i) => (
                <div key={i} className="break-all ml-2">{sw}</div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="font-bold">Caches:</div>
          {diagnostics.cacheNames.length === 0 ? (
            <div className="text-green-500">✅ None found</div>
          ) : (
            <div className="text-yellow-500">
              ⚠️ {diagnostics.cacheNames.length} found:
              {diagnostics.cacheNames.map((name, i) => (
                <div key={i} className="break-all ml-2">{name}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <Button
          onClick={loadDiagnostics}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          🔄 Refresh
        </Button>
        <Button
          onClick={forceClearAll}
          variant="destructive"
          size="sm"
          className="w-full text-xs"
        >
          🧨 Force Clear & Reload
        </Button>
      </div>
    </div>
  );
};

export default ServiceWorkerDebug;
