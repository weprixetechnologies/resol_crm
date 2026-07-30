'use client';

import { useAuth } from '@/context/AuthContext';
import { User, Mail, Shield, Hash, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => router.back()} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Details</h1>
          <p className="text-sm text-slate-500">View your personal account information.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-8 border-b border-slate-100 flex flex-col items-center justify-center bg-slate-50/50">
          <div className="w-24 h-24 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-inner">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
          <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize
            ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'}`}>
            {user.role} Account
          </span>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            
            <div className="flex items-start">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Full Name</p>
                <p className="text-base font-semibold text-slate-900 mt-1">{user.name}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Mail className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Email Address</p>
                <p className="text-base font-semibold text-slate-900 mt-1">{user.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Shield className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Role</p>
                <p className="text-base font-semibold text-slate-900 mt-1 capitalize">{user.role}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Hash className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Staff Code</p>
                <p className="text-base font-bold text-slate-900 font-mono mt-1 tracking-wider">{user.staff_code || 'N/A'}</p>
                <p className="text-xs text-slate-500 mt-1">This code is required for public form submissions.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
