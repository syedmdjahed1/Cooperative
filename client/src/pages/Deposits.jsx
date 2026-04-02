import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function Deposits() {
  const { isAdmin, isAccountant } = useAuth();
  const canReview = isAdmin || isAccountant;
  const [deposits, setDeposits] = useState([]);
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    memberId: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7),
    paymentMethod: 'cash',
    note: '',
  });

  const load = async () => {
    const q = filter === 'all' ? '' : `?status=${filter}`;
    const { data } = await api.get(`/deposits${q}`);
    setDeposits(data.deposits);
    if (canReview) {
      const m = await api.get('/members');
      setMembers(m.data.members);
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, [filter, canReview]);

  const approve = async (id) => {
    await api.patch(`/deposits/${id}/approve`);
    await load();
  };

  const reject = async (id) => {
    const reason = window.prompt('Reason (optional)') || '';
    await api.patch(`/deposits/${id}/reject`, { reason });
    await load();
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      amount: Number(form.amount),
      month: form.month,
      paymentMethod: form.paymentMethod,
      note: form.note,
    };
    if (canReview && form.memberId) payload.memberId = form.memberId;
    await api.post('/deposits', payload);
    setForm({ ...form, amount: '', note: '' });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Deposits</h1>
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {canReview && (
        <form
          onSubmit={submit}
          className="bg-white border border-slate-200 rounded-xl p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm"
        >
          <div>
            <label className="text-xs text-slate-500">Member</label>
            <select
              className="w-full border rounded-lg px-2 py-2 mt-1"
              value={form.memberId}
              onChange={(e) => setForm({ ...form, memberId: e.target.value })}
              required
            >
              <option value="">Select</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.memberNumber} — {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Amount</label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded-lg px-2 py-2 mt-1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Month (YYYY-MM)</label>
            <input
              className="w-full border rounded-lg px-2 py-2 mt-1"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
              pattern="\d{4}-\d{2}"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Method</label>
            <select
              className="w-full border rounded-lg px-2 py-2 mt-1"
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-500">Note</label>
            <input
              className="w-full border rounded-lg px-2 py-2 mt-1"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-brand-600 text-white font-medium"
            >
              Submit deposit
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-600">
              <th className="p-3">When</th>
              <th className="p-3">Month</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Method</th>
              <th className="p-3">Status</th>
              {canReview && <th className="p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {deposits.map((d) => (
              <tr key={d._id} className="border-t border-slate-100">
                <td className="p-3 whitespace-nowrap">{new Date(d.createdAt).toLocaleString()}</td>
                <td className="p-3">{d.month}</td>
                <td className="p-3">{d.amount?.toLocaleString()}</td>
                <td className="p-3 capitalize">{d.paymentMethod}</td>
                <td className="p-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100">{d.status}</span>
                </td>
                {canReview && (
                  <td className="p-3 space-x-2 whitespace-nowrap">
                    {d.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="text-emerald-600 font-medium"
                          onClick={() => approve(d._id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="text-red-600 font-medium"
                          onClick={() => reject(d._id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
