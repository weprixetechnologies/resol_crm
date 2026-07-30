'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function DeletionsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    const res = await fetchApi('/deletions');
    if (res.success) {
      setRequests(res.data);
    } else {
      setError(res.error?.message || 'Failed to load deletion requests');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deletion Approvals</h1>
        <p className="text-sm text-slate-500 mt-1">Review and approve or reject user deletion requests.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
          {error}
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
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No pending deletion requests.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50">
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
