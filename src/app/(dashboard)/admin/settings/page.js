'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Save, Loader2, Server, Users, Lock, Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // SMTP Test State
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState(null);

  // MSG91 Test State
  const [testingMsg91, setTestingMsg91] = useState(false);
  const [msg91TestResult, setMsg91TestResult] = useState(null);

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
        email_provider: res.data.email_provider || 'nodemailer',
        smtp_host: res.data.smtp_host || '',
        smtp_port: res.data.smtp_port || '587',
        smtp_secure: res.data.smtp_secure === true || res.data.smtp_secure === 'true',
        smtp_user: res.data.smtp_user || '',
        smtp_pass: res.data.smtp_pass || '',
        smtp_from_email: res.data.smtp_from_email || '',
        smtp_from_name: res.data.smtp_from_name || 'RESOL CRM',
        msg91_auth_key: res.data.msg91_auth_key || '',
        msg91_domain: res.data.msg91_domain || '',
        msg91_from_email: res.data.msg91_from_email || '',
        msg91_from_name: res.data.msg91_from_name || 'RESOL CRM',
        msg91_reply_to_email: res.data.msg91_reply_to_email || '',
        msg91_default_template_id: res.data.msg91_default_template_id || ''
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

    let res = await fetchApi('/settings/test-smtp-connection', {
      method: 'POST',
      body: JSON.stringify({
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port,
        smtp_secure: settings.smtp_secure,
        smtp_user: settings.smtp_user,
        smtp_pass: settings.smtp_pass
      })
    });

    if (!res.success && (res.error?.message === 'Endpoint not found' || res.error?.code === 'NOT_FOUND')) {
      res = await fetchApi('/mail/test-connection', {
        method: 'POST',
        body: JSON.stringify({
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_secure: settings.smtp_secure,
          smtp_user: settings.smtp_user,
          smtp_pass: settings.smtp_pass
        })
      });
    }

    setTestingSmtp(false);
    if (res.success) {
      setSmtpTestResult({ success: true, message: res.data?.message || 'SMTP Server Connection verified successfully!' });
    } else {
      setSmtpTestResult({ success: false, message: res.error?.message || 'SMTP Connection test failed' });
    }
  };

  const handleTestMsg91 = async () => {
    setTestingMsg91(true);
    setMsg91TestResult(null);

    const res = await fetchApi('/settings/test-msg91-connection', {
      method: 'POST',
      body: JSON.stringify({
        msg91_auth_key: settings.msg91_auth_key,
        msg91_domain: settings.msg91_domain,
        msg91_from_email: settings.msg91_from_email
      })
    });

    setTestingMsg91(false);
    if (res.success) {
      setMsg91TestResult({ success: true, message: res.data?.message || 'MSG91 API Connection verified successfully!' });
    } else {
      setMsg91TestResult({ success: false, message: res.error?.message || 'MSG91 Connection test failed' });
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
          <p className="text-sm text-slate-500 mt-1">Configure global application behavior, MSG91 Email API, and SMTP Nodemailer integration settings.</p>
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
          
          {/* Active Email Provider Selector */}
          <div>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Active Email Delivery Provider</h3>
                <p className="text-xs text-slate-500">Select which provider to use for transactional and bulk email campaign dispatches.</p>
              </div>
            </div>
            <div className="ml-11 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-3 ${
                  settings.email_provider === 'nodemailer'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="email_provider"
                  value="nodemailer"
                  checked={settings.email_provider === 'nodemailer'}
                  onChange={e => setSettings({ ...settings, email_provider: e.target.value })}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-semibold text-sm">Nodemailer (Custom SMTP)</div>
                  <div className="text-xs text-slate-500 mt-0.5">Use direct SMTP host, port, and authentication credentials.</div>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-3 ${
                  settings.email_provider === 'msg91'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="email_provider"
                  value="msg91"
                  checked={settings.email_provider === 'msg91'}
                  onChange={e => setSettings({ ...settings, email_provider: e.target.value })}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-semibold text-sm">MSG91 Email API (v5)</div>
                  <div className="text-xs text-slate-500 mt-0.5">High-volume bulk email sending via MSG91 API & Verified Domain.</div>
                </div>
              </label>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* MSG91 Email API Settings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">MSG91 Email Integration Settings</h3>
                  <p className="text-xs text-slate-500">Configure AuthKey, Verified Domain, and Default Templates for MSG91 Email Service.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestMsg91}
                disabled={testingMsg91 || !settings.msg91_auth_key || !settings.msg91_domain}
                className="px-3.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl font-medium text-xs transition-colors flex items-center disabled:opacity-50"
              >
                {testingMsg91 ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                Test MSG91 Connection
              </button>
            </div>

            {msg91TestResult && (
              <div className={`mb-4 p-3 rounded-xl border text-sm flex items-start ${
                msg91TestResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {msg91TestResult.success ? <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 text-rose-600" />}
                <div>{msg91TestResult.message}</div>
              </div>
            )}

            <div className="ml-11 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">MSG91 Auth Key</label>
                  <input
                    type="password"
                    placeholder="Enter MSG91 Auth Key"
                    value={settings.msg91_auth_key}
                    onChange={e => setSettings({ ...settings, msg91_auth_key: e.target.value })}
                    className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Verified Sender Domain</label>
                  <input
                    type="text"
                    placeholder="e.g. yourdomain.com"
                    value={settings.msg91_domain}
                    onChange={e => setSettings({ ...settings, msg91_domain: e.target.value })}
                    className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">From Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. info@yourdomain.com"
                    value={settings.msg91_from_email}
                    onChange={e => setSettings({ ...settings, msg91_from_email: e.target.value })}
                    className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">From Sender Name</label>
                  <input
                    type="text"
                    placeholder="e.g. RESOL CRM"
                    value={settings.msg91_from_name}
                    onChange={e => setSettings({ ...settings, msg91_from_name: e.target.value })}
                    className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reply-To Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. reply@yourdomain.com"
                    value={settings.msg91_reply_to_email || ''}
                    onChange={e => setSettings({ ...settings, msg91_reply_to_email: e.target.value })}
                    className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Template ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. template_123"
                    value={settings.msg91_default_template_id}
                    onChange={e => setSettings({ ...settings, msg91_default_template_id: e.target.value })}
                    className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* SMTP Integration Settings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">SMTP Email Server & Nodemailer Configuration</h3>
                  <p className="text-xs text-slate-500">Configure custom SMTP host, credentials, port, and default sender identity.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={testingSmtp || !settings.smtp_host}
                className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl font-medium text-xs transition-colors flex items-center disabled:opacity-50"
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

            <div className="ml-11 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    placeholder="e.g. smtp.gmail.com"
                    value={settings.smtp_host}
                    onChange={e => setSettings({...settings, smtp_host: e.target.value})}
                    className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Port</label>
                  <input
                    type="text"
                    placeholder="587 or 465"
                    value={settings.smtp_port}
                    onChange={e => setSettings({...settings, smtp_port: e.target.value})}
                    className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Username / Email</label>
                  <input
                    type="text"
                    placeholder="Username or email address"
                    value={settings.smtp_user}
                    onChange={e => setSettings({...settings, smtp_user: e.target.value})}
                    className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Password / App Secret</label>
                  <input
                    type="password"
                    placeholder="Enter password or App Password"
                    value={settings.smtp_pass}
                    onChange={e => setSettings({...settings, smtp_pass: e.target.value})}
                    className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">From Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. info@yourdomain.com"
                    value={settings.smtp_from_email}
                    onChange={e => setSettings({...settings, smtp_from_email: e.target.value})}
                    className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">From Sender Name</label>
                  <input
                    type="text"
                    placeholder="e.g. RESOL CRM"
                    value={settings.smtp_from_name}
                    onChange={e => setSettings({...settings, smtp_from_name: e.target.value})}
                    className="block w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smtp_secure}
                    onChange={e => setSettings({...settings, smtp_secure: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                  />
                  <span className="ml-2 text-xs font-medium text-slate-700">Use SSL/TLS Security (Port 465)</span>
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
