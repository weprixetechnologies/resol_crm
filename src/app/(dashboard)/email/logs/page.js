'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { 
  History, Search, Loader2, Send, ChevronLeft, ChevronRight, 
  CheckCircle2, AlertCircle, Eye, X, Clock, Check, RefreshCw, Cpu, Code
} from 'lucide-react';

export default function EmailLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Reconcile API Loading
  const [reconciling, setReconciling] = useState(false);

  // Selected Log & Journey Timeline State
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [journeyData, setJourneyData] = useState(null);
  const [journeyLoading, setJourneyLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page,
      limit: 20,
      search: search.trim(),
      status: statusFilter
    });

    const res = await fetchApi(`/email/logs?${query.toString()}`);
    setLoading(false);

    if (res.success) {
      const data = res.data || res;
      setLogs(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    }
  };

  const loadJourney = async (logId) => {
    setSelectedLogId(logId);
    setJourneyLoading(true);
    const res = await fetchApi(`/email/logs/${logId}`);
    setJourneyLoading(false);
    if (res.success) {
      setJourneyData(res);
    }
  };

  const handleReconcile = async () => {
    setReconciling(true);
    const today = new Date().toISOString().split('T')[0];
    const past3 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const res = await fetchApi('/email/reconcile-logs', {
      method: 'POST',
      body: JSON.stringify({ fromDate: past3, toDate: today })
    });
    setReconciling(false);
    if (res.success) {
      loadLogs();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadLogs();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  useEffect(() => {
    loadLogs();
  }, [page]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CRM Internal Email Logs & Journeys</h1>
          <p className="text-sm text-slate-500 mt-1">
            Independent per-recipient email dispatches, real-time lifecycle journeys, and correlation audit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReconcile}
            disabled={reconciling}
            className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
          >
            {reconciling ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Reconcile MSG91 3-Day Logs
          </button>

          <Link
            href="/email/compose"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" /> Compose Email
          </Link>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by recipient, name, subject, or CRQID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="QUEUED">QUEUED</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="OPENED">OPENED</option>
              <option value="CLICKED">CLICKED</option>
              <option value="FAILED">FAILED</option>
              <option value="UNSUBSCRIBED">UNSUBSCRIBED</option>
            </select>

            <span className="text-xs text-slate-500 font-bold">Total Logs: {total}</span>
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
              <p className="font-medium text-slate-600">No email logs found matching criteria.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-left border-collapse">
              <thead className="bg-slate-50">
                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Recipient</th>
                  <th className="px-5 py-3.5">Subject & Template</th>
                  <th className="px-5 py-3.5">CRQID / MSG ID</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5">Dispatched At</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.recipient_name || 'Recipient'}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{log.recipient_email}</div>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs truncate">
                      <div className="font-medium text-slate-900 truncate">{log.subject}</div>
                      <div className="text-[11px] text-slate-400">{log.template_name || `Template #${log.template_id || 'N/A'}`}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      <div>{log.crqid || '-'}</div>
                      <div className="text-[10px] text-slate-400">{log.msg_id || log.request_id || ''}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        log.status === 'DELIVERED' || log.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                        log.status === 'OPENED' || log.status === 'opened' ? 'bg-indigo-100 text-indigo-800' :
                        log.status === 'CLICKED' || log.status === 'clicked' ? 'bg-amber-100 text-amber-800' :
                        log.status === 'FAILED' || log.status === 'failed' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <button
                        onClick={() => loadJourney(log.id)}
                        className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-900 px-2.5 py-1 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Journey
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50 text-xs">
          <p className="text-slate-600">
            Showing page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages || 1}</span>
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Per-Email Lifecycle Journey Modal (PART 19) */}
      {selectedLogId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Email Lifecycle Journey & Audit</h3>
                <p className="text-xs text-slate-500 font-mono">Correlation ID (CRQID): {journeyData?.log?.crqid || 'N/A'}</p>
              </div>
              <button onClick={() => { setSelectedLogId(null); setJourneyData(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {journeyLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Recipient:</span>
                    <span className="font-bold text-slate-900">{journeyData?.log?.recipient_name || 'Recipient'}</span>
                    <span className="text-slate-500 block font-mono">{journeyData?.log?.recipient_email}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Subject:</span>
                    <span className="font-medium text-slate-900">{journeyData?.log?.subject}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-0.5">MSG91 Request ID:</span>
                    <span className="font-mono text-slate-800">{journeyData?.log?.request_id || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-0.5">MSG91 Message UUID:</span>
                    <span className="font-mono text-slate-800">{journeyData?.log?.msg_id || journeyData?.log?.msg91_uuid || '-'}</span>
                  </div>
                </div>

                {/* Event Journey Timeline */}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-1.5 text-indigo-600" /> Complete Event Timeline Journey
                  </h4>

                  <div className="border-l-2 border-indigo-200 ml-3 pl-4 space-y-4">
                    {journeyData?.timeline?.length === 0 ? (
                      <p className="text-slate-400 font-medium">No events logged for this email dispatch.</p>
                    ) : (
                      journeyData?.timeline?.map((evt, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[23px] top-1.5 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white shadow-xs"></div>
                          <div className="flex items-baseline justify-between">
                            <span className="font-bold text-slate-900 uppercase text-xs">{evt.event_name}</span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {new Date(evt.event_timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Status: <span className="font-semibold text-slate-700">{evt.event_status || evt.event_name}</span>
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Diagnostic errors if any */}
                {journeyData?.log?.failure_reason && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                    <span className="font-bold block mb-1">Diagnostic Failure Reason:</span>
                    <p className="font-mono text-[11px] break-all">{journeyData.log.failure_reason}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
