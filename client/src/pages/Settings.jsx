import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function Settings() {
  const [settings, setSettings] = useState(null);
  const [userForm, setUserForm] = useState({
    email: '',
    phone: '',
    password: '',
    role: 'accountant',
    memberId: '',
  });
  const [members, setMembers] = useState([]);

  const load = async () => {
    const [{ data: s }, { data: m }] = await Promise.all([
      api.get('/settings'),
      api.get('/members'),
    ]);
    setSettings(s.settings);
    setMembers(m.members);
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

  const createUser = async (e) => {
    e.preventDefault();
    const payload = {
      password: userForm.password,
      role: userForm.role,
    };
    if (userForm.email) payload.email = userForm.email;
    if (userForm.phone) payload.phone = userForm.phone;
    if (userForm.role === 'member' && userForm.memberId) payload.memberId = userForm.memberId;
    await api.post('/auth/users', payload);
    setUserForm({ email: '', phone: '', password: '', role: 'accountant', memberId: '' });
    alert('User created');
  };

  if (!settings) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-8 max-w-lg">
      <h1 className="text-2xl font-semibold">Settings</h1>
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

      <form onSubmit={createUser} className="bg-white border rounded-xl p-4 space-y-3 text-sm">
        <h2 className="font-semibold">Create staff / member user</h2>
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Email"
          value={userForm.email}
          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
        />
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Phone"
          value={userForm.phone}
          onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
        />
        <input
          type="password"
          required
          minLength={6}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Password (min 6)"
          value={userForm.password}
          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
        />
        <select
          className="w-full border rounded-lg px-3 py-2"
          value={userForm.role}
          onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
        >
          <option value="accountant">Accountant</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
        {userForm.role === 'member' && (
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={userForm.memberId}
            onChange={(e) => setUserForm({ ...userForm, memberId: e.target.value })}
            required
          >
            <option value="">Link member</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.memberNumber} — {m.name}
              </option>
            ))}
          </select>
        )}
        <button type="submit" className="px-4 py-2 rounded-lg bg-slate-900 text-white">
          Create user
        </button>
      </form>
    </div>
  );
}
