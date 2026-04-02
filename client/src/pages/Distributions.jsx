import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function Distributions() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ label: '', totalProfitOrLoss: '' });

  const load = async () => {
    const { data } = await api.get('/distributions');
    setList(data.distributions);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/distributions', {
      label: form.label,
      totalProfitOrLoss: Number(form.totalProfitOrLoss),
    });
    setForm({ label: '', totalProfitOrLoss: '' });
    await load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Profit / loss distribution</h1>
      <p className="text-sm text-slate-600 max-w-2xl">
        Allocations use active members only: member share = (member shares / total shares) × total
        profit or loss. Amounts are stored per member for history.
      </p>
      <form
        onSubmit={submit}
        className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-end"
      >
        <div>
          <label className="text-xs text-slate-500">Label</label>
          <input
            className="border rounded-lg px-3 py-2 block mt-1"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Total profit (+) or loss (-)</label>
          <input
            type="number"
            step="any"
            className="border rounded-lg px-3 py-2 block mt-1"
            value={form.totalProfitOrLoss}
            onChange={(e) => setForm({ ...form, totalProfitOrLoss: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg bg-brand-600 text-white">
          Run distribution
        </button>
      </form>

      <div className="space-y-4">
        {list.map((d) => (
          <div key={d._id} className="bg-white border border-slate-200 rounded-xl p-4 text-sm">
            <div className="flex justify-between flex-wrap gap-2">
              <div>
                <div className="font-semibold">{d.label || 'Distribution'}</div>
                <div className="text-slate-500">{new Date(d.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div>Total P/L: {d.totalProfitOrLoss?.toLocaleString()}</div>
                <div className="text-slate-500">Pool shares: {d.totalShares}</div>
              </div>
            </div>
            <table className="w-full mt-3">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2">Member</th>
                  <th>Shares</th>
                  <th>Ratio</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {d.allocations?.slice(0, 8).map((a) => (
                  <tr key={a.memberId} className="border-b border-slate-50">
                    <td className="py-1 font-mono text-xs">{a.memberId}</td>
                    <td>{a.shares}</td>
                    <td>{(a.shareRatio * 100).toFixed(2)}%</td>
                    <td>{a.amount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {d.allocations?.length > 8 && (
              <p className="text-xs text-slate-400 mt-2">Showing first 8 rows…</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
