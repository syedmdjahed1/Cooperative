import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function Activity() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api
      .get('/activity')
      .then(({ data }) => setLogs(data.logs))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Activity log</h1>
      <div className="bg-white border rounded-xl overflow-x-auto text-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l._id} className="border-t border-slate-100">
                <td className="p-3 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="p-3">
                  {l.actorId?.email || l.actorId?.phone || '—'} ({l.actorId?.role})
                </td>
                <td className="p-3">{l.action}</td>
                <td className="p-3 font-mono text-xs">{l.entityId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
