'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Loader2, Database, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    const res = await fetchApi(`/dashboard/audit-logs?page=${page}&limit=15`);
    if (res.success) {
      setLogs(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mr-4">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">Complete history of system mutations and events.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Target</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Metadata</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 font-mono">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-slate-900">{log.actor_role}</span>
                      <span className="text-slate-500 ml-1">({log.actor_id || 'sys'})</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                    </td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]" title={JSON.stringify(log.meta)}>
                      {log.meta ? JSON.stringify(log.meta) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="text-sm text-slate-700">
            Total Logs: <span className="font-semibold">{total}</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-sm font-medium rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-sm font-medium rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
