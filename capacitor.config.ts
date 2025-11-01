import type { CapacitorConfig } from '@capacitor/cli';

// Optional: point native app to your local Vite dev server on the same LAN
// Set env var before syncing: CAP_DEV_SERVER_URL=http://<your-ip>:5173
const devServerUrl = process.env.CAP_DEV_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'app.lovable.bcbbec9794c445c19f356ed8dcd5b3b6',
  appName: 'lunabeam-goal-spark',
  webDir: 'dist',
  ...(devServerUrl ? { server: { url: devServerUrl, cleartext: true } } : {})
};

export default config;
