import axios from 'axios';

/**
 * Production on Vercel: the static site must call a *separate* API deployment.
 * Set VITE_API_URL (or vite_api_url) at build time to https://YOUR-API.vercel.app/api
 * Or set window.__SAMITY_API_URL__ in index.html before the app loads.
 */
export function getApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL || import.meta.env.vite_api_url;
  if (fromEnv) return String(fromEnv).replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.__SAMITY_API_URL__) {
    return String(window.__SAMITY_API_URL__).replace(/\/$/, '');
  }
  return '/api';
}

const baseURL = getApiBase();

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

if (typeof localStorage !== 'undefined') {
  const code = localStorage.getItem('samity_code') || 'default';
  api.defaults.headers.common['X-Samity-Code'] = code;
}

export function setSamityCode(code) {
  if (code) api.defaults.headers.common['X-Samity-Code'] = code;
  else delete api.defaults.headers.common['X-Samity-Code'];
}
