import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function MemberDashboard() {
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [depForm, setDepForm] = useState({
    amount: '',
    month: new Date().toISOString().slice(0, 7),
    paymentMethod: 'cash',
    note: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: d } = await api.get('/members');
        if (cancelled) return;
        const list = d.members || [];
        setMembers(list);
        setMemberId((prev) => prev || list[0]?._id || '');
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.message || 'Failed to load members');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: d } = await api.get('/members/me/summary', { params: { memberId } });
        if (!cancelled) {
          setData(d);
          setErr('');
        }
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.message || 'Failed to load');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const submitDeposit = async (e) => {
    e.preventDefault();
    if (!data?.member?._id) return;
    await api.post('/deposits', {
      memberId: data.member._id,
      amount: Number(depForm.amount),
      month: depForm.month,
      paymentMethod: depForm.paymentMethod,
      note: depForm.note,
    });
    setDepForm({ amount: '', month: depForm.month, paymentMethod: depForm.paymentMethod, note: '' });
    const { data: d } = await api.get('/members/me/summary', { params: { memberId: data.member._id } });
    setData(d);
  };

  if (err && !data && !members.length) return <div className="text-red-600">{err}</div>;
  if (!memberId && members.length === 0) return <div className="text-slate-500">No members yet.</div>;
  if (!data) return <div className="text-slate-500">Loading…</div>;

  const { member, totalDeposited, profitLoss, currentBalance, dueAdvance, recentDeposits } = data;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-800">Member preview</h1>
        <select
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
        >
          {members.map((m) => (
            <option key={m._id} value={m._id}>
              {m.memberNumber} — {m.name}
            </option>
          ))}
        </select>
      </div>
      <h2 className="text-lg text-slate-700">Welcome, {member.name}</h2>
      <form
        onSubmit={submitDeposit}
        className="bg-white rounded-xl border border-slate-200 p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm"
      >
        <h3 className="sm:col-span-2 lg:col-span-4 font-semibold">Submit installment</h3>
        <input
          type="number"
          step="0.01"
          required
          className="border rounded-lg px-3 py-2"
          placeholder="Amount"
          value={depForm.amount}
          onChange={(e) => setDepForm({ ...depForm, amount: e.target.value })}
        />
        <input
          type="month"
          required
          className="border rounded-lg px-3 py-2"
          value={depForm.month}
          onChange={(e) => setDepForm({ ...depForm, month: e.target.value })}
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={depForm.paymentMethod}
          onChange={(e) => setDepForm({ ...depForm, paymentMethod: e.target.value })}
        >
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
        </select>
        <button type="submit" className="py-2 rounded-lg bg-brand-600 text-white font-medium">
          Submit (pending approval)
        </button>
        <input
          className="sm:col-span-2 lg:col-span-4 border rounded-lg px-3 py-2"
          placeholder="Note (optional)"
          value={depForm.note}
          onChange={(e) => setDepForm({ ...depForm, note: e.target.value })}
        />
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        <Tile label="Total deposited (approved)" value={fmt(totalDeposited)} />
        <Tile label="Your P/L share" value={fmt(profitLoss)} />
        <Tile label="Current balance" value={fmt(currentBalance)} highlight />
        <Tile label="Due / Advance" value={`Due: ${fmt(dueAdvance.due || 0)} · Adv: ${fmt(dueAdvance.advance || 0)}`} />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold mb-3">Recent deposits</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2">Month</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentDeposits?.length ? (
                recentDeposits.map((d) => (
                  <tr key={d._id} className="border-b border-slate-50">
                    <td className="py-2">{d.month}</td>
                    <td>{fmt(d.amount)}</td>
                    <td className="capitalize">{d.paymentMethod}</td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          d.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-slate-500">
                    No deposits yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, highlight }) {
  return (
    <div
      className={`rounded-xl border p-4 ${highlight ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white'}`}
    >
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="text-xl font-semibold text-slate-900 mt-1">{value}</div>
    </div>
  );
}

function fmt(n) {
  if (n == null || n === '') return '—';
  if (typeof n !== 'number') return n;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
