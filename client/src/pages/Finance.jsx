import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function Finance() {
  const [data, setData] = useState(null);
  const [expense, setExpense] = useState({ account: 'cash', amount: '', description: '' });
  const [withdraw, setWithdraw] = useState({ account: 'cash', amount: '', description: '' });
  const [xfer, setXfer] = useState({ from: 'cash', to: 'bank', amount: '' });

  const load = async () => {
    const { data: d } = await api.get('/reports/cash-bank');
    setData(d);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const postExpense = async (e) => {
    e.preventDefault();
    await api.post('/transactions/expense', {
      account: expense.account,
      amount: Number(expense.amount),
      description: expense.description,
    });
    setExpense({ account: 'cash', amount: '', description: '' });
    await load();
  };

  const postWithdraw = async (e) => {
    e.preventDefault();
    await api.post('/transactions/withdrawal', {
      account: withdraw.account,
      amount: Number(withdraw.amount),
      description: withdraw.description,
    });
    setWithdraw({ account: 'cash', amount: '', description: '' });
    await load();
  };

  const postXfer = async (e) => {
    e.preventDefault();
    await api.post('/transactions/transfer', {
      from: xfer.from,
      to: xfer.to,
      amount: Number(xfer.amount),
    });
    setXfer({ from: 'cash', to: 'bank', amount: '' });
    await load();
  };

  if (!data) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cash & bank</h1>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs text-slate-500 uppercase">Cash</div>
          <div className="text-2xl font-semibold">{data.balances.cash.toLocaleString()}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs text-slate-500 uppercase">Bank</div>
          <div className="text-2xl font-semibold">{data.balances.bank.toLocaleString()}</div>
        </div>
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
          <div className="text-xs text-brand-800 uppercase">Total liquid</div>
          <div className="text-2xl font-semibold text-brand-900">
            {data.balances.total.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <form onSubmit={postExpense} className="bg-white border rounded-xl p-4 space-y-2 text-sm">
          <h2 className="font-semibold">Expense</h2>
          <select
            className="w-full border rounded-lg px-2 py-2"
            value={expense.account}
            onChange={(e) => setExpense({ ...expense, account: e.target.value })}
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </select>
          <input
            type="number"
            className="w-full border rounded-lg px-2 py-2"
            placeholder="Amount"
            value={expense.amount}
            onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
            required
          />
          <input
            className="w-full border rounded-lg px-2 py-2"
            placeholder="Description"
            value={expense.description}
            onChange={(e) => setExpense({ ...expense, description: e.target.value })}
          />
          <button type="submit" className="w-full py-2 rounded-lg bg-slate-800 text-white">
            Record expense
          </button>
        </form>
        <form onSubmit={postWithdraw} className="bg-white border rounded-xl p-4 space-y-2 text-sm">
          <h2 className="font-semibold">Withdrawal</h2>
          <select
            className="w-full border rounded-lg px-2 py-2"
            value={withdraw.account}
            onChange={(e) => setWithdraw({ ...withdraw, account: e.target.value })}
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </select>
          <input
            type="number"
            className="w-full border rounded-lg px-2 py-2"
            placeholder="Amount"
            value={withdraw.amount}
            onChange={(e) => setWithdraw({ ...withdraw, amount: e.target.value })}
            required
          />
          <input
            className="w-full border rounded-lg px-2 py-2"
            placeholder="Description"
            value={withdraw.description}
            onChange={(e) => setWithdraw({ ...withdraw, description: e.target.value })}
          />
          <button type="submit" className="w-full py-2 rounded-lg bg-slate-800 text-white">
            Record withdrawal
          </button>
        </form>
        <form onSubmit={postXfer} className="bg-white border rounded-xl p-4 space-y-2 text-sm">
          <h2 className="font-semibold">Transfer</h2>
          <div className="flex gap-2">
            <select
              className="flex-1 border rounded-lg px-2 py-2"
              value={xfer.from}
              onChange={(e) => setXfer({ ...xfer, from: e.target.value })}
            >
              <option value="cash">From cash</option>
              <option value="bank">From bank</option>
            </select>
            <select
              className="flex-1 border rounded-lg px-2 py-2"
              value={xfer.to}
              onChange={(e) => setXfer({ ...xfer, to: e.target.value })}
            >
              <option value="bank">To bank</option>
              <option value="cash">To cash</option>
            </select>
          </div>
          <input
            type="number"
            className="w-full border rounded-lg px-2 py-2"
            placeholder="Amount"
            value={xfer.amount}
            onChange={(e) => setXfer({ ...xfer, amount: e.target.value })}
            required
          />
          <button type="submit" className="w-full py-2 rounded-lg bg-brand-600 text-white">
            Transfer
          </button>
        </form>
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto">
        <h2 className="font-semibold p-4 border-b">Recent ledger</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Account</th>
              <th className="p-3">Type</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {data.transactions.map((t) => (
              <tr key={t._id} className="border-t border-slate-100">
                <td className="p-3 whitespace-nowrap">{new Date(t.occurredAt).toLocaleString()}</td>
                <td className="p-3 capitalize">{t.account}</td>
                <td className="p-3">{t.type}</td>
                <td className="p-3">{t.amount?.toLocaleString()}</td>
                <td className="p-3 text-slate-600">{t.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
