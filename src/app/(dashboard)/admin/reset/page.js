'use client';

import { useState } from 'react';
import { fetchApi } from '@/lib/api';
import { AlertTriangle, Lock, Users, ShieldAlert, CheckCircle2, Loader2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DatabaseResetPage() {
  const { user } = useAuth();
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [portalPassword, setPortalPassword] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [wipeType, setWipeType] = useState(null); // 'users' or 'staff'
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center mt-20">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!portalPassword) {
      setError('Portal password is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const res = await fetchApi('/settings/verify-portal-password', {
      method: 'POST',
      body: JSON.stringify({ portalPassword })
    });
    
    setLoading(false);
    
    if (res.success) {
      setIsUnlocked(true);
    } else {
      setError(res.error?.message || 'Invalid portal password');
      setPortalPassword('');
    }
  };

  const handleOpenModal = (type) => {
    setWipeType(type);
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleWipe = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const endpoint = wipeType === 'users' ? '/settings/wipe-users' : '/settings/wipe-staff';
    const res = await fetchApi(endpoint, {
      method: 'POST',
      body: JSON.stringify({ portalPassword })
    });

    setLoading(false);

    if (res.success) {
      setSuccess(res.data?.message || 'Wipe operation completed successfully.');
      setModalOpen(false);
    } else {
      setError(res.error?.message || 'Authentication failed or operation blocked.');
      if (res.error?.message === 'Invalid portal password') {
        setIsUnlocked(false);
        setPortalPassword('');
      }
    }
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Database Reset Locked</h1>
          <p className="text-sm text-slate-500 mt-1">Enter your portal password to access this page.</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm font-medium rounded-xl border border-rose-200">
            {error}
          </div>
        )}
        
        <form onSubmit={handleUnlock}>
          <div className="mb-4">
            <input
              type="password"
              autoFocus
              required
              value={portalPassword}
              onChange={(e) => setPortalPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-center"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !portalPassword}
            className="w-full py-3 bg-indigo-600 rounded-xl text-white font-bold hover:bg-indigo-700 disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Unlock Database Reset'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Database Reset</h1>
          <p className="text-sm text-slate-500 mt-1">Danger Zone: Hard delete records from the system.</p>
        </div>
        <button 
          onClick={() => { setIsUnlocked(false); setPortalPassword(''); }}
          className="text-sm font-medium text-slate-500 hover:text-slate-700 flex items-center"
        >
          <Lock className="w-4 h-4 mr-1" /> Lock Page
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 flex items-start">
          <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          <div className="font-medium">{success}</div>
        </div>
      )}

      {error && !modalOpen && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 flex items-start">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          <div className="font-medium">{error}</div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-rose-200 overflow-hidden">
        <div className="p-6 border-b border-rose-100 bg-rose-50/50 flex items-center">
          <AlertTriangle className="w-6 h-6 text-rose-600 mr-3" />
          <h2 className="text-lg font-semibold text-rose-900">Danger Zone</h2>
        </div>
        
        <div className="p-6 space-y-8">
          
          {/* Wipe Users */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-slate-500" />
                Wipe All Users & Related Data
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xl">
                This will permanently delete ALL imported, manually added, and public form users. It also deletes user queries, deletion requests, and import batch histories.
              </p>
            </div>
            <button
              onClick={() => handleOpenModal('users')}
              className="px-4 py-2.5 bg-white border-2 border-rose-600 text-rose-600 hover:bg-rose-50 font-bold rounded-xl transition-colors whitespace-nowrap"
            >
              Wipe Users
            </button>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* Wipe Staff */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2 text-slate-500" />
                Wipe All Staff
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xl">
                This will permanently delete ALL staff accounts in the system <strong>except your own account</strong> ({user?.email}).
              </p>
            </div>
            <button
              onClick={() => handleOpenModal('staff')}
              className="px-4 py-2.5 bg-white border-2 border-rose-600 text-rose-600 hover:bg-rose-50 font-bold rounded-xl transition-colors whitespace-nowrap"
            >
              Wipe Staff
            </button>
          </div>

        </div>
      </div>

      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-slate-900/75 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
            <div className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl sm:my-8">
              
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-slate-900 flex items-center">
                  <Lock className="w-6 h-6 mr-2 text-rose-600" />
                  Confirm Deletion
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-sm text-rose-800 font-medium">
                  You are about to execute a hard wipe on 
                  <strong>{wipeType === 'users' ? ' ALL USERS' : ' ALL STAFF (Except you)'}</strong>. 
                  This action is irreversible. Are you absolutely sure?
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWipe}
                  disabled={loading}
                  className="px-6 py-2 bg-rose-600 rounded-xl text-white font-bold hover:bg-rose-700 disabled:opacity-70 flex items-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                  Yes, Wipe {wipeType === 'users' ? 'Users' : 'Staff'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
