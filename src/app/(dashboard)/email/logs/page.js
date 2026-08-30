'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { 
  History, Search, Loader2, Send, ChevronLeft, ChevronRight, 
  AlertTriangle, CheckCircle2, AlertCircle, Eye, X, Clock, RefreshCw, Code, Filter, Server, ShieldAlert, Check
} from 'lucide-react';

export default function EmailLogsPage() {
  const [activeTab, setActiveTab] = useState('internal'); // 'internal' | 'msg91_live'
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Date range for MSG91 Live Provider API (Default: last 3 days)
  const todayStr = new Date().toISOString().split('T')[0];
  const threeDaysAgoStr = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(threeDaysAgoStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Reconcile API Loading
  const [reconciling, setReconciling] = useState(false);

  // Selected Log & Journey Timeline State
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [journeyData, setJourneyData] = useState(null);
  const [journeyLoading, setJourneyLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    if (activeTab === 'internal') {
      const query = new URLSearchParams({
        page,
        limit: 20,
        search: search.trim(),
        status: statusFilter,
        startDate,
        endDate
      });

      const res = await fetchApi(`/email/logs?${query.toString()}`);
      setLoading(false);

      if (res.success) {
        const data = res.data || res;
        setLogs(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setLogs([]);
        setTotal(0);
        setTotalPages(1);
      }
    } else {
      // Fetch directly from MSG91 Live Logs API
      const query = new URLSearchParams({
        page,
        limit: 20,
        startDate,
        endDate,
        status: statusFilter !== 'all' ? statusFilter : ''
      });

      const res = await fetchApi(`/email/msg91-logs?${query.toString()}`);
      setLoading(false);

      if (res.success) {
        const data = res.data || {};
        let rawItems = data.items || data.logs || (Array.isArray(data) ? data : []);
        
        // Filter locally if search query is provided for MSG91 live mode
        if (search.trim()) {
          const s = search.trim().toLowerCase();
          rawItems = rawItems.filter(item => 
            (item.recipientEmail || item.recipient_email || '').toLowerCase().includes(s) ||
            (item.recipientName || item.recipient_name || '').toLowerCase().includes(s) ||
            (item.subject || '').toLowerCase().includes(s) ||
            (item.failureReason || item.description || '').toLowerCase().includes(s) ||
            (item.crqid || item.CRQID || '').toLowerCase().includes(s)
          );
        }

        setLogs(rawItems);
        setTotal(data.total || rawItems.length);
        setTotalPages(data.totalPages || Math.ceil((data.total || rawItems.length) / 20) || 1);
      } else {
        setLogs([]);
        setTotal(0);
        setTotalPages(1);
      }
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
    const res = await fetchApi('/email/reconcile-logs', {
      method: 'POST',
      body: JSON.stringify({ fromDate: startDate, toDate: endDate })
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
  }, [search, statusFilter, activeTab, startDate, endDate]);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const getStatusBadge = (status, failureReason) => {
    const st = String(status || '').toUpperCase();
    if (st === 'DELIVERED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Delivered
        </span>
      );
    }
    if (st === 'OPENED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800">
          <Eye className="w-3 h-3 mr-1" /> Opened
        </span>
      );
    }
    if (st === 'CLICKED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
          <Check className="w-3 h-3 mr-1" /> Clicked
        </span>
      );
    }
    if (st === 'FAILED' || st === 'HARD_BOUNCE' || st === 'SOFT_BOUNCE') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
          <AlertCircle className="w-3 h-3 mr-1" /> Failed
        </span>
      );
    }
    if (st === 'REJECTED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
          <ShieldAlert className="w-3 h-3 mr-1" /> Rejected
        </span>
      );
    }
    if (st === 'UNSUBSCRIBED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-800">
          Unsubscribed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
        <Clock className="w-3 h-3 mr-1" /> {st || 'QUEUED'}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CRM Email Audit & Delivery Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Independent per-recipient email dispatches, failure reasons, real-time lifecycle journeys, and MSG91 provider log audit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReconcile}
            disabled={reconciling}
            className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
          >
            {reconciling ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Sync MSG91 3-Day Logs
          </button>

          <Link
            href="/email/compose"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" /> Compose Email
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('internal'); setPage(1); }}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'internal'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" /> Internal CRM Email Logs
        </button>
        <button
          onClick={() => { setActiveTab('msg91_live'); setPage(1); }}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'msg91_live'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Server className="w-4 h-4" /> MSG91 Provider Direct Logs (3-Day)
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Search, Date Filter & Status Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by recipient email, name, subject, CRQID, or failure reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Pickers */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium bg-white text-slate-700"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium bg-white text-slate-700"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
              <option value="REJECTED">Rejected</option>
              <option value="BOUNCED">Bounced</option>
              <option value="OPENED">Opened</option>
              <option value="CLICKED">Clicked</option>
              <option value="UNSUBSCRIBED">Unsubscribed</option>
              <option value="QUEUED">Queued</option>
            </select>

            <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Total: {total}</span>
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
              <p className="text-xs text-slate-400 mt-1">Try adjusting the search query, date range, or status filter.</p>
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
                {logs.map((log, index) => {
                  const recipientEmail = log.recipient_email || log.recipientEmail || '';
                  const recipientName = log.recipient_name || log.recipientName || 'Recipient';
                  const subject = log.subject || '';
                  const templateName = log.template_name || log.templateName || (log.template_id ? `Template #${log.template_id}` : 'Direct');
                  const crqid = log.crqid || log.CRQID || '-';
                  const msgId = log.msg_id || log.requestId || log.msgId || log.uuid || '';
                  const status = log.status || 'QUEUED';
                  const failureReason = log.failure_reason || log.failureReason || log.error_message || log.description || null;
                  const createdAt = log.created_at || log.createdAt || log.statusUpdatedAt;

                  return (
                    <tr key={log.id || index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{recipientName}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{recipientEmail}</div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="font-medium text-slate-900 truncate" title={subject}>{subject}</div>
                        <div className="text-[11px] text-slate-400 truncate">{templateName}</div>

                        {/* FAILURE REASON CALLOUT BANNER */}
                        {failureReason && (
                          <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] leading-tight font-medium flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span className="break-all">{failureReason}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <div>{crqid}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={msgId}>{msgId}</div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        {getStatusBadge(status, failureReason)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {createdAt ? new Date(createdAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        {activeTab === 'internal' ? (
                          <button
                            onClick={() => loadJourney(log.id)}
                            className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-900 px-2.5 py-1 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View Journey
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedLogId(log.id || index);
                              setJourneyData({ log, timeline: log.timeline || [] });
                            }}
                            className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-900 px-2.5 py-1 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

      {/* Per-Email Lifecycle Journey / Details Modal */}
      {selectedLogId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {activeTab === 'internal' ? 'Email Lifecycle Journey & Audit' : 'MSG91 Provider Direct Record Details'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Correlation ID: {journeyData?.log?.crqid || journeyData?.log?.CRQID || 'N/A'}
                </p>
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
                    <span className="font-bold text-slate-900">{journeyData?.log?.recipient_name || journeyData?.log?.recipientName || 'Recipient'}</span>
                    <span className="text-slate-500 block font-mono">{journeyData?.log?.recipient_email || journeyData?.log?.recipientEmail}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Subject:</span>
                    <span className="font-medium text-slate-900">{journeyData?.log?.subject}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-0.5">MSG91 Request ID:</span>
                    <span className="font-mono text-slate-800">{journeyData?.log?.request_id || journeyData?.log?.requestId || '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-0.5">MSG91 Message ID:</span>
                    <span className="font-mono text-slate-800">{journeyData?.log?.msg_id || journeyData?.log?.uuid || journeyData?.log?.imri || '-'}</span>
                  </div>
                </div>

                {/* Failure diagnostic banner if any */}
                {(journeyData?.log?.failure_reason || journeyData?.log?.failureReason || journeyData?.log?.description) && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                    <span className="font-bold flex items-center text-xs">
                      <AlertCircle className="w-4 h-4 mr-1.5 text-rose-600" /> Diagnostic Failure / Rejection Reason:
                    </span>
                    <p className="font-medium text-xs break-all leading-relaxed">
                      {journeyData?.log?.failure_reason || journeyData?.log?.failureReason || journeyData?.log?.description}
                    </p>
                  </div>
                )}

                {/* Event Journey Timeline */}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-1.5 text-indigo-600" /> Event Journey Timeline
                  </h4>

                  <div className="border-l-2 border-indigo-200 ml-3 pl-4 space-y-4">
                    {!journeyData?.timeline || journeyData?.timeline?.length === 0 ? (
                      <p className="text-slate-400 font-medium">No timeline events recorded.</p>
                    ) : (
                      journeyData?.timeline?.map((evt, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[23px] top-1.5 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white shadow-xs"></div>
                          <div className="flex items-baseline justify-between">
                            <span className="font-bold text-slate-900 uppercase text-xs">{evt.event_name || evt.status || `Event ${evt.eventId || idx + 1}`}</span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {evt.event_timestamp || evt.timestamp ? new Date(evt.event_timestamp || evt.timestamp).toLocaleString() : ''}
                            </span>
                          </div>
                          {evt.description && (
                            <p className="text-slate-600 text-[11px] mt-0.5 font-medium">{evt.description}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
