import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function Investments() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    account: 'bank',
  });
  const [retForm, setRetForm] = useState({});

  const load = async () => {
    const { data } = await api.get('/investments');
    setList(data.investments);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post('/investments', {
      ...form,
      amount: Number(form.amount),
    });
    setForm({
      title: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      description: '',
      account: 'bank',
    });
    await load();
  };

  const addReturn = async (invId) => {
    const r = retForm[invId] || { returnType: 'profit', amount: '', note: '' };
    await api.post(`/investments/${invId}/returns`, {
      returnType: r.returnType,
      amount: Number(r.amount),
      note: r.note,
    });
    setRetForm({ ...retForm, [invId]: { returnType: 'profit', amount: '', note: '' } });
    await load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete investment and related ledger rows?')) return;
    await api.delete(`/investments/${id}`);
    await load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Investments</h1>
      <form
        onSubmit={create}
        className="bg-white border border-slate-200 rounded-xl p-4 grid md:grid-cols-3 gap-3 text-sm"
      >
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          type="number"
          className="border rounded-lg px-3 py-2"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
        <input
          type="date"
          className="border rounded-lg px-3 py-2"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={form.account}
          onChange={(e) => setForm({ ...form, account: e.target.value })}
        >
          <option value="bank">Bank</option>
          <option value="cash">Cash</option>
        </select>
        <input
          className="border rounded-lg px-3 py-2 md:col-span-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button type="submit" className="py-2 rounded-lg bg-brand-600 text-white font-medium">
          Create
        </button>
      </form>

      <div className="space-y-4">
        {list.map((inv) => (
          <div key={inv._id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <div className="font-semibold text-lg">{inv.title}</div>
                <div className="text-sm text-slate-500">
                  {new Date(inv.date).toLocaleDateString()} · {inv.account} · Principal{' '}
                  {inv.amount?.toLocaleString()}
                </div>
                {inv.description && <p className="text-sm mt-2">{inv.description}</p>}
              </div>
              <button
                type="button"
                className="text-red-600 text-sm"
                onClick={() => remove(inv._id)}
              >
                Delete
              </button>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <div className="text-sm font-medium text-slate-700 mb-2">Returns</div>
              <ul className="text-sm space-y-1 mb-3">
                {(inv.returns || []).map((r) => (
                  <li key={r._id}>
                    <span className="capitalize">{r.returnType}</span> · {r.amount?.toLocaleString()}{' '}
                    · {new Date(r.date).toLocaleDateString()}
                  </li>
                ))}
                {!inv.returns?.length && <li className="text-slate-400">No returns yet</li>}
              </ul>
              <div className="flex flex-wrap gap-2 items-end">
                <select
                  className="border rounded-lg px-2 py-2 text-sm"
                  value={(retForm[inv._id] || {}).returnType || 'profit'}
                  onChange={(e) =>
                    setRetForm({
                      ...retForm,
                      [inv._id]: { ...(retForm[inv._id] || {}), returnType: e.target.value },
                    })
                  }
                >
                  <option value="profit">Profit</option>
                  <option value="loss">Loss</option>
                </select>
                <input
                  type="number"
                  className="border rounded-lg px-2 py-2 text-sm w-32"
                  placeholder="Amount"
                  value={(retForm[inv._id] || {}).amount || ''}
                  onChange={(e) =>
                    setRetForm({
                      ...retForm,
                      [inv._id]: { ...(retForm[inv._id] || {}), amount: e.target.value },
                    })
                  }
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm"
                  onClick={() => addReturn(inv._id)}
                >
                  Add return
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
