'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, MapPin, Briefcase, Mail, Phone, Users, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';

export default function NewUserForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    city: '',
    state: '',
    designation: '',
    institute: '',
    department: '',
    region_type: 'indian',
    country_code: '',
    status: 'active',
    tag1: '',
    tag2: '',
    remarks: ''
  });

  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [isExisting, setIsExisting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email?.trim() && !formData.mobile?.trim()) {
      setStatus('error');
      setErrorMessage('Please provide at least one contact method (Email Address or Mobile Number).');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');
    setIsExisting(false);

    try {
      const res = await fetchApi('/users', {
        method: 'POST',
        body: formData
      });

      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to create user');
      }

      if (res.data?.isExistingCustomer) {
        setIsExisting(true);
      }

      setStatus('success');
      // Reset form
      setFormData({
        name: '', email: '', mobile: '', city: '', state: '', 
        designation: '', institute: '', department: '', 
        region_type: 'indian', country_code: '', status: 'active',
        tag1: '', tag2: '', remarks: ''
      });
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-lg w-full bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {isExisting ? 'Remarks Added to Existing Customer' : 'User Created Successfully'}
          </h2>
          <p className="text-slate-600 mb-8">
            {isExisting 
              ? 'An existing customer record matching this Email or Mobile was found. The details and remarks have been added to their profile timeline.'
              : 'The new contact has been securely added to the CRM and assigned to you.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/users"
              className="px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              Back to Users
            </Link>
            <button 
              onClick={() => { setStatus('idle'); setIsExisting(false); }}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Add Another Contact
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link href="/users" className="p-2 mr-4 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Contact</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manually enter a new partner or user into the CRM.
          </p>
        </div>
      </div>

      {status === 'error' && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-100 flex items-center">
          <ShieldAlert className="w-5 h-5 mr-3" />
          {errorMessage}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        
        {/* Form Sections */}
        <div className="space-y-10">
          
          {/* Personal Details */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5 flex items-center">
              <Users className="w-5 h-5 mr-3 text-indigo-500" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name <span className="text-rose-500">*</span></label>
                <input 
                  type="text" name="name" required
                  value={formData.name} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <input 
                    type="email" name="email" 
                    value={formData.email} onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Code</label>
                  <input 
                    type="text" name="country_code" 
                    value={formData.country_code} onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    placeholder="+91"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mobile Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <input 
                      type="tel" name="mobile" 
                      value={formData.mobile} onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5 flex items-center">
              <Briefcase className="w-5 h-5 mr-3 text-indigo-500" />
              Professional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Institute / Organization</label>
                <input 
                  type="text" name="institute" 
                  value={formData.institute} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="e.g. University of Science"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                <input 
                  type="text" name="department" 
                  value={formData.department} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="e.g. Physics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                <input 
                  type="text" name="designation" 
                  value={formData.designation} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="e.g. Professor"
                />
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5 flex items-center">
              <MapPin className="w-5 h-5 mr-3 text-indigo-500" />
              Location Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Region</label>
                <div className="relative">
                  <select 
                    name="region_type" 
                    value={formData.region_type} onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all appearance-none"
                  >
                    <option value="indian">Indian</option>
                    <option value="abroad">Abroad</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                <input 
                  type="text" name="state" 
                  value={formData.state} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="e.g. Delhi"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                <input 
                  type="text" name="city" 
                  value={formData.city} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="e.g. New Delhi"
                />
              </div>
            </div>
          </div>

          {/* Administrative */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-3 text-indigo-500" />
              Administrative & Tags
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status} onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all appearance-none font-medium"
                  >
                    <option value="active">Active</option>
                    <option value="unverified">Unverified</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tag 1</label>
                <input
                  type="text" name="tag1"
                  value={formData.tag1} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="Enter Tag 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tag 2</label>
                <input
                  type="text" name="tag2"
                  value={formData.tag2} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="Enter Tag 2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Remarks / Notes</label>
                <textarea 
                  name="remarks" 
                  value={formData.remarks} onChange={handleChange}
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
                  placeholder="Any additional information or comments..."
                ></textarea>
                <p className="text-xs text-slate-500 mt-2 flex items-center">
                  <ShieldAlert className="w-3 h-3 mr-1" />
                  Your staff code will be automatically attached to this user profile.
                </p>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end">
          <button 
            type="submit" 
            disabled={status === 'submitting'}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center"
          >
            {status === 'submitting' ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving User...
              </>
            ) : (
              'Save User'
            )}
          </button>
        </div>
      </form>

    </div>
  );
}
