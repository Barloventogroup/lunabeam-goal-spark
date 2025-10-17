// src/services/config.ts

// Central place for environment variables
export const SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL;
console.log("SITE_URL =", SITE_URL);

// Feature flag: Disable deterministic fallback to observe pure AI generation
// TRUE = Pure AI mode only (no fallback steps)
export const PM_DISABLE_FALLBACK = true;
