'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { Users, Shield, UserX, Archive, Loader2, UserPlus, Upload, Database, Activity, Clock, Filter, BarChart2, ChevronDown, Check, Search, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { AreaChart, Area, BarChart, Bar, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

const STAFF_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#84cc16'  // Lime
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [contactValue, setContactValue] = useState(24);
  const [contactUnit, setContactUnit] = useState('hours');
  const [selectedStaffCodes, setSelectedStaffCodes] = useState([]);
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [contactChartType, setContactChartType] = useState('histogram'); // 'histogram' or 'area'

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const staffParam = selectedStaffCodes.join(',');
      const res = await fetchApi(
        `/dashboard/stats?range=${timeRange}&contactValue=${contactValue}&contactUnit=${contactUnit}&staffCodes=${encodeURIComponent(staffParam)}`
      );
      if (res.success) {
        setStats(res.data);
      } else {
        setError(res.error?.message || 'Failed to load stats');
      }
      setLoading(false);
    }
    const timer = setTimeout(loadStats, 300);
    return () => clearTimeout(timer);
  }, [timeRange, contactValue, contactUnit, selectedStaffCodes]);

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

  // Format chart data for Recharts based on range (Audit Logs)
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

  // Format contacts created chart data based on contactValue & contactUnit
  const contactChartData = (stats?.contactsCreatedStats?.chartData || []).map(item => {
    let dateStr = 'Unknown';
    if (item.date) {
      const parsedDate = new Date(item.date);
      dateStr = contactUnit === 'hours' && contactValue <= 48 
        ? format(parsedDate, 'HH:mm') 
        : format(parsedDate, 'MMM dd');
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

      {/* Contacts Created Analytics Section (Histogram & Multi-Staff Comparison) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">
        {loading && stats && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        )}

        <div className="px-6 py-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Contacts Created Stats</h3>
              <p className="text-xs text-slate-500">Compare contact creation across staff members in real-time</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chart Type Toggle (Histogram / BarChart vs Area) */}
            <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-medium mr-1">
              <button
                type="button"
                onClick={() => setContactChartType('histogram')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center cursor-pointer ${contactChartType === 'histogram' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <BarChart2 className="w-3.5 h-3.5 mr-1" /> Histogram
              </button>
              <button
                type="button"
                onClick={() => setContactChartType('area')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center cursor-pointer ${contactChartType === 'area' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Activity className="w-3.5 h-3.5 mr-1" /> Area
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-medium mr-1">
              <button
                type="button"
                onClick={() => { setContactValue(6); setContactUnit('hours'); }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${contactValue === 6 && contactUnit === 'hours' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                6h
              </button>
              <button
                type="button"
                onClick={() => { setContactValue(24); setContactUnit('hours'); }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${contactValue === 24 && contactUnit === 'hours' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                24h
              </button>
              <button
                type="button"
                onClick={() => { setContactValue(7); setContactUnit('days'); }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${contactValue === 7 && contactUnit === 'days' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                7d
              </button>
              <button
                type="button"
                onClick={() => { setContactValue(30); setContactUnit('days'); }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${contactValue === 30 && contactUnit === 'days' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                30d
              </button>
            </div>

            {/* Dynamic Input & Selector */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500">
              <span className="text-xs font-semibold text-slate-500">Last:</span>
              <input
                type="number"
                min="1"
                max="365"
                value={contactValue}
                onChange={(e) => setContactValue(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 text-sm font-bold text-slate-900 focus:outline-none bg-transparent"
              />
              <select
                value={contactUnit}
                onChange={(e) => setContactUnit(e.target.value)}
                className="text-xs font-semibold text-indigo-600 bg-transparent focus:outline-none cursor-pointer pr-1"
              >
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>

            {/* Multi-Select Staff Code Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStaffDropdownOpen(!isStaffDropdownOpen)}
                className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs text-xs font-semibold text-slate-700 hover:border-indigo-300 transition-colors cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                <span>Staff:</span>
                <span className="font-mono text-indigo-600 font-bold max-w-[120px] truncate">
                  {selectedStaffCodes.length === 0 ? 'All Staff' : selectedStaffCodes.length === 1 ? selectedStaffCodes[0] : `${selectedStaffCodes.length} Selected`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isStaffDropdownOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-bold text-slate-800">
                    <span>Select Staff Codes</span>
                    {selectedStaffCodes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedStaffCodes([])}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Search staff code or name..."
                      value={staffSearchQuery}
                      onChange={e => setStaffSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {(stats?.contactsCreatedStats?.staffList || [])
                      .filter(s => 
                        s.staff_code.toLowerCase().includes(staffSearchQuery.toLowerCase()) || 
                        s.name.toLowerCase().includes(staffSearchQuery.toLowerCase())
                      )
                      .map(s => {
                        const isChecked = selectedStaffCodes.includes(s.staff_code);
                        return (
                          <label
                            key={s.id}
                            className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                              isChecked ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedStaffCodes(selectedStaffCodes.filter(c => c !== s.staff_code));
                                  } else {
                                    setSelectedStaffCodes([...selectedStaffCodes, s.staff_code]);
                                  }
                                }}
                                className="h-3.5 w-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                              />
                              <span className="font-mono text-xs">{s.staff_code}</span>
                              <span className="text-[11px] text-slate-500 truncate">({s.name})</span>
                            </div>
                          </label>
                        );
                      })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedStaffCodes(stats?.contactsCreatedStats?.staffList?.map(s => s.staff_code) || [])}
                      className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                    >
                      Select All ({stats?.contactsCreatedStats?.staffList?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsStaffDropdownOpen(false)}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 sm:p-5 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Contacts Created in Last {contactValue} {contactUnit === 'hours' ? (contactValue === 1 ? 'Hour' : 'Hours') : (contactValue === 1 ? 'Day' : 'Days')}
                {selectedStaffCodes.length > 0 ? ` • Filtered by Staff: ${selectedStaffCodes.join(', ')}` : ''}
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                {stats?.contactsCreatedStats?.total || 0}
                <span className="text-sm font-medium text-slate-500 ml-2">contacts</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="h-[280px]">
            {contactChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {contactChartType === 'histogram' ? (
                  <BarChart data={contactChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    {selectedStaffCodes.length > 0 ? (
                      selectedStaffCodes.map((code, idx) => (
                        <Bar
                          key={code}
                          dataKey={code}
                          name={code}
                          fill={STAFF_COLORS[idx % STAFF_COLORS.length]}
                          radius={[4, 4, 0, 0]}
                        />
                      ))
                    ) : (
                      <Bar dataKey="count" name="Total Contacts" fill="#10b981" radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                ) : (
                  <AreaChart data={contactChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    {selectedStaffCodes.length > 0 ? (
                      selectedStaffCodes.map((code, idx) => (
                        <Area
                          key={code}
                          type="monotone"
                          dataKey={code}
                          name={code}
                          stroke={STAFF_COLORS[idx % STAFF_COLORS.length]}
                          fill={STAFF_COLORS[idx % STAFF_COLORS.length]}
                          fillOpacity={0.2}
                          strokeWidth={2.5}
                        />
                      ))
                    ) : (
                      <Area type="monotone" dataKey="count" name="Total Contacts" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2.5} />
                    )}
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No contacts created in the selected {contactValue} {contactUnit}.
              </div>
            )}
          </div>

          {/* Staff Comparison Breakdown Pills */}
          {stats?.contactsCreatedStats?.staffBreakdown?.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Staff Contacts Comparison</p>
              <div className="flex flex-wrap gap-2">
                {stats.contactsCreatedStats.staffBreakdown.map((sb, idx) => {
                  const color = selectedStaffCodes.length > 0 
                    ? (selectedStaffCodes.includes(sb.staff_code) 
                        ? STAFF_COLORS[selectedStaffCodes.indexOf(sb.staff_code) % STAFF_COLORS.length] 
                        : '#94a3b8')
                    : STAFF_COLORS[idx % STAFF_COLORS.length];
                  return (
                    <div
                      key={sb.staff_code}
                      className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-2xs"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-mono font-bold text-slate-800">{sb.staff_code}</span>
                      <span className="text-slate-500 font-medium truncate max-w-[120px]">({sb.staff_name})</span>
                      <span className="font-extrabold text-indigo-700 bg-white border border-slate-200 rounded-md px-2 py-0.5 ml-1">
                        {sb.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
