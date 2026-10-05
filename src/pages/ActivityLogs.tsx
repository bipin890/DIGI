import React, { useState, useEffect } from 'react';
import { History, Search, ShieldCheck } from 'lucide-react';
import { ActivityLog } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const ActivityLogs: React.FC = () => {
  const { fetchApi, isAdmin } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi('/api/activity-logs');
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
  }, [isAdmin]);

  const filtered = logs.filter((l) =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.userName.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase()) ||
    l.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Security & Audit Activity Logs</span>
          </h2>
          <p className="text-xs text-slate-500">
            Immutable tracking of invoices created, prices modified, payments recorded, and settings updated
          </p>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by operator name, action, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">No activity logs recorded.</td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{l.userName}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({l.role})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {l.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{l.action}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{l.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
