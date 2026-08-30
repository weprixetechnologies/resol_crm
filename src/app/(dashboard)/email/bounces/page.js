'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { 
  UserX, Search, Loader2, Trash2, AlertTriangle, ChevronLeft, ChevronRight, X, ShieldAlert, CheckCircle2, RefreshCw
} from 'lucide-react';

export default function BouncedEmailsPage() {
  const [bounces, setBounces] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [bounceTypeFilter, setBounceTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Selected items for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Deletion Modal State
  const [deleteTarget, setDeleteTarget] = useState(null); // item object
  const [deleting, setDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const loadBounces = async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page,
      limit: 50,
      search: search.trim(),
      bounceType: bounceTypeFilter
    });

    const res = await fetchApi(`/email/bounces?${query.toString()}`);
    setLoading(false);

    if (res.success) {
      const data = res.data || [];
      setBounces(data);
      if (res.pagination) {
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadBounces();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, bounceTypeFilter]);

  useEffect(() => {
    loadBounces();
  }, [page]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(bounces.map(b => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const confirmDeleteContact = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const res = await fetchApi(`/email/bounces/${deleteTarget.id}/contact`, {
      method: 'DELETE'
    });

    setDeleting(false);
    setDeleteTarget(null);

    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message || 'Contact deleted successfully.' });
      loadBounces();
    } else {
      setActionFeedback({ type: 'error', message: res.error?.message || 'Failed to delete contact.' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shadow-xs">
              <UserX className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bounced Emails</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Contacts whose email delivery has failed according to MSG91.
          </p>
        </div>

        <button
          onClick={loadBounces}
          className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh List
        </button>
      </div>

      {actionFeedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold ${
          actionFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{actionFeedback.message}</span>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search email, name, or bounce reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {[
              { label: 'All', value: 'ALL' },
              { label: 'Hard Bounce', value: 'HARD_BOUNCE' },
              { label: 'Soft Bounce', value: 'SOFT_BOUNCE' },
              { label: 'Unknown', value: 'UNKNOWN' }
            ].map(type => (
              <button
                key={type.value}
                onClick={() => setBounceTypeFilter(type.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  bounceTypeFilter === type.value
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bounces Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : bounces.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-medium text-slate-600">No bounced email records found matching filters.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-left border-collapse">
              <thead className="bg-slate-50">
                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5 text-center w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === bounces.length && bounces.length > 0}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5 text-center">Type</th>
                  <th className="px-5 py-3.5 max-w-xs">Reason</th>
                  <th className="px-5 py-3.5">First Bounced</th>
                  <th className="px-5 py-3.5">Last Bounced</th>
                  <th className="px-5 py-3.5 text-center">Count</th>
                  <th className="px-5 py-3.5 text-center">Contact Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-xs">
                {bounces.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-900 whitespace-nowrap">
                      {item.email}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.bounceType === 'HARD_BOUNCE' ? 'bg-rose-100 text-rose-800' :
                        item.bounceType === 'SOFT_BOUNCE' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.bounceType === 'HARD_BOUNCE' ? 'Hard Bounce' : item.bounceType === 'SOFT_BOUNCE' ? 'Soft Bounce' : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs truncate text-slate-600 text-[11px]" title={item.reason}>
                      {item.reason}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                      {new Date(item.firstBouncedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                      {new Date(item.lastBouncedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold font-mono text-slate-800">
                      {item.bounceCount}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <span className="text-[11px] font-bold text-slate-600 capitalize">
                        {item.contactStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {item.canDeleteContact ? (
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="inline-flex items-center px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg text-xs transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Contact
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">No Contact Linked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50 text-xs">
          <p className="text-slate-600">
            Showing page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages || 1}</span> (Total: {total})
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal (PART 13) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Confirm Contact Deletion</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900 font-mono">{deleteTarget.email}</span> ({deleteTarget.name}) from the CRM?
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
              <span className="font-bold block">Important Notice:</span>
              <p>This action will remove the CRM user contact while preserving historical audit and bounce records for future deliverability compliance.</p>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteContact}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
                Yes, Delete Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
