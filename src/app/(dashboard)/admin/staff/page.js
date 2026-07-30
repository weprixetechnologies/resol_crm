'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Shield, Plus, Loader2, Edit2, Ban, CheckCircle2, UserPlus } from 'lucide-react';

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', staff_code: '' });
  const [formLoading, setFormLoading] = useState(false);

  const loadStaff = async () => {
    setLoading(true);
    const res = await fetchApi('/staff');
    if (res.success) {
      setStaff(res.data.items);
    } else {
      setError(res.error?.message || 'Failed to load staff');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const res = await fetchApi('/staff', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    setFormLoading(false);
    if (res.success) {
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', staff_code: '' });
      loadStaff();
    } else {
      alert(res.error?.message || 'Failed to create staff');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const res = await fetchApi(`/staff/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_disabled: !currentStatus })
    });
    if (res.success) {
      loadStaff();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage staff accounts and their access.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-xl hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Staff
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Member</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                        {member.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-slate-900">{member.name}</div>
                        <div className="text-sm text-slate-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 font-mono font-semibold">{member.staff_code || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${member.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.is_disabled ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                        <Ban className="w-3 h-3 mr-1" /> Disabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {member.role !== 'admin' && (
                      <button
                        onClick={() => toggleStatus(member.id, member.is_disabled)}
                        className={`inline-flex items-center text-sm ${member.is_disabled ? 'text-emerald-600 hover:text-emerald-900' : 'text-rose-600 hover:text-rose-900'}`}
                      >
                        {member.is_disabled ? 'Enable Access' : 'Disable Access'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreate}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Add Staff Member</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Name</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Email</label>
                      <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Password</label>
                      <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Staff Code (Optional, auto-generated if left blank)</label>
                      <input type="text" maxLength={4} value={formData.staff_code} onChange={e => setFormData({...formData, staff_code: e.target.value.toUpperCase()})} placeholder="Leave blank to auto-generate" className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm uppercase font-mono" />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-100">
                  <button type="submit" disabled={formLoading} className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70">
                    {formLoading ? 'Saving...' : 'Add Staff'}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
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
