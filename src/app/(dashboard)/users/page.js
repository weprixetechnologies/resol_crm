'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { Search, Plus, ChevronLeft, ChevronRight, Loader2, UserPlus, Eye, AlertTriangle, Filter, X } from 'lucide-react';
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
    source: 'all', region_type: 'all', is_admin_verified: 'all', 
    is_deletion_requested: 'all', startDate: '', endDate: ''
  });
  const [loading, setLoading] = useState(true);

  // Modal State for New User
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', mobile: '', city: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [fuzzyCandidates, setFuzzyCandidates] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    let url = `/users?page=${page}&limit=10&search=${search}`;
    
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
      setNewUserData({ name: '', email: '', mobile: '', city: '' });
      setFuzzyCandidates(null);
      loadUsers();
    } else {
      if (res.error?.code === 'FUZZY_DUPLICATE') {
        setFuzzyCandidates(res.error.candidates);
        setCreateError('Possible duplicate detected. Review candidates below.');
      } else {
        setCreateError(res.error?.message || 'Failed to create user');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CRM Users</h1>
          <p className="text-sm text-slate-500 mt-1">Manage user contacts and track activity.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-xl hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          New User
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div className="flex w-full sm:w-auto flex-1 gap-3">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search users by name, email, or mobile..."
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
                  source: 'all', region_type: 'all', is_admin_verified: 'all', 
                  is_deletion_requested: 'all', startDate: '', endDate: ''
                })}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
              >
                <X className="w-3 h-3 mr-1" /> Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                  <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No users found.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
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
                        <div className="text-sm text-slate-900">{u.email || '-'}</div>
                        <div className="text-sm text-slate-500">{u.mobile || '-'}</div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/users/${u.id}`} className="text-indigo-600 hover:text-indigo-900 inline-flex items-center">
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Link>
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

      {/* New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={(e) => handleCreateUser(e, false)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4" id="modal-title">Create New User</h3>
                  
                  {createError && (
                    <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100 flex items-start">
                      <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <div>{createError}</div>
                    </div>
                  )}

                  {fuzzyCandidates && (
                    <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <h4 className="text-sm font-medium text-amber-800 mb-2">Did you mean one of these users?</h4>
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
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70"
                  >
                    {createLoading ? 'Creating...' : 'Create User'}
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
    </div>
  );
}
