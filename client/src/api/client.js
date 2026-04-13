import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

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
