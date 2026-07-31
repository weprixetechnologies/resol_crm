'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function DeletionsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    const res = await fetchApi('/deletions');
    if (res.success) {
      setRequests(res.data);
      setSelectedIds([]);
    } else {
      setError(res.error?.message || 'Failed to load deletion requests');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map(r => r.id));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAction = async (id, action) => {
    setActionLoading(id);
    const res = await fetchApi(`/deletions/${id}/${action}`, {
      method: 'POST'
    });
    setActionLoading(null);
    if (res.success) {
      loadRequests();
    } else {
      alert(res.error?.message || `Failed to ${action} deletion`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    const res = await fetchApi(`/deletions/bulk-${action}`, {
      method: 'POST',
      body: JSON.stringify({ userIds: selectedIds })
    });
    setBulkLoading(false);
    if (res.success) {
      loadRequests();
    } else {
      alert(res.error?.message || `Failed to bulk ${action} deletions`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deletion Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">Review and approve or reject user deletion requests.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
          {error}
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <span className="bg-indigo-600 text-white font-bold text-xs px-2.5 py-1 rounded-full">
              {selectedIds.length}
            </span>
            <span className="text-sm font-medium">deletion request(s) selected</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={bulkLoading}
              className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 mr-1.5 text-rose-400" />
              Reject Selected
            </button>
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={bulkLoading}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Approve Selected
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={requests.length > 0 && selectedIds.length === requests.length}
                    onChange={toggleSelectAll}
                    disabled={requests.length === 0}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer disabled:opacity-30"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Requested At</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">No pending deletion requests.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className={`hover:bg-slate-50/50 ${selectedIds.includes(req.id) ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(req.id)}
                        onChange={() => toggleSelectRow(req.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">{req.name}</div>
                      <div className="text-xs text-slate-500">ID: {req.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{req.email || '-'}</div>
                      <div className="text-sm text-slate-500">{req.mobile || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg inline-block">
                        {req.deletion_reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(req.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleAction(req.id, 'reject')}
                        disabled={actionLoading === req.id}
                        className="inline-flex items-center text-slate-600 hover:text-slate-900 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'approve')}
                        disabled={actionLoading === req.id}
                        className="inline-flex items-center text-rose-600 hover:text-rose-900 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
