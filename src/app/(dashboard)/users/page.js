'use client';

import { useState, useEffect } from 'react';
import { fetchApi, api } from '@/lib/api';
import Link from 'next/link';
import { Search, Plus, ChevronLeft, ChevronRight, Loader2, UserPlus, Eye, AlertTriangle, Filter, X, Download, Trash2, Mail, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    city: '', state: '', country: '', institute: '', department: '', designation: '', 
    source: 'all', status: 'all', tag1: '', tag2: '', staff_code: '',
    is_deletion_requested: 'all', startDate: '', endDate: '',
    fromSNo: '', toSNo: ''
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const applyDatePreset = (preset) => {
    const today = new Date();
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    if (preset === 'today') {
      const dateStr = formatDate(today);
      setAdvancedFilters(prev => ({ ...prev, startDate: dateStr, endDate: dateStr }));
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const dateStr = formatDate(y);
      setAdvancedFilters(prev => ({ ...prev, startDate: dateStr, endDate: dateStr }));
    } else if (preset === '7d') {
      const d7 = new Date(today);
      d7.setDate(d7.getDate() - 6);
      setAdvancedFilters(prev => ({ ...prev, startDate: formatDate(d7), endDate: formatDate(today) }));
    } else if (preset === '30d') {
      const d30 = new Date(today);
      d30.setDate(d30.getDate() - 29);
      setAdvancedFilters(prev => ({ ...prev, startDate: formatDate(d30), endDate: formatDate(today) }));
    } else if (preset === 'this_month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setAdvancedFilters(prev => ({ ...prev, startDate: formatDate(startOfMonth), endDate: formatDate(today) }));
    } else if (preset === 'clear') {
      setAdvancedFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    }
  };

  // Selection & Bulk Deletion State
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteReason, setBulkDeleteReason] = useState('');
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState('');

  // Modal State for New Customer Data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', mobile: '', city: '', country: 'India', status: 'active', tag1: '', tag2: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [fuzzyCandidates, setFuzzyCandidates] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    let url = `/users?page=${page}&limit=10&search=${encodeURIComponent(search)}`;
    
    // Append advanced filters
    Object.keys(advancedFilters).forEach(key => {
      if (advancedFilters[key] && advancedFilters[key] !== 'all') {
        url += `&${key}=${encodeURIComponent(advancedFilters[key])}`;
      }
    });

    const res = await fetchApi(url);
    if (res.success) {
      setUsers(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Debounce search and filters
    const timer = setTimeout(() => {
      setPage(1);
      loadUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, advancedFilters]);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const handleStatusChange = async (userId, newStatus) => {
    // Optimistic UI update
    setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));

    const res = await fetchApi(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });

    if (!res.success) {
      alert(res.error?.message || 'Failed to update user status');
      loadUsers(); // revert
    }
  };

  const handleCreateSubmit = async (overrideFuzzy = false) => {
    setCreateLoading(true);
    setCreateError('');
    if (!overrideFuzzy) setFuzzyCandidates(null);

    const payload = { ...newUserData, overrideFuzzy };

    const res = await fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setCreateLoading(false);

    if (res.success) {
      setIsModalOpen(false);
      setNewUserData({ name: '', email: '', mobile: '', city: '', country: 'India', status: 'active', tag1: '', tag2: '' });
      setFuzzyCandidates(null);
      loadUsers();
    } else {
      if (res.error?.code === 'FUZZY_DUPLICATE') {
        setFuzzyCandidates(res.error.candidates);
      } else if (res.error?.code === 'CUSTOMER_EXISTS') {
        setCreateError(`Customer Already Exists: Match found on ${res.error.matchedField || 'Email/Mobile'}. New query remark has been automatically logged.`);
      } else {
        setCreateError(res.error?.message || 'Failed to create customer record');
      }
    }
  };

  const handleExport = async () => {
    setExporting(true);
    let url = '/users/export?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    
    Object.keys(advancedFilters).forEach(key => {
      if (advancedFilters[key] && advancedFilters[key] !== 'all') {
        url += `${key}=${encodeURIComponent(advancedFilters[key])}&`;
      }
    });

    try {
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `customer_data_export_${new Date().toISOString().substring(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Export failed. Please try again.');
    }
    setExporting(false);
  };

  // Selection Checkbox Logic
  const selectableUsers = users.filter(u => u.is_deletion_requested !== 1);
  const isAllSelected = selectableUsers.length > 0 && selectableUsers.every(u => selectedUserIds.includes(u.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectableUsers.map(u => u.id));
    }
  };

  const toggleSelectUser = (id) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(i => i !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleBulkDeleteSubmit = async () => {
    if (!bulkDeleteReason.trim()) {
      setBulkDeleteError('Please enter a reason or remarks for requesting deletion.');
      return;
    }

    setBulkDeleteLoading(true);
    setBulkDeleteError('');

    const res = await fetchApi('/users/bulk-request-deletion', {
      method: 'POST',
      body: JSON.stringify({ ids: selectedUserIds, reason: bulkDeleteReason.trim() })
    });

    setBulkDeleteLoading(false);

    if (res.success) {
      setIsBulkDeleteModalOpen(false);
      setSelectedUserIds([]);
      setBulkDeleteReason('');
      loadUsers();
    } else {
      setBulkDeleteError(res.error?.message || 'Failed to submit deletion request');
    }
  };

  const baseSNo = advancedFilters.fromSNo ? Math.max(1, parseInt(advancedFilters.fromSNo)) : 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Database</h1>
          <p className="text-sm text-slate-500 mt-1">Manage, search, filter, and track customer contact information & query logs.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-600" /> : <Download className="w-4 h-4 mr-2 text-indigo-600" />}
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Add Customer
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, mobile, city, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Bulk Deletion Action Button */}
            {selectedUserIds.length > 0 && (
              <button
                onClick={() => { setBulkDeleteReason(''); setBulkDeleteError(''); setIsBulkDeleteModalOpen(true); }}
                className="inline-flex items-center px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs rounded-xl hover:bg-rose-100 transition-colors shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                Request Deletion ({selectedUserIds.length})
              </button>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                showFilters ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Filters {Object.values(advancedFilters).some(v => v && v !== 'all') && <span className="w-2 h-2 rounded-full bg-indigo-600 ml-1"></span>}
            </button>

            <div className="text-xs text-slate-500 font-medium">
              Total: {total}
            </div>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="p-4 bg-white border-b border-slate-100 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-slate-800">Advanced Filters</h3>
              <button 
                onClick={() => setAdvancedFilters({
                  city: '', state: '', country: '', institute: '', department: '', designation: '', 
                  source: 'all', status: 'all', tag1: '', tag2: '', staff_code: '',
                  is_deletion_requested: 'all', startDate: '', endDate: '',
                  fromSNo: '', toSNo: ''
                })}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
              >
                <X className="w-3 h-3 mr-1" /> Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Serial Range Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Serial Range (S.No.)</label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    min="1"
                    placeholder="From (e.g. 1)"
                    value={advancedFilters.fromSNo}
                    onChange={e => setAdvancedFilters({...advancedFilters, fromSNo: e.target.value})}
                    className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-2.5 text-xs focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="text-xs text-slate-400 font-medium">to</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="To (e.g. 500)"
                    value={advancedFilters.toSNo}
                    onChange={e => setAdvancedFilters({...advancedFilters, toSNo: e.target.value})}
                    className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-2.5 text-xs focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Status Select Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={advancedFilters.status}
                  onChange={e => setAdvancedFilters({...advancedFilters, status: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>

              {/* Country Text Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  placeholder="Filter by Country (e.g. India, USA)"
                  value={advancedFilters.country}
                  onChange={e => setAdvancedFilters({...advancedFilters, country: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              {/* Tag 1 & Tag 2 Filters */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tag 1</label>
                <input
                  type="text"
                  value={advancedFilters.tag1}
                  onChange={e => setAdvancedFilters({...advancedFilters, tag1: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Filter by Tag 1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tag 2</label>
                <input
                  type="text"
                  value={advancedFilters.tag2}
                  onChange={e => setAdvancedFilters({...advancedFilters, tag2: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Filter by Tag 2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Staff Code</label>
                <input
                  type="text"
                  value={advancedFilters.staff_code}
                  onChange={e => setAdvancedFilters({...advancedFilters, staff_code: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                  placeholder="e.g. ST01"
                />
              </div>

              {/* Text Inputs */}
              {[
                { key: 'city', label: 'City' },
                { key: 'state', label: 'State' },
                { key: 'institute', label: 'Institute' },
                { key: 'department', label: 'Department' },
                { key: 'designation', label: 'Designation' }
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={advancedFilters[field.key]}
                    onChange={e => setAdvancedFilters({...advancedFilters, [field.key]: e.target.value})}
                    className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder={`Any ${field.label.toLowerCase()}`}
                  />
                </div>
              ))}

              {/* Selects */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Source</label>
                <select
                  value={advancedFilters.source}
                  onChange={e => setAdvancedFilters({...advancedFilters, source: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Sources</option>
                  <option value="public_form">Public Form</option>
                  <option value="import">Import</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Deletion Status</label>
                <select
                  value={advancedFilters.is_deletion_requested}
                  onChange={e => setAdvancedFilters({...advancedFilters, is_deletion_requested: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="0">Active</option>
                  <option value="1">Deletion Requested</option>
                </select>
              </div>
            </div>

            {/* Quick Date Presets Row */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 flex items-center mr-1">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> Date Presets:
              </span>
              <button onClick={() => applyDatePreset('today')} className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-medium rounded-lg transition-colors text-slate-700">Today</button>
              <button onClick={() => applyDatePreset('yesterday')} className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-medium rounded-lg transition-colors text-slate-700">Yesterday</button>
              <button onClick={() => applyDatePreset('7d')} className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-medium rounded-lg transition-colors text-slate-700">Last 7 Days</button>
              <button onClick={() => applyDatePreset('30d')} className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-medium rounded-lg transition-colors text-slate-700">Last 30 Days</button>
              <button onClick={() => applyDatePreset('this_month')} className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-medium rounded-lg transition-colors text-slate-700">This Month</button>
              
              <div className="flex items-center space-x-2 ml-auto">
                <input
                  type="date"
                  value={advancedFilters.startDate}
                  onChange={e => setAdvancedFilters({...advancedFilters, startDate: e.target.value})}
                  className="border border-slate-200 rounded-lg text-xs py-1 px-2 text-slate-700"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={advancedFilters.endDate}
                  onChange={e => setAdvancedFilters({...advancedFilters, endDate: e.target.value})}
                  className="border border-slate-200 rounded-lg text-xs py-1 px-2 text-slate-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Customer Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      disabled={selectableUsers.length === 0}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer disabled:opacity-30"
                    />
                  </th>
                  <th scope="col" className="px-3 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">S.No.</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tag 1</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tag 2</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location & Country</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Code</th>
                  <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-12 text-center text-slate-500">No customer data found.</td>
                  </tr>
                ) : (
                  users.map((u, idx) => {
                    const rowSNo = (page - 1) * 10 + baseSNo + idx;
                    return (
                      <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${selectedUserIds.includes(u.id) ? 'bg-indigo-50/40' : ''}`}>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => toggleSelectUser(u.id)}
                            disabled={u.is_deletion_requested === 1}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-center text-xs font-bold font-mono text-slate-600">
                          {rowSNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-slate-900">{u.name}</div>
                              {u.is_deletion_requested === 1 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 mt-1">
                                  Pending Deletion
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={u.status || 'active'}
                            onChange={(e) => handleStatusChange(u.id, e.target.value)}
                            className={`text-xs font-semibold rounded-full px-2.5 py-1 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                              (u.status || 'active') === 'unverified'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            }`}
                          >
                            <option value="active">active</option>
                            <option value="unverified">unverified</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {u.tag1 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {u.tag1}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {u.tag2 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                              {u.tag2}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">{u.email || '-'}</div>
                          <div className="text-sm text-slate-500">{u.country_code ? `${u.country_code} ` : ''}{u.mobile || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-900">{u.city || '-'}</div>
                          <div className="text-xs text-slate-500">{u.country || u.region_type || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${u.source === 'import' ? 'bg-purple-100 text-purple-800' : 
                              u.source === 'public_form' ? 'bg-emerald-100 text-emerald-800' : 
                              'bg-blue-100 text-blue-800'}`}
                          >
                            {u.source ? u.source.replace('_', ' ') : 'Manual'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                          {u.created_by_code || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/users/${u.id}`}
                            className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" /> View / Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-900">{total === 0 ? 0 : (page - 1) * 10 + 1}</span> to{' '}
            <span className="font-semibold text-slate-900">{Math.min(page * 10, total)}</span> of{' '}
            <span className="font-semibold text-slate-900">{total}</span> customers
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Add New Customer</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {createError && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl border border-rose-100 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {createError}
                </div>
              )}

              {/* Fuzzy Match Warning */}
              {fuzzyCandidates && fuzzyCandidates.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">Possible Similar Customer Found</h4>
                      <p className="text-xs text-amber-700 mt-0.5">We found existing customers with similar details in the system:</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {fuzzyCandidates.map((c, i) => (
                      <div key={i} className="text-xs bg-white p-2.5 rounded-lg border border-amber-100 text-slate-700">
                        <strong className="text-slate-900">{c.name}</strong> — {c.email || 'No email'} | {c.mobile || 'No mobile'} ({c.city || 'No city'})
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setFuzzyCandidates(null)}
                      className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 text-xs font-medium rounded-lg hover:bg-amber-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCreateSubmit(true)}
                      className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 shadow-xs"
                    >
                      Create Anyway (Override)
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={newUserData.status}
                    onChange={(e) => setNewUserData({ ...newUserData, status: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="active">active</option>
                    <option value="unverified">unverified</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile</label>
                  <input
                    type="text"
                    value={newUserData.mobile}
                    onChange={(e) => setNewUserData({ ...newUserData, mobile: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="9876543210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newUserData.city}
                    onChange={(e) => setNewUserData({ ...newUserData, city: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Mumbai"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={newUserData.country}
                    onChange={(e) => setNewUserData({ ...newUserData, country: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. India, USA, UK"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tag 1</label>
                  <input
                    type="text"
                    value={newUserData.tag1}
                    onChange={(e) => setNewUserData({ ...newUserData, tag1: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. VIP, Client"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tag 2</label>
                  <input
                    type="text"
                    value={newUserData.tag2}
                    onChange={(e) => setNewUserData({ ...newUserData, tag2: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Workshop2026"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateSubmit(false)}
                disabled={createLoading || !newUserData.name}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center shadow-xs"
              >
                {createLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Deletion Request Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-lg font-bold text-slate-900">Request Bulk Deletion</h3>
              </div>
              <button onClick={() => setIsBulkDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                You are requesting deletion for <strong className="font-bold text-slate-900">{selectedUserIds.length}</strong> selected customer(s). Please provide a reason/remark for the administrator.
              </p>

              {bulkDeleteError && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl border border-rose-100 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {bulkDeleteError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Remarks *</label>
                <textarea
                  rows={3}
                  value={bulkDeleteReason}
                  onChange={(e) => setBulkDeleteReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  placeholder="e.g. Duplicate records cleanup / Customer requested data removal..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteSubmit}
                disabled={bulkDeleteLoading || !bulkDeleteReason.trim()}
                className="px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-50 flex items-center shadow-xs"
              >
                {bulkDeleteLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
