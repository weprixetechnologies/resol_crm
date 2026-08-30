'use client';

import { useState, useEffect } from 'react';
import { fetchApi, api } from '@/lib/api';
import Link from 'next/link';
import { Search, Plus, ChevronLeft, ChevronRight, Loader2, UserPlus, Eye, AlertTriangle, Filter, X, Download, Trash2, Mail, Calendar, RefreshCw, CheckCircle2, AlertCircle, Check, ShieldAlert, Zap, Clock, Cpu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isSyncPending, setIsSyncPending] = useState(false);
  const [syncing, setSyncing] = useState(false);
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

  // MSG91 Email Validation State
  const [validatingUserIds, setValidatingUserIds] = useState([]);
  const [bulkValidating, setBulkValidating] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');
  const [isBulkValidateModalOpen, setIsBulkValidateModalOpen] = useState(false);

  // Execution Mode State (DO NOW vs BACKGROUND WORKER)
  const [targetType, setTargetType] = useState('selected'); // 'selected', 'page', 'all'
  const [progressState, setProgressState] = useState(null); // { current, total, currentEmail, deliverable, undeliverable, risky }

  // Modal State for New Customer Data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', mobile: '', city: '', country: 'India', status: 'active', tag1: '', tag2: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [fuzzyCandidates, setFuzzyCandidates] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    let url = `/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
    
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
      setIsSyncPending(!!res.data.isSyncPending);
    }
    setLoading(false);
  };

  const handleSyncSerialNumbers = async () => {
    setSyncing(true);
    const res = await fetchApi('/users/sync-serial', { method: 'POST' });
    setSyncing(false);
    if (res.success) {
      setIsSyncPending(false);
      loadUsers();
    } else {
      alert(res.error?.message || 'Failed to sync serial numbers');
    }
  };

  const handleValidateSingleEmail = async (userId) => {
    setValidatingUserIds(prev => [...prev, userId]);
    const res = await fetchApi(`/users/${userId}/validate-email`, { method: 'POST' });
    setValidatingUserIds(prev => prev.filter(id => id !== userId));

    if (res.success && res.data?.validation) {
      const val = res.data.validation;
      setUsers(prev => prev.map(u => u.id === userId ? {
        ...u,
        email_validation_status: val.resultStatus,
        email_validation_reason: val.reason,
        email_validated_at: new Date().toISOString()
      } : u));
    } else {
      alert(res.error?.message || 'Email validation failed');
    }
  };

  // Helper to determine target users list
  const getTargetUserList = (type = targetType) => {
    if (type === 'selected') return users.filter(u => selectedUserIds.includes(u.id));
    if (type === 'page') return users.filter(u => u.email);
    return []; // 'all' handled by backend query
  };

  // Handle Mode 1: USE BACKGROUND WORKER
  const handleRunBackgroundWorker = async (type = targetType) => {
    const list = getTargetUserList(type);
    const isAll = type === 'all';
    const ids = isAll ? [] : list.map(u => u.id);

    setIsBulkValidateModalOpen(false);
    setValidationMsg(`IT WILL BE VALIDATED SOON. Validation queued for ${isAll ? 'all unvalidated customer' : ids.length} email(s) in the background.`);

    const res = await fetchApi('/users/bulk-validate-email', {
      method: 'POST',
      body: JSON.stringify({
        userIds: ids,
        validateAllUnvalidated: isAll,
        mode: 'background'
      })
    });

    if (!res.success) {
      alert(res.error?.message || 'Failed to queue background validation');
    }
  };

  // Handle Mode 2: DO NOW (Real-time Step-by-Step Loop with Live Progress Bar)
  const handleRunDoNowProgress = async (type = targetType) => {
    const isAll = type === 'all';
    let targetUsersList = [];

    if (isAll) {
      // Fetch unvalidated users
      const res = await fetchApi('/users?limit=100&search=');
      if (res.success) {
        targetUsersList = res.data.items.filter(u => u.email && (!u.email_validation_status || u.email_validation_status === 'unknown'));
      }
    } else {
      targetUsersList = getTargetUserList(type);
    }

    if (targetUsersList.length === 0) {
      alert('No customer emails found matching criteria to validate.');
      return;
    }

    setIsBulkValidateModalOpen(false);
    setBulkValidating(true);

    const totalCount = targetUsersList.length;
    let deliverableCount = 0;
    let undeliverableCount = 0;
    let riskyCount = 0;

    setProgressState({
      current: 0,
      total: totalCount,
      currentEmail: targetUsersList[0].email,
      deliverable: 0,
      undeliverable: 0,
      risky: 0
    });

    // Execute 1-by-1 in loop with UI update per step
    for (let i = 0; i < totalCount; i++) {
      const currentUser = targetUsersList[i];
      setProgressState({
        current: i + 1,
        total: totalCount,
        currentEmail: currentUser.email,
        deliverable: deliverableCount,
        undeliverable: undeliverableCount,
        risky: riskyCount
      });

      const res = await fetchApi(`/users/${currentUser.id}/validate-email`, { method: 'POST' });
      if (res.success && res.data?.validation) {
        const valStatus = res.data.validation.resultStatus;
        if (valStatus === 'deliverable') deliverableCount++;
        else if (valStatus === 'undeliverable') undeliverableCount++;
        else if (valStatus === 'risky') riskyCount++;

        setUsers(prev => prev.map(u => u.id === currentUser.id ? {
          ...u,
          email_validation_status: valStatus,
          email_validation_reason: res.data.validation.reason,
          email_validated_at: new Date().toISOString()
        } : u));
      }
    }

    setBulkValidating(false);
    setProgressState(null);
    setValidationMsg(`Bulk Email Validation Complete! ${totalCount} email(s) validated: ${deliverableCount} Deliverable, ${undeliverableCount} Undeliverable.`);
    loadUsers();
    setTimeout(() => setValidationMsg(''), 6000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, advancedFilters, limit]);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const handleStatusChange = async (userId, newStatus) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    const res = await fetchApi(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.success) {
      alert(res.error?.message || 'Failed to update user status');
      loadUsers();
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
      loadUsers();
    } else if (res.fuzzyCandidates) {
      setFuzzyCandidates(res.fuzzyCandidates);
    } else {
      setCreateError(res.error?.message || 'Failed to add customer data');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/users/export?search=${encodeURIComponent(search)}`;
      Object.keys(advancedFilters).forEach(key => {
        if (advancedFilters[key] && advancedFilters[key] !== 'all') {
          url += `&${key}=${encodeURIComponent(advancedFilters[key])}`;
        }
      });

      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `customer_data_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(err.message || 'Error exporting customer data');
    } finally {
      setExporting(false);
    }
  };

  // Bulk Selection Handlers
  const selectableUsers = users.filter(u => u.is_deletion_requested !== 1);
  const isAllSelected = selectableUsers.length > 0 && selectableUsers.every(u => selectedUserIds.includes(u.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectableUsers.map(u => u.id));
    }
  };

  const toggleSelectUser = (userId) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleBulkDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!bulkDeleteReason.trim()) {
      setBulkDeleteError('Reason/Remarks are required for requesting deletion.');
      return;
    }

    setBulkDeleteLoading(true);
    setBulkDeleteError('');

    const res = await fetchApi('/users/bulk-request-deletion', {
      method: 'POST',
      body: JSON.stringify({
        ids: selectedUserIds,
        reason: bulkDeleteReason.trim()
      })
    });

    setBulkDeleteLoading(false);

    if (res.success) {
      setIsBulkDeleteModalOpen(false);
      setBulkDeleteReason('');
      setSelectedUserIds([]);
      loadUsers();
    } else {
      setBulkDeleteError(res.error?.message || 'Failed to submit bulk deletion request');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner for Serial Sync */}
      {isSyncPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold block text-sm">Serial Number Sync Needed</span>
              Customer records were deleted or archived. Re-sync to assign continuous S.No. (1..N).
            </div>
          </div>
          <button
            onClick={handleSyncSerialNumbers}
            disabled={syncing}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center shrink-0 disabled:opacity-50"
          >
            {syncing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Re-sync S.No. Now
          </button>
        </div>
      )}

      {/* Validation Success Banner */}
      {validationMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{validationMsg}</span>
          </div>
          <button onClick={() => setValidationMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Data</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customers, MSG91 email validation, staff codes, and deletion approvals.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => { setTargetType(selectedUserIds.length > 0 ? 'selected' : 'page'); setIsBulkValidateModalOpen(true); }}
            disabled={bulkValidating}
            className="inline-flex items-center px-4 py-2 border border-indigo-200 shadow-xs text-xs font-bold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {bulkValidating ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-600" /> : <CheckCircle2 className="w-4 h-4 mr-2 text-indigo-600" />}
            Bulk Validate Emails
          </button>

          <button
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-xs text-xs font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-600" /> : <Download className="w-4 h-4 mr-2 text-slate-500" />}
            Export Excel
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-xs text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Add Customer
          </button>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, institute, department, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl leading-5 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Bulk Actions Button */}
            {selectedUserIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setTargetType('selected'); setIsBulkValidateModalOpen(true); }}
                  disabled={bulkValidating}
                  className="inline-flex items-center px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-xs rounded-xl hover:bg-indigo-100 transition-colors shadow-xs disabled:opacity-50"
                >
                  {bulkValidating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />}
                  Validate Selected ({selectedUserIds.length})
                </button>
                <button
                  onClick={() => { setBulkDeleteReason(''); setBulkDeleteError(''); setIsBulkDeleteModalOpen(true); }}
                  className="inline-flex items-center px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs rounded-xl hover:bg-rose-100 transition-colors shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                  Request Deletion ({selectedUserIds.length})
                </button>
              </div>
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
                    placeholder="From"
                    value={advancedFilters.fromSNo}
                    onChange={e => setAdvancedFilters({...advancedFilters, fromSNo: e.target.value})}
                    className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-2.5 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs font-mono"
                  />
                  <span className="text-slate-400 text-xs">-</span>
                  <input
                    type="number"
                    placeholder="To"
                    value={advancedFilters.toSNo}
                    onChange={e => setAdvancedFilters({...advancedFilters, toSNo: e.target.value})}
                    className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-2.5 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Source Dropdown */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Source</label>
                <select
                  value={advancedFilters.source}
                  onChange={e => setAdvancedFilters({...advancedFilters, source: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                >
                  <option value="all">All Sources</option>
                  <option value="manual">Manual Entry</option>
                  <option value="import">Excel Import</option>
                  <option value="public_form">Public Form</option>
                </select>
              </div>

              {/* Status Dropdown */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={advancedFilters.status}
                  onChange={e => setAdvancedFilters({...advancedFilters, status: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">active</option>
                  <option value="unverified">unverified</option>
                </select>
              </div>

              {/* Deletion Requested Dropdown */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Deletion Status</label>
                <select
                  value={advancedFilters.is_deletion_requested}
                  onChange={e => setAdvancedFilters({...advancedFilters, is_deletion_requested: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                >
                  <option value="all">All Records</option>
                  <option value="0">Active Records</option>
                  <option value="1">Pending Deletion</option>
                </select>
              </div>

              {/* Tag 1 Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tag 1</label>
                <input
                  type="text"
                  value={advancedFilters.tag1}
                  onChange={e => setAdvancedFilters({...advancedFilters, tag1: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                  placeholder="Filter by Tag 1"
                />
              </div>

              {/* Tag 2 Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tag 2</label>
                <input
                  type="text"
                  value={advancedFilters.tag2}
                  onChange={e => setAdvancedFilters({...advancedFilters, tag2: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                  placeholder="Filter by Tag 2"
                />
              </div>

              {/* Staff Code Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Staff Code</label>
                <input
                  type="text"
                  value={advancedFilters.staff_code}
                  onChange={e => setAdvancedFilters({...advancedFilters, staff_code: e.target.value})}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs font-mono"
                  placeholder="e.g. ST01"
                />
              </div>

              {/* Location & Details Filters */}
              {[
                { key: 'city', label: 'City' },
                { key: 'state', label: 'State' },
                { key: 'country', label: 'Country' },
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
                    className="block w-full border border-slate-300 rounded-lg shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                    placeholder={`Filter by ${field.label}`}
                  />
                </div>
              ))}
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
              <button onClick={() => applyDatePreset('clear')} className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-rose-50 hover:text-rose-600 font-medium rounded-lg transition-colors text-slate-500">Clear Dates</button>
              
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
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact & Validation</th>
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
                    const rowSNo = u.sl_no || u.id;
                    const valStatus = u.email_validation_status;
                    const valReason = u.email_validation_reason;

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

                        {/* CONTACT COLUMN WITH EMAIL VALIDATION */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-slate-900">{u.email || '-'}</span>
                            {u.email && (
                              <button
                                onClick={() => handleValidateSingleEmail(u.id)}
                                disabled={validatingUserIds.includes(u.id)}
                                className="inline-flex items-center text-[10px] font-bold transition-all disabled:opacity-50"
                                title={valReason || valStatus || 'Validate Email with MSG91'}
                              >
                                {validatingUserIds.includes(u.id) ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                                ) : valStatus === 'deliverable' ? (
                                  <span className="inline-flex items-center gap-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Deliverable
                                  </span>
                                ) : valStatus === 'undeliverable' ? (
                                  <span className="inline-flex items-center gap-0.5 bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded-md text-[10px] font-bold" title={valReason}>
                                    <AlertCircle className="w-3 h-3 text-rose-600" /> Undeliverable {valReason ? `(${valReason})` : ''}
                                  </span>
                                ) : valStatus === 'risky' ? (
                                  <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" /> Risky
                                  </span>
                                ) : (
                                  <span className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                                    Validate
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{u.country_code ? `${u.country_code} ` : ''}{u.mobile || '-'}</div>
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
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-900">{total === 0 ? 0 : (page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-slate-900">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-semibold text-slate-900">{total}</span> customers
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700">Page {page} of {totalPages || 1}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* BULK VALIDATE EMAILS EXECUTION MODAL (DO NOW vs USE BACKGROUND WORKER) */}
      {isBulkValidateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Bulk Email Validation (MSG91 API)</h3>
              </div>
              <button onClick={() => setIsBulkValidateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Selector Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Select Validation Target:</label>
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                {selectedUserIds.length > 0 && (
                  <button
                    onClick={() => setTargetType('selected')}
                    className={`py-2 px-3 rounded-xl border text-center transition-colors ${
                      targetType === 'selected' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Selected ({selectedUserIds.length})
                  </button>
                )}
                <button
                  onClick={() => setTargetType('page')}
                  className={`py-2 px-3 rounded-xl border text-center transition-colors ${
                    targetType === 'page' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Current Page ({users.length})
                </button>
                <button
                  onClick={() => setTargetType('all')}
                  className={`py-2 px-3 rounded-xl border text-center transition-colors ${
                    targetType === 'all' ? 'bg-purple-50 border-purple-300 text-purple-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Unvalidated
                </button>
              </div>
            </div>

            {/* Mode Option Cards */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-700 block">Choose Execution Mode:</span>

              {/* Option 1: DO NOW */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-indigo-950 text-sm">DO NOW (Real-time Progress)</h4>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        Validates email addresses 1-by-1 live with real-time progress bar & counts.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-indigo-100 text-xs text-indigo-900 font-mono">
                  <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Estimated Time: ~{targetType === 'selected' ? selectedUserIds.length : targetType === 'page' ? users.length : 30} sec (1 email / sec)</span>
                </div>

                <button
                  onClick={() => handleRunDoNowProgress(targetType)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-white" /> Start Validation Now
                </button>
              </div>

              {/* Option 2: USE BACKGROUND WORKER */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 hover:bg-slate-100/80 transition-colors">
                <div className="flex items-start gap-3">
                  <Cpu className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">USE BACKGROUND WORKER</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Delegates processing to the background worker. You can close this window and continue working.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRunBackgroundWorker(targetType)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Cpu className="w-4 h-4" /> Queue in Background Worker
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsBulkValidateModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE PROGRESS MODAL FOR "DO NOW" MODE */}
      {progressState && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              <h3 className="font-extrabold text-slate-900 text-base">Validating Emails Live...</h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Progress: {progressState.current} of {progressState.total} emails</span>
                <span className="font-mono">{Math.round((progressState.current / progressState.total) * 100)}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(progressState.current / progressState.total) * 100}%` }}
                ></div>
              </div>

              <div className="text-xs text-slate-500 font-mono truncate pt-1">
                Validating: <span className="text-slate-900 font-bold">{progressState.currentEmail}</span>
              </div>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-emerald-800 font-bold block">Deliverable</span>
                <span className="text-lg font-black text-emerald-600">{progressState.deliverable}</span>
              </div>
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-rose-800 font-bold block">Undeliverable</span>
                <span className="text-lg font-black text-rose-600">{progressState.undeliverable}</span>
              </div>
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-amber-800 font-bold block">Risky</span>
                <span className="text-lg font-black text-amber-600">{progressState.risky}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Request Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Request Deletion ({selectedUserIds.length} Customers)</h3>
              </div>
              <button onClick={() => setIsBulkDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkDeleteSubmit} className="space-y-4 text-xs">
              {bulkDeleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                  {bulkDeleteError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Remarks / Reason for Deletion Request <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={bulkDeleteReason}
                  onChange={(e) => setBulkDeleteReason(e.target.value)}
                  placeholder="Provide explicit remarks explaining why deletion is requested..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkDeleteLoading || !bulkDeleteReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl disabled:opacity-50 flex items-center shadow-xs"
                >
                  {bulkDeleteLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                  Submit Deletion Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Add New Customer</h3>
              </div>
              <button onClick={() => { setIsModalOpen(false); setFuzzyCandidates(null); setCreateError(''); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                {createError}
              </div>
            )}

            {fuzzyCandidates && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-600 flex-shrink-0" />
                  <span>Possible Duplicate Customer Detected!</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Existing customer(s) match the name, email, or details you entered:
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {fuzzyCandidates.map((c, i) => (
                    <div key={i} className="p-2 bg-white rounded-lg border border-amber-200 text-[11px] flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900">{c.name}</span>
                        <span className="text-slate-500 font-mono ml-2">{c.email || c.mobile || ''}</span>
                        <div className="text-[10px] text-slate-400">{c.institute} {c.city ? `(${c.city})` : ''}</div>
                      </div>
                      <Link href={`/users/${c.id}`} target="_blank" className="text-indigo-600 font-bold hover:underline shrink-0 text-[10px]">
                        View Profile
                      </Link>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setFuzzyCandidates(null)}
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 font-bold rounded-lg text-xs hover:bg-amber-100"
                  >
                    Edit Input
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateSubmit(true)}
                    disabled={createLoading}
                    className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg text-xs hover:bg-amber-700 disabled:opacity-50 flex items-center"
                  >
                    {createLoading && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />} Create Anyway
                  </button>
                </div>
              </div>
            )}

            {!fuzzyCandidates && (
              <form onSubmit={(e) => { e.preventDefault(); handleCreateSubmit(false); }} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserData.name}
                      onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      placeholder="e.g. rahul@example.com"
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      value={newUserData.mobile}
                      onChange={(e) => setNewUserData({ ...newUserData, mobile: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={newUserData.city}
                      onChange={(e) => setNewUserData({ ...newUserData, city: e.target.value })}
                      placeholder="e.g. New Delhi"
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={newUserData.country}
                      onChange={(e) => setNewUserData({ ...newUserData, country: e.target.value })}
                      placeholder="e.g. India"
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      value={newUserData.status}
                      onChange={(e) => setNewUserData({ ...newUserData, status: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-700"
                    >
                      <option value="active">active</option>
                      <option value="unverified">unverified</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tag 1
                    </label>
                    <input
                      type="text"
                      value={newUserData.tag1}
                      onChange={(e) => setNewUserData({ ...newUserData, tag1: e.target.value })}
                      placeholder="e.g. VIP Customer"
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tag 2
                    </label>
                    <input
                      type="text"
                      value={newUserData.tag2}
                      onChange={(e) => setNewUserData({ ...newUserData, tag2: e.target.value })}
                      placeholder="e.g. Lead 2026"
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading || !newUserData.name.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50 flex items-center shadow-xs"
                  >
                    {createLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5 mr-1.5" />}
                    Save Customer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
