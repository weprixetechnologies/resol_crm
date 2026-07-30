'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Activity, Trash2, Loader2, Laptop } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSessions = async () => {
    setLoading(true);
    const res = await fetchApi('/sessions');
    if (res.success) {
      setSessions(res.data);
    } else {
      setError(res.error?.message || 'Failed to load sessions');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevoke = async (sessionId) => {
    const res = await fetchApi(`/sessions/${sessionId}`, { method: 'DELETE' });
    if (res.success) {
      loadSessions();
    } else {
      alert(res.error?.message || 'Failed to revoke session');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Sessions</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor and force logout active sessions across the system.</p>
        </div>
        <button
          onClick={loadSessions}
          className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium text-sm rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
        >
          <Activity className="w-4 h-4 mr-2 text-indigo-500" />
          Refresh
        </button>
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Device / Session ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {sessions.map((sess) => (
                <tr key={sess.sessionId} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Laptop className="w-5 h-5 text-slate-400 mr-3" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {sess.sessionId.includes(':') 
                            ? sess.sessionId.split(':')[1].substring(0, 8) 
                            : sess.sessionId.substring(0, 8)}...
                        </div>
                        <div className="text-xs text-slate-500">{sess.sessionId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                    {sess.userId}
                    {user?.id.toString() === sess.userId && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                        You
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(sess.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleRevoke(sess.sessionId)}
                      className="inline-flex items-center text-rose-600 hover:text-rose-900"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Force Logout
                    </button>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">No active sessions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
