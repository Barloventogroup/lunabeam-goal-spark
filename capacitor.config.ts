import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bcbbec9794c445c19f356ed8dcd5b3b6',
  appName: 'lunabeam-goal-spark',
  webDir: 'dist',
  // Uncomment server block to use live hot-reload from Lovable preview
  server: {
    url: 'https://bcbbec97-94c4-45c1-9f35-6ed8dcd5b3b6.lovableproject.com?forceHideBadge=true&debug=safearea',
    cleartext: true
  }
};

export default config;
