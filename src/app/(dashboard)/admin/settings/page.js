'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Save, Loader2, Server, Users, Lock, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // SMTP Test State
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState(null);
  
  // Portal Password State
  const [portalPwdForm, setPortalPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    const res = await fetchApi('/settings');
    if (res.success) {
      setSettings({
        form_submission_enabled: res.data.form_submission_enabled ?? true,
        staff_scope: res.data.staff_scope || 'all',
        smtp_host: res.data.smtp_host || '',
        smtp_port: res.data.smtp_port || '587',
        smtp_secure: res.data.smtp_secure === true || res.data.smtp_secure === 'true',
        smtp_user: res.data.smtp_user || '',
        smtp_pass: res.data.smtp_pass || '',
        smtp_from_email: res.data.smtp_from_email || '',
        smtp_from_name: res.data.smtp_from_name || ''
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    
    const res = await fetchApi('/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });

    setSaving(false);
    if (res.success) {
      setSuccessMsg('Settings updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      alert(res.error?.message || 'Failed to update settings');
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);

    const res = await fetchApi('/mail/test-connection', {
      method: 'POST',
      body: JSON.stringify({
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port,
        smtp_secure: settings.smtp_secure,
        smtp_user: settings.smtp_user,
        smtp_pass: settings.smtp_pass,
        smtp_from_email: settings.smtp_from_email,
        smtp_from_name: settings.smtp_from_name
      })
    });

    setTestingSmtp(false);
    if (res.success) {
      setSmtpTestResult({ success: true, message: res.data?.message || 'SMTP Connection verified successfully!' });
    } else {
      setSmtpTestResult({ success: false, message: res.error?.message || 'SMTP Connection test failed' });
    }
  };

  const handleChangePortalPassword = async () => {
    setPwdError('');
    if (portalPwdForm.newPassword !== portalPwdForm.confirmPassword) {
      setPwdError('New passwords do not match');
      return;
    }
    if (portalPwdForm.newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters');
      return;
    }

    setPwdSaving(true);
    const res = await fetchApi('/settings/portal-password', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword: portalPwdForm.currentPassword,
        newPassword: portalPwdForm.newPassword
      })
    });
    setPwdSaving(false);

    if (res.success) {
      setSuccessMsg('Portal password changed successfully.');
      setPortalPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setPwdError(res.error?.message || 'Failed to update portal password');
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure global application behavior and SMTP mail server.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-xl hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-70"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
          {successMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          
          {/* SMTP Mailer Settings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Nodemailer SMTP Settings</h3>
                  <p className="text-xs text-slate-500">Configure your outgoing email server parameters.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={testingSmtp || !settings.smtp_host}
                className="px-3.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl font-medium text-xs transition-colors flex items-center disabled:opacity-50"
              >
                {testingSmtp ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 mr-1.5" />}
                Test SMTP Connection
              </button>
            </div>

            {smtpTestResult && (
              <div className={`mb-4 p-3 rounded-xl border text-sm flex items-start ${
                smtpTestResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {smtpTestResult.success ? <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 text-rose-600" />}
                <div>{smtpTestResult.message}</div>
              </div>
            )}

            <div className="ml-11 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Host <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. smtp.gmail.com or smtp.mailtrap.io"
                  value={settings.smtp_host}
                  onChange={e => setSettings({...settings, smtp_host: e.target.value})}
                  className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Port <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  placeholder="587, 465, or 25"
                  value={settings.smtp_port}
                  onChange={e => setSettings({...settings, smtp_port: e.target.value})}
                  className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Username / Email</label>
                <input
                  type="text"
                  placeholder="e.g. user@example.com"
                  value={settings.smtp_user}
                  onChange={e => setSettings({...settings, smtp_user: e.target.value})}
                  className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Password / App Password</label>
                <input
                  type="password"
                  placeholder="Enter SMTP password"
                  value={settings.smtp_pass}
                  onChange={e => setSettings({...settings, smtp_pass: e.target.value})}
                  className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">From Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. info@yourdomain.com"
                  value={settings.smtp_from_email}
                  onChange={e => setSettings({...settings, smtp_from_email: e.target.value})}
                  className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sender Name</label>
                <input
                  type="text"
                  placeholder="e.g. RESOL CRM Support"
                  value={settings.smtp_from_name}
                  onChange={e => setSettings({...settings, smtp_from_name: e.target.value})}
                  className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="sm:col-span-2 pt-1">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smtp_secure}
                    onChange={e => setSettings({...settings, smtp_secure: e.target.checked})}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-slate-300 rounded"
                  />
                  <span className="ml-2 text-xs font-medium text-slate-700">Use Secure Connection (SSL/TLS for Port 465)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* Public Form Settings */}
          <div>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Public Forms</h3>
            </div>
            <div className="ml-11">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={settings.form_submission_enabled}
                    onChange={(e) => setSettings({...settings, form_submission_enabled: e.target.checked})}
                  />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${settings.form_submission_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.form_submission_enabled ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-slate-900">Enable Form Submissions</div>
                  <div className="text-xs text-slate-500">When disabled, public endpoints will reject new submissions.</div>
                </div>
              </label>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* Staff Scope Settings */}
          <div>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Staff Access Scope</h3>
            </div>
            <div className="ml-11">
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="staff_scope"
                    value="all"
                    checked={settings.staff_scope === 'all'}
                    onChange={(e) => setSettings({...settings, staff_scope: e.target.value})}
                    className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="ml-3 text-sm text-slate-900 font-medium">Global Access (All)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="staff_scope"
                    value="self_only"
                    checked={settings.staff_scope === 'self_only'}
                    onChange={(e) => setSettings({...settings, staff_scope: e.target.value})}
                    className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="ml-3 text-sm text-slate-900 font-medium">Restricted Access (Self Only)</span>
                </label>
                <p className="text-xs text-slate-500 mt-2">
                  Determines whether staff can view all Customer Data or only the records they created manually.
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* Change Portal Password */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mr-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Change Portal Password</h3>
              </div>
            </div>
            <div className="ml-11">
              <p className="text-sm text-slate-500 mb-4">
                Update the master password required for database reset and hard wipe operations.
              </p>
              
              <div className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Portal Password</label>
                  <input
                    type="password"
                    value={portalPwdForm.currentPassword}
                    onChange={(e) => setPortalPwdForm({...portalPwdForm, currentPassword: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Portal Password</label>
                  <input
                    type="password"
                    value={portalPwdForm.newPassword}
                    onChange={(e) => setPortalPwdForm({...portalPwdForm, newPassword: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={portalPwdForm.confirmPassword}
                    onChange={(e) => setPortalPwdForm({...portalPwdForm, confirmPassword: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent font-mono"
                  />
                </div>
                
                {pwdError && <p className="text-sm text-rose-600 font-medium">{pwdError}</p>}
                
                <button
                  type="button"
                  onClick={handleChangePortalPassword}
                  disabled={pwdSaving || !portalPwdForm.currentPassword || !portalPwdForm.newPassword}
                  className="px-4 py-2 bg-rose-600 text-white font-medium rounded-xl hover:bg-rose-700 disabled:opacity-70 flex items-center"
                >
                  {pwdSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Update Portal Password
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

