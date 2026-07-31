'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { Users, Shield, UserX, Archive, Loader2, UserPlus, Upload, Database, Activity, Clock } from 'lucide-react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const res = await fetchApi(`/dashboard/stats?range=${timeRange}`);
      if (res.success) {
        setStats(res.data);
      } else {
        setError(res.error?.message || 'Failed to load stats');
      }
      setLoading(false);
    }
    loadStats();
  }, [timeRange]);

  if (loading && !stats) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
        {error}
      </div>
    );
  }

  const statCards = user?.role === 'admin' 
    ? [
        { name: 'Total Customer Data', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-500' },
        { name: 'Staff Members', value: stats?.totalStaff || 0, icon: Shield, color: 'bg-indigo-500' },
        { name: 'Pending Deletions', value: stats?.pendingDeletions || 0, icon: UserX, color: 'bg-amber-500' },
        { name: 'Archived Customer Data', value: stats?.archivedUsers || 0, icon: Archive, color: 'bg-slate-500' },
      ]
    : [
        { name: 'Total Customer Data', value: stats?.totalUsers || 0, icon: Database, color: 'bg-blue-500' },
        { name: 'My Contacts', value: stats?.myTotalUsers || 0, icon: Users, color: 'bg-indigo-500' },
        { name: 'Added Today', value: stats?.myTodayUsers || 0, icon: UserPlus, color: 'bg-emerald-500' },
      ];

  // Format chart data for Recharts based on range
  const chartData = (stats?.chartData || []).map(item => {
    const isHourly = ['24h', '12h', '6h', '1h'].includes(timeRange);
    let dateStr = 'Unknown';
    if (item.date) {
      const parsedDate = new Date(item.date);
      dateStr = isHourly ? format(parsedDate, 'HH:mm') : format(parsedDate, 'MMM dd');
    }
    return {
      date: dateStr,
      count: item.count
    };
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">High-level metrics for RESOL CRM</p>
      </div>

      {/* Top Stat Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${user?.role === 'admin' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 transition-all hover:shadow-md">
            <div className="flex items-center">
              <div className={`inline-flex flex-shrink-0 items-center justify-center h-12 w-12 rounded-xl text-white ${stat.color} shadow-sm`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts & Sidebars Section (Admins Only) */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Activity Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full relative">
            
            {loading && stats && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            )}

            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-indigo-500 mr-2" />
                <h3 className="text-lg font-semibold text-slate-900">System Activity</h3>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1h">Last 1 Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="12h">Last 12 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>
            <div className="p-6 flex-1 min-h-[250px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    />
                    <Area type="linear" dataKey="count" name="System Events" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  No activity data available for this timeframe.
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6 flex flex-col h-full">

            {/* System Health Widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">System Health</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Database (MySQL)</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${stats?.systemHealth?.database === 'Connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {stats?.systemHealth?.database || 'Checking...'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Cache (Redis)</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${stats?.systemHealth?.redis === 'Connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {stats?.systemHealth?.redis || 'Checking...'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">API Connection</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${stats?.systemHealth?.api === 'Connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {stats?.systemHealth?.api || 'Checking...'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Quick Launch */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Quick Launch</h3>
              </div>
              <div className="p-4 grid grid-cols-1 gap-3">
                <Link href="/users" className="flex items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 group">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Manage Customer Data</h4>
                    <p className="text-xs text-slate-500">View and manage Customer Data</p>
                  </div>
                </Link>
                
                <Link href="/import" className="flex items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 group">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Bulk Import</h4>
                    <p className="text-xs text-slate-500">Upload Customer Data via Excel file</p>
                  </div>
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Full Width Recent Audit Logs (Admins Only) */}
      {user?.role === 'admin' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-slate-500 mr-2" />
              <h3 className="text-lg font-semibold text-slate-900">Recent Activity Feed</h3>
            </div>
          </div>
          <div className="p-0">
            {stats?.recentLogs && stats.recentLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                    <tr>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Entity</th>
                      <th className="px-6 py-4">Actor</th>
                      <th className="px-6 py-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {log.action.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4">
                          {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                        </td>
                        <td className="px-6 py-4">
                          {log.actor_role} (ID: {log.actor_id || 'System'})
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400 whitespace-nowrap">
                          {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                No recent activity logs found.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
