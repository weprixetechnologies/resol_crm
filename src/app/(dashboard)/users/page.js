'use client';

import { useState, useEffect } from 'react';
import { fetchApi, api } from '@/lib/api';
import Link from 'next/link';
import { Search, Plus, ChevronLeft, ChevronRight, Loader2, UserPlus, Eye, AlertTriangle, Filter, X, Download, Trash2, Mail } from 'lucide-react';
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
    city: '', state: '', institute: '', department: '', designation: '', 
    source: 'all', region_type: 'all', status: 'all', tag1: '', tag2: '', staff_code: '',
    is_admin_verified: 'all', is_deletion_requested: 'all', startDate: '', endDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Selection & Bulk Deletion State
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteReason, setBulkDeleteReason] = useState('');
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState('');

  // Modal State for New Customer Data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', mobile: '', city: '', status: 'active', tag1: '', tag2: '' });
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

  const handleExportData = async () => {
    setExporting(true);
    try {
      let url = `/users/export?search=${encodeURIComponent(search)}`;
      Object.keys(advancedFilters).forEach(key => {
        if (advancedFilters[key] && advancedFilters[key] !== 'all') {
          url += `&${key}=${encodeURIComponent(advancedFilters[key])}`;
        }
      });
      
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Customer_Data_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Export Error:', err);
      alert('Export failed. Please try again.');
    }
    setExporting(false);
  };

  const handleCreateUser = async (e, overrideFuzzy = false) => {
    if (e) e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    
    const payload = { ...newUserData, overrideFuzzy };
    
    const res = await fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setCreateLoading(false);

    if (res.success) {
      setIsModalOpen(false);
      setNewUserData({ name: '', email: '', mobile: '', city: '', status: 'active', tag1: '', tag2: '' });
      setFuzzyCandidates(null);
      loadUsers();
    } else {
      if (res.error?.code === 'FUZZY_DUPLICATE') {
        setFuzzyCandidates(res.error.candidates);
        setCreateError('Possible duplicate detected. Review candidates below.');
      } else {
        setCreateError(res.error?.message || 'Failed to create record');
      }
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    const res = await fetchApi(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    if (res.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } else {
      alert(res.error?.message || 'Failed to update status');
    }
  };

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
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkRequestDeletion = async (e) => {
    e.preventDefault();
    if (!bulkDeleteReason.trim()) {
      setBulkDeleteError('Remarks / reason is required for requesting deletion');
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
      setBulkDeleteReason('');
      setSelectedUserIds([]);
      loadUsers();
    } else {
      setBulkDeleteError(res.error?.message || 'Failed to process bulk deletion request');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Data</h1>
          <p className="text-sm text-slate-500 mt-1">Manage customer contacts and track activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="inline-flex items-center px-4 py-2.5 bg-emerald-600 text-white font-medium text-sm rounded-xl hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-70"
          >
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export Data
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-xl hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            New Customer
          </button>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedUserIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-3.5 px-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-3">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
            </span>
            <span className="text-sm font-bold text-rose-900">
              {selectedUserIds.length} customer(s) selected for deletion
            </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href={`/email/compose?users=${selectedUserIds.join(',')}`}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide rounded-xl shadow-md transition-all transform active:scale-95 uppercase"
            >
              <Mail className="w-4 h-4 mr-1.5" />
              COMPOSE MAIL
            </Link>
            <button
              onClick={() => setSelectedUserIds([])}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-xs transition-colors"
            >
              Clear Selection
            </button>
            <button
              onClick={() => {
                setBulkDeleteError('');
                setBulkDeleteReason('');
                setIsBulkDeleteModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wide rounded-xl shadow-md transition-all transform active:scale-95 uppercase"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              REQUEST DELETION
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div className="flex w-full sm:w-auto flex-1 gap-3">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search customer data by name, email, or mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-shadow"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {Object.values(advancedFilters).some(v => v !== '' && v !== 'all') && (
                <span className="ml-2 w-2 h-2 rounded-full bg-indigo-600"></span>
              )}
            </button>
          </div>
          <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
            Total: {total}
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="p-4 bg-white border-b border-slate-100 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-slate-800">Advanced Filters</h3>
              <button 
                onClick={() => setAdvancedFilters({
                  city: '', state: '', institute: '', department: '', designation: '', 
                  source: 'all', region_type: 'all', status: 'all', tag1: '', tag2: '', staff_code: '',
                  is_admin_verified: 'all', is_deletion_requested: 'all', startDate: '', endDate: ''
                })}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
              >
                <X className="w-3 h-3 mr-1" /> Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Region Type</label>
                <select
                  value={advancedFilters.region_type}
                  onChange={e => setAdvancedFilters({...advancedFilters, region_type: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Regions</option>
                  <option value="indian">Indian</option>
                  <option value="foreign">Foreign</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Admin Verified</label>
                <select
                  value={advancedFilters.is_admin_verified}
                  onChange={e => setAdvancedFilters({...advancedFilters, is_admin_verified: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="1">Verified</option>
                  <option value="0">Not Verified</option>
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

              {/* Dates */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Created From</label>
                <input
                  type="date"
                  value={advancedFilters.startDate}
                  onChange={e => setAdvancedFilters({...advancedFilters, startDate: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Created To</label>
                <input
                  type="date"
                  value={advancedFilters.endDate}
                  onChange={e => setAdvancedFilters({...advancedFilters, endDate: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-600"
                />
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto min-h-[400px]">
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
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tag 1</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tag 2</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Code</th>
                  <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center text-slate-500">No customer data found.</td>
                  </tr>
                ) : (
                  users.map((u) => (
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
                        <div className="text-sm text-slate-900">{u.city || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${u.source === 'import' ? 'bg-purple-100 text-purple-800' : 
                            u.source === 'public_form' ? 'bg-emerald-100 text-emerald-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {u.source.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {u.created_by_code || u.staff_code || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <Link href={`/email/compose?userId=${u.id}`} title="Send Email" className="text-slate-400 hover:text-indigo-600 transition-colors inline-flex items-center p-1 rounded-lg hover:bg-slate-100">
                            <Mail className="w-4 h-4" />
                          </Link>
                          <Link href={`/users/${u.id}`} className="text-indigo-600 hover:text-indigo-900 inline-flex items-center">
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Showing page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages || 1}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* New Customer Data Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={(e) => handleCreateUser(e, false)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4" id="modal-title">Create New Customer Data</h3>
                  
                  {createError && (
                    <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100 flex items-start">
                      <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <div>{createError}</div>
                    </div>
                  )}

                  {fuzzyCandidates && (
                    <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <h4 className="text-sm font-medium text-amber-800 mb-2">Did you mean one of these records?</h4>
                      <ul className="space-y-2 mb-3">
                        {fuzzyCandidates.map(c => (
                          <li key={c.id} className="text-xs text-amber-900 bg-amber-100/50 p-2 rounded">
                            <span className="font-semibold">{c.name}</span> ({c.email || c.mobile}) - match: {(c.fuzzyScore * 100).toFixed(1)}%
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => handleCreateUser(null, true)}
                        className="text-sm bg-amber-600 text-white px-3 py-1.5 rounded hover:bg-amber-700"
                      >
                        Yes, create anyway (Override)
                      </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Name</label>
                      <input
                        type="text" required
                        value={newUserData.name}
                        onChange={e => setNewUserData({...newUserData, name: e.target.value})}
                        className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Email</label>
                      <input
                        type="email"
                        value={newUserData.email}
                        onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                        className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Mobile</label>
                      <input
                        type="text"
                        value={newUserData.mobile}
                        onChange={e => setNewUserData({...newUserData, mobile: e.target.value})}
                        className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">City</label>
                      <input
                        type="text"
                        value={newUserData.city}
                        onChange={e => setNewUserData({...newUserData, city: e.target.value})}
                        className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Status</label>
                      <select
                        value={newUserData.status}
                        onChange={e => setNewUserData({...newUserData, status: e.target.value})}
                        className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-medium"
                      >
                        <option value="active">Active</option>
                        <option value="unverified">Unverified</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Tag 1</label>
                      <input
                        type="text"
                        value={newUserData.tag1}
                        onChange={e => setNewUserData({...newUserData, tag1: e.target.value})}
                        placeholder="Enter Tag 1 text"
                        className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Tag 2</label>
                      <input
                        type="text"
                        value={newUserData.tag2}
                        onChange={e => setNewUserData({...newUserData, tag2: e.target.value})}
                        placeholder="Enter Tag 2 text"
                        className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70"
                  >
                    {createLoading ? 'Creating...' : 'Create Customer Data'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Deletion Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="bulk-delete-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsBulkDeleteModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleBulkRequestDeletion}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900" id="bulk-delete-title">
                        Request Deletion ({selectedUserIds.length} selected)
                      </h3>
                      <p className="text-xs text-slate-500">
                        This request will be sent to the admin approval queue.
                      </p>
                    </div>
                  </div>

                  {bulkDeleteError && (
                    <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100 flex items-start">
                      <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <div>{bulkDeleteError}</div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Remarks / Deletion Reason <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows="3"
                        value={bulkDeleteReason}
                        onChange={(e) => setBulkDeleteReason(e.target.value)}
                        placeholder="Enter remarks or reason for deleting the selected customers..."
                        className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                      ></textarea>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Add remarks one time for all selected customers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-100 gap-2">
                  <button
                    type="submit"
                    disabled={bulkDeleteLoading}
                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2.5 bg-rose-600 text-sm font-bold text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 sm:w-auto disabled:opacity-70 uppercase tracking-wide"
                  >
                    {bulkDeleteLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                      </>
                    ) : (
                      'PROCESS REQUEST DELETION'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBulkDeleteModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-300 shadow-sm px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
