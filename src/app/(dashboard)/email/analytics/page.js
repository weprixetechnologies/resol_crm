'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { 
  BarChart3, Send, Eye, MousePointer, ShieldAlert, 
  Loader2, CheckCircle2, XCircle, UserX, AlertTriangle, Calendar, RefreshCw, Zap,
  TrendingUp, Activity, Code, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';

export default function EmailAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Preset Date Ranges
  const [rangePreset, setRangePreset] = useState('30days'); // 'today' | 'yesterday' | '7days' | '30days' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Analytics Response & Tab State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activeTab, setActiveTab] = useState('provider'); // 'provider' | 'crm'
  const [showRawJson, setShowRawJson] = useState(false);

  // Sync Timestamp
  const [lastSyncedAt, setLastSyncedAt] = useState('');

  // Set default dates on mount
  useEffect(() => {
    const today = new Date();
    const past30 = new Date(today);
    past30.setDate(past30.getDate() - 30);

    const formatISO = (d) => d.toISOString().split('T')[0];
    setEndDate(formatISO(today));
    setStartDate(formatISO(past30));
  }, []);

  const handlePresetChange = (preset) => {
    setRangePreset(preset);
    const today = new Date();
    const formatISO = (d) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(formatISO(today));
      setEndDate(formatISO(today));
    } else if (preset === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      setStartDate(formatISO(yest));
      setEndDate(formatISO(yest));
    } else if (preset === '7days') {
      const past7 = new Date(today);
      past7.setDate(past7.getDate() - 7);
      setStartDate(formatISO(past7));
      setEndDate(formatISO(today));
    } else if (preset === '30days') {
      const past30 = new Date(today);
      past30.setDate(past30.getDate() - 30);
      setStartDate(formatISO(past30));
      setEndDate(formatISO(today));
    }
  };

  const loadAnalytics = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);

    const query = new URLSearchParams({ startDate, endDate });
    const res = await fetchApi(`/email/analytics?${query.toString()}`);
    setLoading(false);

    if (res.success || res.analytics) {
      setAnalyticsData(res);
      setLastSyncedAt(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      loadAnalytics();
    }
  }, [startDate, endDate]);

  // Aggregate daily records if array is returned
  const rawList = Array.isArray(analyticsData?.analytics) ? analyticsData.analytics : 
                  (Array.isArray(analyticsData?.data) ? analyticsData.data : []);

  // Compute aggregated sums across daily provider records
  const aggregatedTotals = rawList.reduce((acc, row) => {
    Object.keys(row).forEach(key => {
      if (typeof row[key] === 'number' && key !== 'avgDeliveryTime') {
        acc[key] = (acc[key] || 0) + row[key];
      }
    });
    return acc;
  }, {});

  // Weighted average for delivery time
  const totalCompleted = aggregatedTotals.completed || aggregatedTotals.total || 0;
  const avgDeliveryTimeSum = rawList.reduce((acc, row) => acc + ((row.avgDeliveryTime || 0) * (row.completed || row.total || 1)), 0);
  const weightedAvgDeliveryTime = totalCompleted > 0 ? (avgDeliveryTimeSum / totalCompleted).toFixed(3) : '0';

  const m = rawList.length > 0 ? aggregatedTotals : (analyticsData?.analytics || {});
  const internalMetrics = analyticsData?.internalAnalytics || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Analytics & Performance</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Provider-level email performance metrics directly powered by MSG91 APIs & internal audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/email/compose')}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-4 h-4 mr-2" /> Compose Email
          </button>
        </div>
      </div>

      {/* Date Range Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <Calendar className="w-4 h-4 text-slate-500 mr-1" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Time Window:</span>
          {['today', 'yesterday', '7days', '30days', 'custom'].map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetChange(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                rangePreset === preset
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset === 'today' && 'Today'}
              {preset === 'yesterday' && 'Yesterday'}
              {preset === '7days' && 'Last 7 Days'}
              {preset === '30days' && 'Last 30 Days'}
              {preset === 'custom' && 'Custom Range'}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setRangePreset('custom'); setStartDate(e.target.value); }}
            className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium bg-white"
          />
          <span className="text-slate-400 text-xs font-bold">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setRangePreset('custom'); setEndDate(e.target.value); }}
            className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium bg-white"
          />
          <button
            onClick={loadAnalytics}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Provider Sync Status Banner (PART 22) */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Zap className="w-5 h-5 text-emerald-400 flex-shrink-0 animate-pulse" />
          <div className="text-xs">
            <span className="font-bold text-slate-100">Provider: MSG91 Live Stream</span>
            <span className="text-slate-300 ml-2">
              (Query Window: {startDate} to {endDate})
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-400 font-mono">Last Synced: {lastSyncedAt || 'Just now'}</span>
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold font-mono">
            Connected
          </span>
        </div>
      </div>

      {/* Dual Tab Navigation (PART 20 & PART 27) */}
      <div className="border-b border-slate-200 flex space-x-6">
        <button
          onClick={() => setActiveTab('provider')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center ${
            activeTab === 'provider' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4 mr-2 text-indigo-600" />
          MSG91 Provider Analytics
        </button>

        <button
          onClick={() => setActiveTab('crm')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center ${
            activeTab === 'crm' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 mr-2 text-slate-600" />
          CRM Internal Analytics & Suppression
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : activeTab === 'provider' ? (
        <div className="space-y-6">
          {/* PART 2: SUMMARY CARDS */}
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Overall Provider Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {/* Total */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total</span>
                <div className="text-2xl font-extrabold text-slate-900">{(m.total || 0).toLocaleString()}</div>
                <p className="text-[10px] text-slate-400 mt-1">Provider total count</p>
              </div>

              {/* Accepted */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Accepted</span>
                <div className="text-2xl font-extrabold text-blue-700">{(m.accepted || 0).toLocaleString()}</div>
                <p className="text-[10px] text-slate-400 mt-1">Queued by MSG91</p>
              </div>

              {/* Completed */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Completed</span>
                <div className="text-2xl font-extrabold text-slate-800">{(m.completed || 0).toLocaleString()}</div>
                <p className="text-[10px] text-slate-400 mt-1">Processed</p>
              </div>

              {/* Delivered */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">Delivered</span>
                <div className="text-2xl font-extrabold text-emerald-900">{(m.delivered || 0).toLocaleString()}</div>
                <p className="text-[10px] text-emerald-600 mt-1">Successfully delivered</p>
              </div>

              {/* Failed */}
              <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-xs">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-1">Failed</span>
                <div className="text-2xl font-extrabold text-rose-900">{(m.failed || 0).toLocaleString()}</div>
                <p className="text-[10px] text-rose-600 mt-1">Provider failed count</p>
              </div>

              {/* Bounced */}
              <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-xs">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block mb-1">Bounced</span>
                <div className="text-2xl font-extrabold text-rose-950">{(m.bounced || 0).toLocaleString()}</div>
                <p className="text-[10px] text-rose-700 mt-1">Returned bounce</p>
              </div>

              {/* Rejected */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Rejected</span>
                <div className="text-2xl font-extrabold text-slate-900">{(m.rejected || 0).toLocaleString()}</div>
                <p className="text-[10px] text-slate-400 mt-1">Pre-flight rejected</p>
              </div>

              {/* Opened & Unique Opened */}
              <div className="bg-white p-4 rounded-2xl border border-indigo-100 bg-indigo-50/20 shadow-xs">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">Opened</span>
                <div className="text-2xl font-extrabold text-indigo-900">{(m.opened || 0).toLocaleString()}</div>
                <p className="text-[10px] text-indigo-600 mt-1">Unique: {(m.uniqueOpened || 0).toLocaleString()}</p>
              </div>

              {/* Clicked & Unique Clicked */}
              <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-xs">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">Clicked</span>
                <div className="text-2xl font-extrabold text-amber-900">{(m.clicked || 0).toLocaleString()}</div>
                <p className="text-[10px] text-amber-600 mt-1">Unique: {(m.uniqueClicked || 0).toLocaleString()}</p>
              </div>

              {/* Unsubscribed */}
              <div className="bg-white p-4 rounded-2xl border border-purple-100 bg-purple-50/20 shadow-xs">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block mb-1">Unsubscribed</span>
                <div className="text-2xl font-extrabold text-purple-900">{(m.unsubscribed || 0).toLocaleString()}</div>
                <p className="text-[10px] text-purple-600 mt-1">Opted out</p>
              </div>

              {/* Complaints & Unique Complaints */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Complaints</span>
                <div className="text-2xl font-extrabold text-slate-900">{(m.complaints || 0).toLocaleString()}</div>
                <p className="text-[10px] text-slate-400 mt-1">Unique: {(m.uniqueComplaints || 0).toLocaleString()}</p>
              </div>

              {/* Invalid */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Invalid</span>
                <div className="text-2xl font-extrabold text-slate-900">{(m.invalid || 0).toLocaleString()}</div>
                <p className="text-[10px] text-slate-400 mt-1">Invalid email format</p>
              </div>
            </div>
          </div>

          {/* PART 3: SECONDARY DELIVERY BREAKDOWN & PART 4: ENGAGEMENT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center border-b border-slate-100 pb-2">
                <Activity className="w-4 h-4 mr-2 text-indigo-600" /> Delivery Breakdown
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Accepted</span>
                  <span className="text-lg font-bold text-slate-900">{(m.accepted || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Completed</span>
                  <span className="text-lg font-bold text-slate-900">{(m.completed || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <span className="text-emerald-700 block text-[10px] font-bold uppercase">Delivered</span>
                  <span className="text-lg font-bold text-emerald-900">{(m.delivered || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl">
                  <span className="text-rose-700 block text-[10px] font-bold uppercase">Failed</span>
                  <span className="text-lg font-bold text-rose-900">{(m.failed || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="text-rose-800 block text-[10px] font-bold uppercase">Bounced</span>
                  <span className="text-lg font-bold text-rose-950">{(m.bounced || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Rejected</span>
                  <span className="text-lg font-bold text-slate-900">{(m.rejected || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">MSG91 Failure Classifications</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-bold">Invalid</span>
                    <span className="font-bold text-slate-800">{m.invalid || 0}</span>
                  </div>
                  <div className="p-2 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-bold">Technical</span>
                    <span className="font-bold text-slate-800">{m.technical || 0}</span>
                  </div>
                  <div className="p-2 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-bold">Content</span>
                    <span className="font-bold text-slate-800">{m.content || 0}</span>
                  </div>
                  <div className="p-2 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-bold">Reputation</span>
                    <span className="font-bold text-slate-800">{m.reputation || 0}</span>
                  </div>
                  <div className="p-2 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-bold">Volume</span>
                    <span className="font-bold text-slate-800">{m.volume || 0}</span>
                  </div>
                  <div className="p-2 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-bold">Mailbox Unavailable</span>
                    <span className="font-bold text-slate-800">{m.mailboxUnavailable || 0}</span>
                  </div>
                  <div className="p-2 border border-slate-200 rounded-lg col-span-2">
                    <span className="text-[10px] text-slate-400 block font-bold">Unclassified</span>
                    <span className="font-bold text-slate-800">{m.unclassified || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center border-b border-slate-100 pb-2">
                <TrendingUp className="w-4 h-4 mr-2 text-indigo-600" /> Engagement Performance
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100">
                  <span className="text-indigo-700 block text-[10px] font-bold uppercase">Total Opened</span>
                  <span className="text-lg font-bold text-indigo-900">{(m.opened || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200">
                  <span className="text-indigo-800 block text-[10px] font-bold uppercase">Unique Opened</span>
                  <span className="text-lg font-bold text-indigo-950">{(m.uniqueOpened || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100">
                  <span className="text-amber-700 block text-[10px] font-bold uppercase">Total Clicked</span>
                  <span className="text-lg font-bold text-amber-900">{(m.clicked || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200">
                  <span className="text-amber-800 block text-[10px] font-bold uppercase">Unique Clicked</span>
                  <span className="text-lg font-bold text-amber-950">{(m.uniqueClicked || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                  <span className="text-purple-700 block text-[10px] font-bold uppercase">Unsubscribed</span>
                  <span className="text-lg font-bold text-purple-900">{(m.unsubscribed || 0).toLocaleString()}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Complaints (Unique)</span>
                  <span className="text-lg font-bold text-slate-900">{(m.complaints || 0).toLocaleString()} ({(m.uniqueComplaints || 0).toLocaleString()})</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Processed From Accepted Stage:</span>
                  <span className="font-bold">{m.processedFromAcceptedStage || 0}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Avg Delivery Time:</span>
                  <span className="font-bold">{weightedAvgDeliveryTime}s</span>
                </div>
              </div>
            </div>
          </div>

          {/* PART 5: DAILY ANALYTICS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Daily Provider Data Breakdown</h3>
              <span className="text-xs text-slate-500 font-bold">Total Days: {rawList.length}</span>
            </div>

            <div className="overflow-x-auto min-h-[250px]">
              {rawList.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-medium">No daily breakdown data returned for selected date range.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 sticky left-0 bg-slate-50">Date</th>
                      <th className="px-3 py-3">Total</th>
                      <th className="px-3 py-3">Queued</th>
                      <th className="px-3 py-3">Accepted</th>
                      <th className="px-3 py-3">Completed</th>
                      <th className="px-3 py-3">Rejected</th>
                      <th className="px-3 py-3 text-emerald-700">Delivered</th>
                      <th className="px-3 py-3 text-rose-700">Failed</th>
                      <th className="px-3 py-3 text-rose-800">Bounced</th>
                      <th className="px-3 py-3 text-indigo-700">Opened</th>
                      <th className="px-3 py-3 text-indigo-900">Unique Open</th>
                      <th className="px-3 py-3 text-amber-700">Clicked</th>
                      <th className="px-3 py-3 text-amber-900">Unique Click</th>
                      <th className="px-3 py-3 text-purple-700">Unsub</th>
                      <th className="px-3 py-3">Complaints</th>
                      <th className="px-3 py-3">Invalid</th>
                      <th className="px-3 py-3">Tech</th>
                      <th className="px-3 py-3">Content</th>
                      <th className="px-3 py-3">Reputation</th>
                      <th className="px-3 py-3">Volume</th>
                      <th className="px-3 py-3">Mailbox Unavail</th>
                      <th className="px-3 py-3">Avg Time (s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-mono">
                    {rawList.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900 whitespace-nowrap sticky left-0 bg-white">{row.date}</td>
                        <td className="px-3 py-2.5 text-slate-800">{row.total || 0}</td>
                        <td className="px-3 py-2.5 text-slate-500">{row.queued || 0}</td>
                        <td className="px-3 py-2.5 text-blue-600 font-bold">{row.accepted || 0}</td>
                        <td className="px-3 py-2.5 text-slate-700">{row.completed || 0}</td>
                        <td className="px-3 py-2.5 text-slate-500">{row.rejected || 0}</td>
                        <td className="px-3 py-2.5 text-emerald-600 font-bold">{row.delivered || 0}</td>
                        <td className="px-3 py-2.5 text-rose-600 font-bold">{row.failed || 0}</td>
                        <td className="px-3 py-2.5 text-rose-700 font-bold">{row.bounced || 0}</td>
                        <td className="px-3 py-2.5 text-indigo-600 font-bold">{row.opened || 0}</td>
                        <td className="px-3 py-2.5 text-indigo-800">{row.uniqueOpened || 0}</td>
                        <td className="px-3 py-2.5 text-amber-600 font-bold">{row.clicked || 0}</td>
                        <td className="px-3 py-2.5 text-amber-800">{row.uniqueClicked || 0}</td>
                        <td className="px-3 py-2.5 text-purple-600">{row.unsubscribed || 0}</td>
                        <td className="px-3 py-2.5 text-slate-600">{row.complaints || 0}</td>
                        <td className="px-3 py-2.5 text-slate-500">{row.invalid || 0}</td>
                        <td className="px-3 py-2.5 text-slate-500">{row.technical || 0}</td>
                        <td className="px-3 py-2.5 text-slate-500">{row.content || 0}</td>
                        <td className="px-3 py-2.5 text-slate-500">{row.reputation || 0}</td>
                        <td className="px-3 py-2.5 text-slate-500">{row.volume || 0}</td>
                        <td className="px-3 py-2.5 text-slate-500">{row.mailboxUnavailable || 0}</td>
                        <td className="px-3 py-2.5 text-slate-700">{row.avgDeliveryTime || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* PART 21: PROVIDER RAW DATA COLLAPSIBLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-bold text-slate-700"
            >
              <span className="flex items-center">
                <Code className="w-4 h-4 mr-2 text-indigo-600" /> View Raw Provider Response
              </span>
              {showRawJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showRawJson && (
              <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(analyticsData?.analytics || {}, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TAB 2: CRM INTERNAL ANALYTICS */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">CRM Internal Metrics & Audit Log Aggregations</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Derived directly from internal CRM `email_logs`, `email_events`, and `email_bounces` tables.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-medium">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1">Total Internal Dispatches</span>
              <span className="text-2xl font-extrabold text-slate-900">{(internalMetrics.sent || 0).toLocaleString()}</span>
            </div>
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 block mb-1">Delivered Dispatches</span>
              <span className="text-2xl font-extrabold text-emerald-900">{(internalMetrics.delivered || 0).toLocaleString()}</span>
            </div>
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <span className="text-indigo-700 block mb-1">Verified Unique Opens</span>
              <span className="text-2xl font-extrabold text-indigo-900">{(internalMetrics.opened || 0).toLocaleString()}</span>
            </div>
            <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100">
              <span className="text-rose-700 block mb-1">Suppressed Bounced Email Count</span>
              <span className="text-2xl font-extrabold text-rose-900">{(internalMetrics.bounces || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
