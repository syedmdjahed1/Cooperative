import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function Settings() {
  const [settings, setSettings] = useState(null);

  const load = async () => {
    const { data: s } = await api.get('/settings');
    setSettings(s.settings);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.patch('/settings', {
      monthlyInstallment: Number(settings.monthlyInstallment),
      shareParValue: Number(settings.shareParValue),
      currency: settings.currency,
    });
    await load();
    alert('Saved');
  };

  if (!settings) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-8 max-w-lg">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
        User accounts and passwords are disabled in this demo build.
      </p>
      <form onSubmit={save} className="bg-white border rounded-xl p-4 space-y-3 text-sm">
        <h2 className="font-semibold">Samity defaults</h2>
        <label className="block">
          <span className="text-xs text-slate-500">Monthly installment (for due calculations)</span>
          <input
            type="number"
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={settings.monthlyInstallment}
            onChange={(e) => setSettings({ ...settings, monthlyInstallment: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Share par value (optional, for display)</span>
          <input
            type="number"
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={settings.shareParValue}
            onChange={(e) => setSettings({ ...settings, shareParValue: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Currency label</span>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={settings.currency}
            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
          />
        </label>
        <button type="submit" className="px-4 py-2 rounded-lg bg-brand-600 text-white">
          Save settings
        </button>
      </form>
    </div>
  );
}
