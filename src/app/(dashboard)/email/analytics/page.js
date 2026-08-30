'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { 
  BarChart3, Send, Eye, MousePointer, ShieldAlert, 
  Loader2, CheckCircle2, XCircle, UserX, AlertTriangle, Calendar, RefreshCw, Zap
} from 'lucide-react';

export default function EmailAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Preset Date Ranges
  const [rangePreset, setRangePreset] = useState('30days'); // 'today' | 'yesterday' | '7days' | '30days' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Analytics Response State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activeTab, setActiveTab] = useState('provider'); // 'provider' | 'crm'

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

    if (res.success) {
      setAnalyticsData(res);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      loadAnalytics();
    }
  }, [startDate, endDate]);

  const metrics = analyticsData?.analytics || {};
  const internalMetrics = analyticsData?.internalAnalytics || {};

  const totalSent = metrics.sent || metrics.total_sent || metrics.dispatched || internalMetrics.sent || 0;
  const delivered = metrics.delivered || metrics.total_delivered || internalMetrics.delivered || 0;
  const opened = metrics.opened || metrics.total_opened || internalMetrics.opened || 0;
  const clicked = metrics.clicked || metrics.total_clicked || internalMetrics.clicked || 0;
  const failed = metrics.failed || metrics.total_failed || metrics.bounced || internalMetrics.failed || 0;
  const unsubscribed = metrics.unsubscribed || metrics.total_unsubscribed || internalMetrics.unsubscribed || 0;
  const complaints = metrics.complaints || metrics.total_complaints || internalMetrics.complaints || 0;

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
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm transition-colors"
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

      {/* MSG91 31-Day Policy Info Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Zap className="w-5 h-5 text-emerald-400 flex-shrink-0 animate-pulse" />
          <div className="text-xs">
            <span className="font-bold text-slate-100">MSG91 Provider Source of Truth:</span>
            <span className="text-slate-300 ml-1">
              MSG91's live API supports a maximum query range of 31 days ({startDate} to {endDate}).
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold">
          Verified Provider Stream
        </span>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Top-Level KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Total Sent */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Sent</span>
                <Send className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{totalSent.toLocaleString()}</div>
              <p className="text-[10px] text-slate-400 mt-1">Dispatched</p>
            </div>

            {/* Delivered */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs bg-emerald-50/10">
              <div className="flex items-center justify-between text-emerald-700 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Delivered</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-900">{delivered.toLocaleString()}</div>
              <p className="text-[10px] text-emerald-600 mt-1">Successfully delivered</p>
            </div>

            {/* Failed */}
            <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs bg-rose-50/10">
              <div className="flex items-center justify-between text-rose-700 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Failed</span>
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="text-2xl font-extrabold text-rose-900">{failed.toLocaleString()}</div>
              <p className="text-[10px] text-rose-600 mt-1">Hard & soft bounces</p>
            </div>

            {/* Opened */}
            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs bg-indigo-50/10">
              <div className="flex items-center justify-between text-indigo-700 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Opened</span>
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-indigo-900">{opened.toLocaleString()}</div>
              <p className="text-[10px] text-indigo-600 mt-1">Verified opens</p>
            </div>

            {/* Clicked */}
            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs bg-amber-50/10">
              <div className="flex items-center justify-between text-amber-700 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Clicked</span>
                <MousePointer className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-amber-900">{clicked.toLocaleString()}</div>
              <p className="text-[10px] text-amber-600 mt-1">URL clicks</p>
            </div>

            {/* Unsubscribed */}
            <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs bg-purple-50/10">
              <div className="flex items-center justify-between text-purple-700 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Unsubscribed</span>
                <UserX className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="text-2xl font-extrabold text-purple-900">{unsubscribed.toLocaleString()}</div>
              <p className="text-[10px] text-purple-600 mt-1">Opted out</p>
            </div>

            {/* Complaints */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Complaints</span>
                <AlertTriangle className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{complaints.toLocaleString()}</div>
              <p className="text-[10px] text-slate-400 mt-1">Spam reports</p>
            </div>
          </div>

          {/* Navigation Tabs */}
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
              CRM Internal Audit & Journey Metrics
            </button>
          </div>

          {/* Tab 1: MSG91 Provider Raw Metrics */}
          {activeTab === 'provider' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">MSG91 Provider Analytics Stream</h3>
                <span className="text-xs text-slate-500 font-mono">Provider: MSG91</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
                <pre className="text-xs font-mono text-slate-800 break-all whitespace-pre-wrap">
                  {JSON.stringify(analyticsData?.analytics || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 2: CRM Internal Audit Metrics */}
          {activeTab === 'crm' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-base">CRM Internal Audit Log Aggregations</h3>
              <p className="text-xs text-slate-500">
                Calculated directly from our internal email logs table for historical audit completeness.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">Total Internal Logged Sends</span>
                  <span className="text-xl font-bold text-slate-900">{internalMetrics.sent}</span>
                </div>
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-emerald-700 block mb-1">Delivered Dispatches</span>
                  <span className="text-xl font-bold text-emerald-900">{internalMetrics.delivered}</span>
                </div>
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <span className="text-indigo-700 block mb-1">Verified Unique Opens</span>
                  <span className="text-xl font-bold text-indigo-900">{internalMetrics.opened}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
