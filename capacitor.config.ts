import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bcbbec9794c445c19f356ed8dcd5b3b6',
  appName: 'lunabeam-goal-spark',
  webDir: 'dist',
  // No server.url here - loads from capacitor://localhost by default
  // For live-reload during development, temporarily add server.url pointing to your dev server
  plugins: {
    Keyboard: {
      resize: 'none',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
