import { useEffect, useState } from 'react';
import { getApiBase } from '../api/client';

/**
 * Detects the common Vercel mistake: SPA rewrites send /api/* to index.html so the UI never reaches the backend.
 */
export function ApiStatusBanner() {
  const [state, setState] = useState({ kind: 'idle', detail: '' });

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const base = getApiBase();
    if (base !== '/api') {
      setState({ kind: 'ok', detail: '' });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${window.location.origin}/api/health/db`, {
          headers: { 'X-Samity-Code': localStorage.getItem('samity_code') || 'default' },
        });
        const text = await r.text();
        if (cancelled) return;
        if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
          setState({
            kind: 'misconfigured',
            detail:
              'This site is loading the HTML shell instead of the API. Add environment variable VITE_API_URL on this Vercel project = your backend URL + /api (then redeploy). Example: https://your-api.vercel.app/api',
          });
          return;
        }
        try {
          const j = JSON.parse(text);
          if (!j.ok || j.memberCount === 0) {
            setState({
              kind: 'empty',
              detail:
                j.memberCount === 0
                  ? 'API is reachable but there are no members for this samity. Run npm run seed:demo against the same MongoDB as Vercel MONGODB_URI.'
                  : j.message || 'API error',
            });
            return;
          }
        } catch {
          setState({ kind: 'misconfigured', detail: 'API returned non-JSON. Check VITE_API_URL.' });
          return;
        }
        setState({ kind: 'ok', detail: '' });
      } catch (e) {
        if (!cancelled) setState({ kind: 'error', detail: e.message || 'Network error' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === 'idle' || state.kind === 'ok') return null;

  const bg =
    state.kind === 'misconfigured'
      ? 'bg-red-50 border-red-200 text-red-900'
      : 'bg-amber-50 border-amber-200 text-amber-900';

  return (
    <div className={`text-xs border rounded-lg px-3 py-2 mb-3 ${bg}`}>
      <strong className="block mb-1">Live data issue</strong>
      <p className="leading-snug">{state.detail}</p>
      <p className="mt-2 leading-snug opacity-90">
        Backend check (open in a new tab): your API deployment →{' '}
        <code className="font-mono text-[10px]">/api/health/db</code> should return JSON with{' '}
        <code className="font-mono text-[10px]">memberCount</code> &gt; 0.
      </p>
    </div>
  );
}
