'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { 
  History, Search, Loader2, Send, ChevronLeft, ChevronRight, 
  CheckCircle2, AlertCircle, Eye, X, Cpu, Clock, Check, AlertTriangle, RefreshCw
} from 'lucide-react';

export default function EmailLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // BullMQ Live Queue Status State
  const [queueStatus, setQueueStatus] = useState(null);

  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    const res = await fetchApi(`/mail/logs?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
    if (res.success) {
      setLogs(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    }
    setLoading(false);
  };

  const loadQueueStatus = async () => {
    const res = await fetchApi('/mail/queue-status');
    if (res.success) {
      setQueueStatus(res.data);
    }
  };

  useEffect(() => {
    loadQueueStatus();
    const interval = setInterval(loadQueueStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadLogs();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Delivery Logs</h1>
          <p className="text-sm text-slate-500 mt-1">Audit log and status of all outgoing emails sent via Nodemailer.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/email/compose"
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-xl hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <Send className="w-4 h-4 mr-2" /> Compose Email
          </Link>
        </div>
      </div>
      {/* BullMQ Background Worker Live Metrics Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-100">BullMQ Background Worker Status</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active Listening
            </span>
          </div>
          <button 
            onClick={() => { loadQueueStatus(); loadLogs(); }}
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <div className="text-xl font-extrabold text-amber-400">{queueStatus ? queueStatus.waiting : '-'}</div>
            <div className="text-[11px] font-medium text-slate-400 mt-0.5">Waiting Jobs</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <div className="text-xl font-extrabold text-indigo-400">{queueStatus ? queueStatus.active : '-'}</div>
            <div className="text-[11px] font-medium text-slate-400 mt-0.5">Active Dispatching</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <div className="text-xl font-extrabold text-emerald-400">{queueStatus ? queueStatus.completed : '-'}</div>
            <div className="text-[11px] font-medium text-slate-400 mt-0.5">Completed</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <div className="text-xl font-extrabold text-rose-400">{queueStatus ? queueStatus.failed : '-'}</div>
            <div className="text-[11px] font-medium text-slate-400 mt-0.5">Failed Retries</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <Search className="h-5 w-5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search logs by recipient, name, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Total Mails: {total}
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-medium text-slate-600">No email logs recorded yet.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Recipient</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject Line</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Sent By</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="relative px-6 py-3.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">{log.recipient_name || 'N/A'}</div>
                      <div className="text-xs text-slate-500 font-mono">{log.recipient_email}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-sm text-slate-800 font-medium">
                      {log.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                      {log.sent_by_name || 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center text-xs font-semibold p-1 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <p className="text-xs text-slate-600">
            Showing page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages || 1}</span>
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Email Delivery Log Details</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Status:</span>
                {selectedLog.status === 'sent' ? (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                    Successfully Delivered
                  </span>
                ) : (
                  <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block">
                    Delivery Failed
                  </span>
                )}
              </div>

              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Recipient:</span>
                <span className="text-slate-900 font-semibold">{selectedLog.recipient_name || 'N/A'}</span> ({selectedLog.recipient_email})
              </div>

              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Subject:</span>
                <span className="text-slate-900 font-medium">{selectedLog.subject}</span>
              </div>

              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Sent By Staff:</span>
                <span className="text-slate-900">{selectedLog.sent_by_name || 'System'}</span>
              </div>

              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Dispatched At:</span>
                <span className="text-slate-900">{new Date(selectedLog.created_at).toLocaleString()}</span>
              </div>

              {selectedLog.error_message && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <span className="font-bold block mb-1">Failure Diagnostic Error:</span>
                  <p className="font-mono text-[11px] break-all">{selectedLog.error_message}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
