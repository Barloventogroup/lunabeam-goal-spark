import type { CapacitorConfig } from '@capacitor/cli';

// PHASE 4: Cache-busting with build ID and timestamp
const buildId = process.env.VITE_BUILD_ID || 'dev';
const timestamp = Date.now();

const config: CapacitorConfig = {
  appId: 'app.lovable.bcbbec9794c445c19f356ed8dcd5b3b6',
  appName: 'lunabeam-goal-spark',
  webDir: 'dist',
  server: {
    url: `https://lunabeam-goal-spark.lovable.app?v=${buildId}&_nocache=${timestamp}`,
    cleartext: true
  }
};

export default config;
