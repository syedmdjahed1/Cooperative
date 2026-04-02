import { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dash, invReport] = await Promise.all([
          api.get('/reports/dashboard/admin'),
          api.get('/reports/investments'),
        ]);
        if (!cancelled) {
          setData({
            ...dash.data,
            invSummary: invReport.data.summary,
          });
        }
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.message || 'Failed to load');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) return <div className="text-red-600">{err}</div>;
  if (!data) return <div className="text-slate-500">Loading…</div>;

  const chartData = [
    { name: 'Cash', value: data.cash },
    { name: 'Bank', value: data.bank },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Admin dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Active members" value={data.totalMembers} />
        <Card title="Pending deposits" value={data.pendingDeposits} accent="amber" />
        <Card title="Total fund (cash+bank)" value={fmt(data.totalFund)} />
        <Card title="Total shares" value={data.totalShares} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-800 mb-4">Liquidity split</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
          <h2 className="font-semibold text-slate-800 mb-2">Investments & P/L</h2>
          <Row label="Principal deployed" value={fmt(data.totalInvestmentPrincipal)} />
          <Row label="Realized P/L (from returns)" value={fmt(data.realizedProfitLossFromInvestments)} />
          <Row label="Cumulative distributed to members" value={fmt(data.cumulativeDistributedPL)} />
          <Row label="Open investments" value={data.investmentCount} />
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, accent }) {
  const border = accent === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white';
  return (
    <div className={`rounded-xl border p-4 ${border}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function fmt(n) {
  if (typeof n !== 'number') return n;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
