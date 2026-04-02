import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function Reports() {
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [statement, setStatement] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthly, setMonthly] = useState(null);
  const [inv, setInv] = useState(null);

  useEffect(() => {
    api.get('/members').then(({ data }) => setMembers(data.members)).catch(console.error);
  }, []);

  useEffect(() => {
    api
      .get('/reports/investments')
      .then(({ data }) => setInv(data))
      .catch(console.error);
  }, []);

  const loadStatement = async () => {
    if (!memberId) return;
    const { data } = await api.get(`/reports/member/${memberId}/statement`);
    setStatement(data);
  };

  const loadMonthly = async () => {
    const { data } = await api.get('/reports/monthly', { params: { month } });
    setMonthly(data);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Reports</h1>

      <section className="bg-white border rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Member statement</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <select
            className="border rounded-lg px-3 py-2 text-sm min-w-[200px]"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
          >
            <option value="">Select member</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.memberNumber} — {m.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm"
            onClick={loadStatement}
          >
            Load
          </button>
        </div>
        {statement && (
          <div className="text-sm border-t border-slate-100 pt-3 space-y-2">
            <div className="grid sm:grid-cols-3 gap-2">
              <Stat label="Total deposited" value={statement.totalDeposited} />
              <Stat label="P/L share" value={statement.profitLoss} />
              <Stat label="Balance" value={statement.currentBalance} />
            </div>
            <p className="text-slate-600">
              Due: {statement.dueAdvance?.due?.toLocaleString?.() ?? 0} · Advance:{' '}
              {statement.dueAdvance?.advance?.toLocaleString?.() ?? 0}
            </p>
          </div>
        )}
      </section>

      <section className="bg-white border rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Monthly installments</h2>
        <div className="flex gap-2 items-end">
          <input
            type="month"
            className="border rounded-lg px-3 py-2"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm"
            onClick={loadMonthly}
          >
            Load month
          </button>
        </div>
        {monthly && (
          <div className="text-sm">
            <p>
              Approved: {monthly.summary.countApproved} ·{' '}
              {monthly.summary.totalApproved?.toLocaleString()} · Pending:{' '}
              {monthly.summary.countPending}
            </p>
            <div className="overflow-x-auto mt-2 max-h-64 overflow-y-auto border rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="p-2">Status</th>
                    <th className="p-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.deposits.map((d) => (
                    <tr key={d._id} className="border-t border-slate-100">
                      <td className="p-2">{d.status}</td>
                      <td className="p-2">{d.amount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {inv && (
        <section className="bg-white border rounded-xl p-4 space-y-2 text-sm">
          <h2 className="font-semibold">Investment summary</h2>
          <div className="grid sm:grid-cols-3 gap-2">
            <Stat label="Principal" value={inv.summary.principal} />
            <Stat label="Profit returns" value={inv.summary.profit} />
            <Stat label="Loss returns" value={inv.summary.loss} />
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-slate-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
}
