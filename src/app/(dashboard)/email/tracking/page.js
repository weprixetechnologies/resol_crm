'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { 
  Zap, Send, Eye, MousePointer, MessageSquare, 
  Loader2, UserCheck, Flame, MessageCircle, MailX, UserX, Filter
} from 'lucide-react';

export default function EmailTrackingDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data states
  const [summary, setSummary] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'events'
  const [eventSearch, setEventSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');

  // MSG91 Analytics State
  const [msg91Analytics, setMsg91Analytics] = useState(null);
  const [msg91Loading, setMsg91Loading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [sumRes, campRes] = await Promise.all([
      fetchApi('/campaigns/tracking/summary'),
      fetchApi('/campaigns?limit=50')
    ]);

    if (sumRes.success) setSummary(sumRes.data);
    if (campRes.success) setCampaigns(campRes.data.items || []);

    setLoading(false);
  };

  const loadMsg91Analytics = async () => {
    setMsg91Loading(true);
    const res = await fetchApi('/mail/msg91-analytics');
    setMsg91Loading(false);
    if (res.success) {
      setMsg91Analytics(res.data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const kpis = summary?.kpis || {
    totalCampaigns: 0,
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalReplied: 0,
    totalBounced: 0,
    totalUnsubscribed: 0,
    openRate: 0,
    clickRate: 0,
    replyRate: 0
  };

  const recentEvents = summary?.recentEvents || [];
  const leadConversions = summary?.leadConversions || [];

  const filteredEvents = recentEvents.filter(ev => {
    const term = eventSearch.toLowerCase();
    const matchesSearch = !term || (
      (ev.recipient_email && ev.recipient_email.toLowerCase().includes(term)) ||
      (ev.contact_name && ev.contact_name.toLowerCase().includes(term)) ||
      (ev.campaign_name && ev.campaign_name.toLowerCase().includes(term))
    );
    const matchesType = eventTypeFilter === 'all' || ev.event_type?.toLowerCase() === eventTypeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Tracking & Analytics</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Real-time email engagement metrics, delivery statuses, and campaign analytics.</p>
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

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sent */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Emails Dispatched</span>
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{kpis.totalSent.toLocaleString()}</span>
            <span className="text-xs font-medium text-slate-500">{kpis.totalCampaigns} Campaign(s)</span>
          </div>
        </div>

        {/* Open Rate */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Open Rate</span>
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{kpis.openRate}%</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {kpis.totalOpened} Opened
            </span>
          </div>
        </div>

        {/* Click Rate */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Click Rate</span>
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <MousePointer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{kpis.clickRate}%</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {kpis.totalClicked} Clicked
            </span>
          </div>
        </div>

        {/* Reply Rate */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reply Rate</span>
            <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{kpis.replyRate}%</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {kpis.totalReplied} Replied
            </span>
          </div>
        </div>
      </div>

      {/* Lead Conversion Summary */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
          <UserCheck className="w-4 h-4 mr-2 text-indigo-600" />
          CRM Lead Status Conversions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800">
              <Eye className="w-3.5 h-3.5" /> <span>Engaged</span>
            </div>
            <div className="text-lg font-bold text-emerald-900 mt-1">
              {leadConversions.find(c => c.lead_status === 'Engaged')?.count || 0}
            </div>
            <p className="text-[10px] text-emerald-700">Opened Email</p>
          </div>

          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-800">
              <Flame className="w-3.5 h-3.5 text-amber-600" /> <span>Hot Lead</span>
            </div>
            <div className="text-lg font-bold text-amber-900 mt-1">
              {leadConversions.find(c => c.lead_status === 'Hot Lead')?.count || 0}
            </div>
            <p className="text-[10px] text-amber-700">Clicked Link</p>
          </div>

          <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-purple-800">
              <MessageCircle className="w-3.5 h-3.5 text-purple-600" /> <span>Conversation</span>
            </div>
            <div className="text-lg font-bold text-purple-900 mt-1">
              {leadConversions.find(c => c.lead_status === 'Conversation Started')?.count || 0}
            </div>
            <p className="text-[10px] text-purple-700">Replied to Campaign</p>
          </div>

          <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-800">
              <MailX className="w-3.5 h-3.5 text-rose-600" /> <span>Invalid Email</span>
            </div>
            <div className="text-lg font-bold text-rose-900 mt-1">
              {leadConversions.find(c => c.lead_status === 'Invalid Email')?.count || 0}
            </div>
            <p className="text-[10px] text-rose-700">Bounced</p>
          </div>

          <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <UserX className="w-3.5 h-3.5 text-slate-500" /> <span>Opted Out</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {leadConversions.find(c => c.lead_status === 'Opted Out')?.count || 0}
            </div>
            <p className="text-[10px] text-slate-500">Unsubscribed</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex space-x-6">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'campaigns' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Campaign Tracking Table ({campaigns.length})
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'campaigns' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Campaign Tracking Table ({campaigns.length})
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'events' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Live Event Feed ({recentEvents.length})
        </button>

        <button
          onClick={() => { setActiveTab('msg91'); loadMsg91Analytics(); }}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center ${
            activeTab === 'msg91' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          ⚡ MSG91 Live Analytics API
        </button>
      </div>

      {/* Tab 3: MSG91 Live Analytics API Panel */}
      {activeTab === 'msg91' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl shadow-md">
            <div>
              <h3 className="font-bold text-base">MSG91 Live Email Analytics</h3>
              <p className="text-xs text-slate-300">Live delivery metrics directly from MSG91 Cloud Infrastructure</p>
            </div>
            <button
              onClick={loadMsg91Analytics}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center"
            >
              <Zap className="w-3.5 h-3.5 mr-1" /> Refresh Analytics
            </button>
          </div>

          {msg91Loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">MSG91 Total Sent</span>
                <span className="text-3xl font-extrabold text-slate-900">
                  {msg91Analytics?.total_sent || msg91Analytics?.sent || msg91Analytics?.total || kpis.totalSent || 0}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Dispatched via MSG91 API</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">MSG91 Delivered</span>
                <span className="text-3xl font-extrabold text-emerald-800">
                  {msg91Analytics?.delivered || msg91Analytics?.total_delivered || 0}
                </span>
                <p className="text-[11px] text-emerald-600 mt-1">Successfully delivered</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-xs bg-indigo-50/20">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block mb-1">MSG91 Opened</span>
                <span className="text-3xl font-extrabold text-indigo-800">
                  {msg91Analytics?.opened || msg91Analytics?.total_opened || 0}
                </span>
                <p className="text-[11px] text-indigo-600 mt-1">Verified opens</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 block mb-1">MSG91 Bounced / Failed</span>
                <span className="text-3xl font-extrabold text-rose-800">
                  {msg91Analytics?.failed || msg91Analytics?.bounced || msg91Analytics?.total_failed || 0}
                </span>
                <p className="text-[11px] text-rose-600 mt-1">Hard & Soft Bounces</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Campaigns Performance Table */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Campaign Name & Subject</th>
                  <th className="py-3.5 px-4">Campaign ID</th>
                  <th className="py-3.5 px-4 text-center">Recipients</th>
                  <th className="py-3.5 px-4 text-center">Opens</th>
                  <th className="py-3.5 px-4 text-center">Clicks</th>
                  <th className="py-3.5 px-4 text-center">Replies</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No campaigns found. Compose an email campaign to track stats.
                    </td>
                  </tr>
                ) : (
                  campaigns.map(camp => (
                    <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{camp.name}</div>
                        <div className="text-slate-500 font-mono text-[11px] truncate max-w-xs">{camp.subject}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-indigo-600">
                        #{camp.id}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                        {camp.recipient_count || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                          {camp.stats?.opened || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold">
                          {camp.stats?.clicked || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold">
                          {camp.stats?.replied || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          camp.status === 'sent' ? 'bg-emerald-100 text-emerald-800' :
                          camp.status === 'sending' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {camp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Live Event Feed */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search email, contact name, campaign..."
                value={eventSearch}
                onChange={e => setEventSearch(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={eventTypeFilter}
                onChange={e => setEventTypeFilter(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium bg-white text-slate-700"
              >
                <option value="all">All Event Types</option>
                <option value="send">Send</option>
                <option value="open">Open</option>
                <option value="click">Click</option>
                <option value="reply">Reply</option>
                <option value="bounce">Bounce</option>
                <option value="unsubscribe">Unsubscribe</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">CRM Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No delivery/tracking events recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map(ev => (
                    <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(ev.event_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          ev.event_type === 'Open' ? 'bg-emerald-100 text-emerald-800' :
                          ev.event_type === 'Click' ? 'bg-amber-100 text-amber-800' :
                          ev.event_type === 'Reply' ? 'bg-purple-100 text-purple-800' :
                          ev.event_type === 'Send' ? 'bg-blue-100 text-blue-800' :
                          ev.event_type === 'Bounce' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {ev.event_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{ev.contact_name || 'Recipient'}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{ev.recipient_email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {ev.campaign_name || `Campaign #${ev.campaign_id || 'N/A'}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500 uppercase">
                        {ev.event_source}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700">
                          {ev.lead_status || 'Updated'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
