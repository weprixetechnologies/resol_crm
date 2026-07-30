'use client';

import { useState, useEffect, use } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, User, MapPin, Mail, Phone, Calendar, ShieldAlert, Loader2, Save, Trash2, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserDetailPage({ params }) {
  const { id } = use(params);
  const { user: authUser } = useAuth();
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newRemark, setNewRemark] = useState('');
  const [submittingRemark, setSubmittingRemark] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Deletion State
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    const res = await fetchApi(`/users/${id}`);
    if (res.success) {
      setUser(res.data.user);
      setTimeline(res.data.timeline || []);
      setRemarks(res.data.remarks || []);
      setEditData(res.data.user);
    } else {
      setError(res.error?.message || 'Failed to load user details');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    // Admin full edit, Staff can also edit but backend validates allowed fields
    const res = await fetchApi(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(editData)
    });

    setSaving(false);
    if (res.success) {
      setUser(res.data);
      setIsEditing(false);
      loadData(); // reload timeline
    } else {
      setError(res.error?.message || 'Failed to update user');
    }
  };

  const handleRequestDeletion = async () => {
    if (!deleteReason) {
      setError('Please provide a reason for deletion');
      return;
    }
    setSaving(true);
    setError('');

    const res = await fetchApi(`/users/${id}/request-deletion`, {
      method: 'POST',
      body: JSON.stringify({ reason: deleteReason })
    });

    setSaving(false);
    if (res.success) {
      setIsDeleting(false);
      loadData();
    } else {
      setError(res.error?.message || 'Failed to request deletion');
    }
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;
    setSubmittingRemark(true);
    const res = await fetchApi(`/users/${id}/remarks`, {
      method: 'POST',
      body: JSON.stringify({ remark: newRemark })
    });
    setSubmittingRemark(false);
    if (res.success) {
      setNewRemark('');
      loadData();
    } else {
      setError(res.error?.message || 'Failed to add remark');
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
      {error || 'User not found'}
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4">
        <button onClick={() => router.back()} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Profile</h1>
          <p className="text-sm text-slate-500">ID: {user.id}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
          {error}
        </div>
      )}

      {user.is_deletion_requested === 1 && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start">
          <ShieldAlert className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-800">Deletion Requested</h3>
            <p className="text-sm text-amber-700 mt-1">Reason: {user.deletion_reason}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900">Personal Information</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-sm font-medium text-slate-600 hover:text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Full Name</label>
                  {isEditing ? (
                    <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  ) : (
                    <div className="flex items-center text-slate-900 font-medium"><User className="w-4 h-4 mr-2 text-slate-400" />{user.name}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
                  {isEditing ? (
                    <input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  ) : (
                    <div className="flex items-center text-slate-900 font-medium"><Mail className="w-4 h-4 mr-2 text-slate-400" />{user.email || 'N/A'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Mobile</label>
                  {isEditing ? (
                    <input type="text" value={editData.mobile} onChange={e => setEditData({...editData, mobile: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  ) : (
                    <div className="flex items-center text-slate-900 font-medium"><Phone className="w-4 h-4 mr-2 text-slate-400" />{user.mobile || 'N/A'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">City</label>
                  {isEditing ? (
                    <input type="text" value={editData.city} onChange={e => setEditData({...editData, city: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  ) : (
                    <div className="flex items-center text-slate-900 font-medium"><MapPin className="w-4 h-4 mr-2 text-slate-400" />{user.city || 'N/A'}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Institute</label>
                  {isEditing ? (
                    <input type="text" value={editData.institute} onChange={e => setEditData({...editData, institute: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  ) : (
                    <div className="text-slate-900 font-medium">{user.institute || 'N/A'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Department</label>
                  {isEditing ? (
                    <input type="text" value={editData.department} onChange={e => setEditData({...editData, department: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  ) : (
                    <div className="text-slate-900 font-medium">{user.department || 'N/A'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">State</label>
                  {isEditing ? (
                    <input type="text" value={editData.state} onChange={e => setEditData({...editData, state: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  ) : (
                    <div className="text-slate-900 font-medium">{user.state || 'N/A'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Region</label>
                  {isEditing ? (
                    <select value={editData.region_type || ''} onChange={e => setEditData({...editData, region_type: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Select Region</option>
                      <option value="indian">Indian</option>
                      <option value="abroad">Abroad</option>
                    </select>
                  ) : (
                    <div className="text-slate-900 font-medium capitalize">{user.region_type || 'N/A'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Country Code</label>
                  {isEditing ? (
                    <input type="text" placeholder="e.g. +91" value={editData.country_code || ''} onChange={e => setEditData({...editData, country_code: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  ) : (
                    <div className="text-slate-900 font-medium">{user.country_code || 'N/A'}</div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-500 mb-1">Remarks</label>
                  {isEditing ? (
                    <textarea value={editData.remarks || ''} onChange={e => setEditData({...editData, remarks: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" rows="2"></textarea>
                  ) : (
                    <div className="text-slate-900 font-medium whitespace-pre-wrap">{user.remarks || 'N/A'}</div>
                  )}
                </div>
              </div>

              {/* Read-only metadata */}
              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Source</label>
                  <div className="mt-1 text-sm font-medium text-slate-900 capitalize">{user.source || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Created By</label>
                  <div className="mt-1 text-sm font-medium text-slate-900">{user.created_by_code ? `Staff: ${user.created_by_code}` : (user.created_by ? `ID: ${user.created_by}` : 'System')}</div>
                </div>
              </div>
            </div>
            
            {/* Action Footer */}
            {user.is_deletion_requested === 0 && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                {isDeleting ? (
                  <div className="flex-1 flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="Reason for deletion..."
                      value={deleteReason}
                      onChange={e => setDeleteReason(e.target.value)}
                      className="flex-1 border border-slate-300 rounded-lg p-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
                    />
                    <button onClick={handleRequestDeletion} disabled={saving} className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700">Submit Request</button>
                    <button onClick={() => setIsDeleting(false)} className="bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setIsDeleting(true)} className="flex items-center text-sm font-medium text-rose-600 hover:text-rose-700">
                    <Trash2 className="w-4 h-4 mr-1" /> Request Deletion
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900">Activity Timeline</h3>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {timeline.map((event, eventIdx) => (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {eventIdx !== timeline.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center ring-8 ring-white">
                              <Calendar className="h-4 w-4 text-slate-500" />
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-slate-900 font-medium">
                                {event.action.replace(/_/g, ' ')}
                              </p>
                              {event.meta && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {JSON.stringify(event.meta)}
                                </p>
                              )}
                            </div>
                            <div className="whitespace-nowrap text-right text-xs text-slate-500">
                              <time dateTime={event.created_at}>{new Date(event.created_at).toLocaleDateString()}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                  {timeline.length === 0 && (
                    <div className="text-sm text-slate-500 text-center py-4">No recent activity.</div>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Remarks Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-slate-500" />
            Remarks & Queries
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4 mb-6">
            {remarks.map(remark => (
              <div key={remark.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-slate-700">
                    {remark.created_by_name || (remark.source === 'import' ? 'Imported' : 'System')}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(remark.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{remark.remark}</p>
              </div>
            ))}
            {remarks.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-4">No remarks yet.</div>
            )}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={newRemark}
              onChange={e => setNewRemark(e.target.value)}
              placeholder="Add a new remark..."
              onKeyDown={e => e.key === 'Enter' && handleAddRemark()}
              className="flex-1 border border-slate-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <button
              onClick={handleAddRemark}
              disabled={submittingRemark || !newRemark.trim()}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-70 flex items-center"
            >
              {submittingRemark ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
