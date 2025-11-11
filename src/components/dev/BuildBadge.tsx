import React from 'react';

const BuildBadge: React.FC = () => {
  const buildId = import.meta.env.VITE_BUILD_ID as string | undefined;
  if (!buildId) return null;
  return (
    <div className="fixed right-2 z-[9999]" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}>
      <div className="px-2 py-1 rounded-md text-[10px] bg-muted/70 text-muted-foreground border border-border shadow-sm">
        Build {buildId}
      </div>
    </div>
  );
};

export default BuildBadge;
