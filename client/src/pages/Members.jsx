import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    shares: 1,
    joiningFee: 0,
    joiningFeePaid: false,
    userLogin: '',
    userPassword: '',
  });

  const load = async () => {
    const { data } = await api.get('/members');
    setMembers(data.members);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post('/members', {
      ...form,
      shares: Number(form.shares),
      joiningFee: Number(form.joiningFee),
    });
    setForm({
      name: '',
      phone: '',
      address: '',
      shares: 1,
      joiningFee: 0,
      joiningFeePaid: false,
      userLogin: '',
      userPassword: '',
    });
    await load();
  };

  const toggleStatus = async (m) => {
    const next = m.status === 'active' ? 'inactive' : 'active';
    await api.patch(`/members/${m._id}`, { status: next });
    await load();
  };

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Members</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <form
          onSubmit={create}
          className="lg:col-span-1 space-y-3 bg-white border border-slate-200 rounded-xl p-4 h-fit"
        >
          <h2 className="font-semibold">Add member</h2>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <label className="text-xs text-slate-500">Shares</label>
          <input
            type="number"
            min={0}
            step="1"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.shares}
            onChange={(e) => setForm({ ...form, shares: e.target.value })}
          />
          <label className="text-xs text-slate-500">Joining fee</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.joiningFee}
            onChange={(e) => setForm({ ...form, joiningFee: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.joiningFeePaid}
              onChange={(e) => setForm({ ...form, joiningFeePaid: e.target.checked })}
            />
            Joining fee paid
          </label>
          <p className="text-xs text-slate-500 pt-2">Optional login for member app</p>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Email or phone for login"
            value={form.userLogin}
            onChange={(e) => setForm({ ...form, userLogin: e.target.value })}
          />
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Password (min 6)"
            value={form.userPassword}
            onChange={(e) => setForm({ ...form, userPassword: e.target.value })}
          />
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-brand-600 text-white text-sm font-medium"
          >
            Create member
          </button>
        </form>
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Shares</th>
                <th className="text-left p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id} className="border-t border-slate-100">
                  <td className="p-3 font-mono text-xs">{m.memberNumber}</td>
                  <td className="p-3">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.phone}</div>
                  </td>
                  <td className="p-3">{m.shares}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${m.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200'}`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      className="text-brand-600 text-xs font-medium"
                      onClick={() => toggleStatus(m)}
                    >
                      {m.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
