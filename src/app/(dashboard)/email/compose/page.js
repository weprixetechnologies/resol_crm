'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { 
  Send, Users, FileText, Sparkles, Plus, Check, Loader2, Search, 
  X, Eye, Tag, AlertCircle, CheckCircle2, History, Save, Filter,
  CheckSquare, Square, ChevronLeft, ChevronRight, UserCheck, Shield, Building, MapPin
} from 'lucide-react';

const DYNAMIC_TAGS = [
  { tag: '{{name}}', label: 'Customer Name' },
  { tag: '{{email}}', label: 'Email Address' },
  { tag: '{{city}}', label: 'City' },
  { tag: '{{state}}', label: 'State' },
  { tag: '{{institute}}', label: 'Institute' },
  { tag: '{{department}}', label: 'Department' },
  { tag: '{{designation}}', label: 'Designation' },
  { tag: '{{staff_code}}', label: 'Staff Code' },
  { tag: '{{tag1}}', label: 'Tag 1' },
  { tag: '{{tag2}}', label: 'Tag 2' }
];

function ComposeMailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Selected Recipients State
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [customEmails, setCustomEmails] = useState('');

  // Customer Modal & Server Search/Pagination State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [modalTotal, setModalTotal] = useState(0);
  const [modalPage, setModalPage] = useState(1);
  const [modalTotalPages, setModalTotalPages] = useState(1);
  const [modalSearch, setModalSearch] = useState('');
  const [modalStaffFilter, setModalStaffFilter] = useState('all');
  const [modalTagFilter, setModalTagFilter] = useState('all');
  const [modalLoading, setModalLoading] = useState(false);
  const [sendToAllMatching, setSendToAllMatching] = useState(false);
  const [matchingCriteria, setMatchingCriteria] = useState(null);
  const [hoveredCustomer, setHoveredCustomer] = useState(null);

  // Template & Content State
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [saveAsTemplateName, setSaveAsTemplateName] = useState('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Sending State
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Preview State
  const [previewCustomerIdx, setPreviewCustomerIdx] = useState(0);

  useEffect(() => {
    loadTemplates();
    handleInitialRecipients();
  }, [searchParams]);

  const loadTemplates = async () => {
    const res = await fetchApi('/mail/templates');
    if (res.success) {
      setTemplates(res.data);
      const urlTplId = searchParams.get('templateId');
      if (urlTplId) {
        const found = res.data.find(t => t.id === parseInt(urlTplId));
        if (found) {
          setSelectedTemplateId(found.id);
          setSubject(found.subject);
          setBodyHtml(found.body_html);
        }
      }
    }
  };

  const handleInitialRecipients = async () => {
    const singleUserId = searchParams.get('userId');
    const multiUserIds = searchParams.get('users');

    const idsToFetch = [];
    if (singleUserId) idsToFetch.push(singleUserId);
    if (multiUserIds) {
      multiUserIds.split(',').forEach(id => {
        if (id && !idsToFetch.includes(id)) idsToFetch.push(id);
      });
    }

    if (idsToFetch.length > 0) {
      const loaded = [];
      for (const id of idsToFetch) {
        const res = await fetchApi(`/users/${id}`);
        if (res.success && res.data?.user) {
          loaded.push(res.data.user);
        }
      }
      setSelectedCustomers(loaded);
    }
  };

  const fetchModalCustomers = async (p = 1, s = modalSearch, staff = modalStaffFilter, tag = modalTagFilter) => {
    setModalLoading(true);
    let url = `/users?page=${p}&limit=50`;
    if (s && s.trim()) url += `&search=${encodeURIComponent(s.trim())}`;
    if (staff && staff !== 'all') url += `&staff_code=${encodeURIComponent(staff)}`;
    if (tag && tag !== 'all') url += `&tag1=${encodeURIComponent(tag)}`;

    const res = await fetchApi(url);
    if (res.success && res.data) {
      setAllCustomers(res.data.items || []);
      setModalTotal(res.data.total || 0);
      setModalPage(res.data.page || 1);
      setModalTotalPages(res.data.totalPages || 1);
    }
    setModalLoading(false);
  };

  const openCustomerModal = () => {
    setIsCustomerModalOpen(true);
    fetchModalCustomers(1, modalSearch, modalStaffFilter, modalTagFilter);
  };

  // Debounced search trigger for server-side search across 12,000+ customers
  useEffect(() => {
    if (!isCustomerModalOpen) return;
    const timer = setTimeout(() => {
      fetchModalCustomers(1, modalSearch, modalStaffFilter, modalTagFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [modalSearch, modalStaffFilter, modalTagFilter, isCustomerModalOpen]);

  const handleTemplateSelect = (tplId) => {
    setSelectedTemplateId(tplId);
    if (!tplId) return;
    const tpl = templates.find(t => t.id === parseInt(tplId));
    if (tpl) {
      setSubject(tpl.subject);
      setBodyHtml(tpl.body_html);
    }
  };

  const insertTag = (tagStr) => {
    setBodyHtml(prev => prev + ` ${tagStr} `);
  };

  const toggleSelectCustomer = (cust) => {
    setSendToAllMatching(false);
    setSelectedCustomers(prev => {
      const exists = prev.some(c => c.id === cust.id);
      if (exists) return prev.filter(c => c.id !== cust.id);
      return [...prev, cust];
    });
  };

  const removeCustomer = (id) => {
    setSendToAllMatching(false);
    setSelectedCustomers(prev => prev.filter(c => c.id !== id));
  };

  const getInterpolatedText = (text, customer) => {
    if (!text) return '';
    if (!customer) return text;

    return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
      const val = customer[key] || customer[key.toLowerCase()];
      if (val !== undefined && val !== null) {
        return String(val);
      }
      if (key === 'staff_code') return customer.created_by_code || customer.staff_code || '';
      return '';
    });
  };

  const handleSaveAsTemplate = async (e) => {
    e.preventDefault();
    if (!saveAsTemplateName.trim()) return;
    setSavingTemplate(true);

    const res = await fetchApi('/mail/templates', {
      method: 'POST',
      body: JSON.stringify({
        name: saveAsTemplateName.trim(),
        subject,
        body_html: bodyHtml
      })
    });

    setSavingTemplate(false);
    if (res.success) {
      setShowSaveTemplateModal(false);
      setSaveAsTemplateName('');
      loadTemplates();
      setSelectedTemplateId(res.data.id);
    } else {
      alert(res.error?.message || 'Failed to save template');
    }
  };

  const handleSendMail = async (e) => {
    e.preventDefault();
    if (!sendToAllMatching && selectedCustomers.length === 0 && !customEmails.trim()) {
      alert('Please select at least one customer or enter custom recipient emails.');
      return;
    }
    if (!subject.trim() || !bodyHtml.trim()) {
      alert('Subject and Email Body content are required.');
      return;
    }

    setSending(true);
    setSendResult(null);

    const parsedCustomEmails = customEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    const payload = {
      templateId: selectedTemplateId ? parseInt(selectedTemplateId) : null,
      subject,
      body_html: bodyHtml,
      customEmails: parsedCustomEmails
    };

    if (sendToAllMatching) {
      if (!modalSearch && modalStaffFilter === 'all' && modalTagFilter === 'all') {
        payload.sendToAll = true;
      } else {
        payload.filterCriteria = {
          search: modalSearch,
          staff_code: modalStaffFilter,
          tag1: modalTagFilter
        };
      }
    } else {
      payload.customerIds = selectedCustomers.map(c => c.id);
    }

    const res = await fetchApi('/mail/send', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setSending(false);
    if (res.success) {
      setSendResult({
        success: true,
        data: res.data,
        message: res.message || 'Mails queued for BullMQ background worker!'
      });
    } else {
      setSendResult({
        success: false,
        message: res.error?.message || 'Failed to send emails.'
      });
    }
  };

  const selectPageItemsModal = () => {
    setSendToAllMatching(false);
    const newItems = allCustomers.filter(c => c.email);
    setSelectedCustomers(prev => {
      const merged = [...prev];
      newItems.forEach(item => {
        if (!merged.some(m => m.id === item.id)) merged.push(item);
      });
      return merged;
    });
  };

  const selectAllMatchingInCRM = () => {
    setSendToAllMatching(true);
    setMatchingCriteria({
      search: modalSearch,
      staff_code: modalStaffFilter,
      tag1: modalTagFilter
    });
  };

  const deselectAllModal = () => {
    setSendToAllMatching(false);
    setSelectedCustomers([]);
  };

  const previewCust = selectedCustomers[previewCustomerIdx] || {
    name: 'Sample Customer',
    email: 'customer@example.com',
    city: 'Mumbai',
    institute: 'IIT Bombay',
    staff_code: 'ST01'
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compose & Send Email</h1>
          <p className="text-sm text-slate-500 mt-1">Send non-blocking bulk or individual emails to customers via BullMQ & Nodemailer.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/email/logs')}
            className="inline-flex items-center px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl transition-colors shadow-xs"
          >
            <History className="w-4 h-4 mr-2" /> View Delivery Logs
          </button>
        </div>
      </div>

      {sendResult && (
        <div className={`p-5 rounded-2xl border flex items-start justify-between shadow-sm ${
          sendResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-start space-x-3">
            {sendResult.success ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-bold text-base">{sendResult.message}</h3>
              {sendResult.success && sendResult.data && (
                <div className="text-xs text-emerald-700 mt-1 font-medium space-y-1">
                  <p>⚡ Total Recipient Jobs Enqueued in BullMQ: <strong>{sendResult.data.total}</strong></p>
                  <p className="text-slate-600">The Redis BullMQ background worker is executing non-blocking email delivery. Check <strong>Delivery Logs</strong> for real-time progress.</p>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setSendResult(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMail} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Composer Form */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section 1: Recipients Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h2 className="font-bold text-slate-900 text-base">Select Customer Recipients</h2>
              </div>
              
              <button
                type="button"
                onClick={openCustomerModal}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide rounded-xl shadow-md transition-all transform active:scale-95 uppercase"
              >
                <Users className="w-4 h-4 mr-1.5" />
                Select Customers ({selectedCustomers.length})
              </button>
            </div>

            {/* Selected Customers Bar */}
            <div className="min-h-[60px] p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-2 items-center">
              {selectedCustomers.length === 0 ? (
                <div className="text-xs text-slate-400 italic flex items-center space-x-2 py-1">
                  <span>No customers selected yet. Click</span>
                  <span className="font-bold text-indigo-600 underline cursor-pointer" onClick={openCustomerModal}>&quot;Select Customers&quot;</span>
                  <span>to choose single or bulk recipients.</span>
                </div>
              ) : (
                selectedCustomers.map(c => (
                  <span 
                    key={c.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-slate-800 border border-slate-200 shadow-2xs group"
                  >
                    <span className="font-bold text-indigo-600 mr-1">{c.name}</span>
                    {c.email ? `<${c.email}>` : ''}
                    {c.created_by_code && <span className="ml-1 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">{c.created_by_code}</span>}
                    <button
                      type="button"
                      onClick={() => removeCustomer(c.id)}
                      className="ml-2 text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Custom Emails Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Additional Custom Email Addresses (Optional, comma separated):
              </label>
              <input
                type="text"
                placeholder="e.g. john@example.com, sara@client.com"
                value={customEmails}
                onChange={e => setCustomEmails(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
              />
            </div>
          </div>

          {/* Section 2: Mail Content & Template Selector */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h2 className="font-bold text-slate-900 text-base">Select Template or Customize</h2>
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  value={selectedTemplateId}
                  onChange={e => handleTemplateSelect(e.target.value)}
                  className="border border-slate-300 rounded-xl py-1.5 px-3 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Choose Stored Template --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(true)}
                  disabled={!subject || !bodyHtml}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 flex items-center"
                >
                  <Save className="w-3.5 h-3.5 mr-1" /> Save as Template
                </button>
              </div>
            </div>

            {/* Dynamic Tags Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                <Tag className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Click to Insert Dynamic Customer Variable:
              </label>
              <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {DYNAMIC_TAGS.map(t => (
                  <button
                    key={t.tag}
                    type="button"
                    onClick={() => insertTag(t.tag)}
                    className="px-2 py-0.5 bg-white hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-lg text-xs font-mono font-medium text-indigo-700 transition-colors shadow-2xs"
                  >
                    + {t.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subject Line <span className="text-rose-500">*</span>
              </label>
              <input
                type="text" required
                placeholder="e.g. Important notice for {{name}} from {{institute}}"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
              />
            </div>

            {/* Body HTML Editor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Body HTML <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={12}
                value={bodyHtml}
                onChange={e => setBodyHtml(e.target.value)}
                placeholder="Write custom HTML or plain text. Use {{name}}, {{city}}, {{staff_code}}, etc."
                className="w-full border border-slate-300 rounded-xl p-4 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent leading-relaxed"
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={sending || (selectedCustomers.length === 0 && !customEmails)}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all transform active:scale-95 disabled:opacity-50 uppercase tracking-wide"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending Emails...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> SEND EMAIL DISPATCH
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Dynamic Variable Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Live Customer Mail Preview</h3>
              </div>
              
              {selectedCustomers.length > 1 && (
                <div className="flex items-center space-x-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewCustomerIdx(prev => Math.max(0, prev - 1))}
                    disabled={previewCustomerIdx === 0}
                    className="px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-40"
                  >
                    &lt;
                  </button>
                  <span className="text-slate-500 font-semibold">{previewCustomerIdx + 1}/{selectedCustomers.length}</span>
                  <button
                    type="button"
                    onClick={() => setPreviewCustomerIdx(prev => Math.min(selectedCustomers.length - 1, prev + 1))}
                    disabled={previewCustomerIdx === selectedCustomers.length - 1}
                    className="px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-40"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </div>

            {/* Recipient Details */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 mb-4">
              <div><strong className="text-slate-700">Previewing for:</strong> <span className="font-bold text-indigo-700">{previewCust.name}</span></div>
              <div><strong className="text-slate-700">Email:</strong> {previewCust.email || 'N/A'}</div>
              <div><strong className="text-slate-700">Institute:</strong> {previewCust.institute || 'N/A'}</div>
              <div><strong className="text-slate-700">City:</strong> {previewCust.city || 'N/A'}</div>
              <div><strong className="text-slate-700">Staff Code:</strong> {previewCust.created_by_code || previewCust.staff_code || 'N/A'}</div>
            </div>

            {/* Preview Box */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-100 p-3 border-b border-slate-200 text-xs">
                <div className="font-semibold text-slate-800 line-clamp-2">
                  <strong>Subject:</strong> {getInterpolatedText(subject, previewCust) || '(No Subject)'}
                </div>
              </div>
              <div 
                className="p-4 bg-white max-h-96 overflow-y-auto text-xs"
                dangerouslySetInnerHTML={{ __html: getInterpolatedText(bodyHtml, previewCust) || '<p class="text-slate-400 italic text-center py-6">Mail content preview will render here...</p>' }}
              />
            </div>
          </div>
        </div>
      </form>

      {/* Customer Selection Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Select Customers for Bulk Email</h3>
                  <p className="text-xs text-slate-500">Pick individual or multiple customers with pre-loaded details & dynamic fields.</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Controls & Filters */}
            <div className="p-4 bg-white border-b border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative sm:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name, email, institute, city, staff code across all 12,000+ records..."
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Filter by Staff Code (e.g. ST01)..."
                    value={modalStaffFilter === 'all' ? '' : modalStaffFilter}
                    onChange={e => setModalStaffFilter(e.target.value.trim() || 'all')}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-700 bg-white"
                  />
                </div>
              </div>

              {/* Action & Pagination Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={selectPageItemsModal}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition-colors flex items-center"
                  >
                    <CheckSquare className="w-3.5 h-3.5 mr-1" /> Select Page ({allCustomers.filter(c => c.email).length})
                  </button>

                  <button
                    type="button"
                    onClick={selectAllMatchingInCRM}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center ${
                      sendToAllMatching 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 mr-1" /> Target ALL {modalTotal.toLocaleString()} Matching in CRM
                  </button>

                  <button
                    type="button"
                    onClick={deselectAllModal}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-xs transition-colors"
                  >
                    Deselect All
                  </button>
                </div>

                {/* Server Pagination Bar */}
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-500 font-medium">
                    {modalTotal > 0 ? (
                      <>Showing <strong>{((modalPage - 1) * 50) + 1}</strong>-<strong>{Math.min(modalPage * 50, modalTotal)}</strong> of <strong>{modalTotal.toLocaleString()}</strong></>
                    ) : '0 matching'}
                  </span>

                  {modalTotalPages > 1 && (
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => fetchModalCustomers(modalPage - 1)}
                        disabled={modalPage === 1 || modalLoading}
                        className="p-1 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-600" />
                      </button>
                      <span className="font-bold text-slate-700 px-1">{modalPage}/{modalTotalPages}</span>
                      <button
                        type="button"
                        onClick={() => fetchModalCustomers(modalPage + 1)}
                        disabled={modalPage === modalTotalPages || modalLoading}
                        className="p-1 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  )}

                  <div className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    sendToAllMatching ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  }`}>
                    {sendToAllMatching ? `Targeting ALL ${modalTotal.toLocaleString()} Customers` : `Selected: ${selectedCustomers.length}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer List Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {modalLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              ) : allCustomers.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  No customers found matching search criteria in your CRM database.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allCustomers.map(cust => {
                    const isSelected = sendToAllMatching || selectedCustomers.some(sc => sc.id === cust.id);
                    const hasEmail = Boolean(cust.email);

                    return (
                      <div
                        key={cust.id}
                        onClick={() => hasEmail && toggleSelectCustomer(cust)}
                        onMouseEnter={() => setHoveredCustomer(cust)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                          !hasEmail ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed' :
                          isSelected ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs' : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start space-x-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!hasEmail}
                            onChange={() => {}}
                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 text-sm truncate">{cust.name}</span>
                              {cust.created_by_code && (
                                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-600 rounded">
                                  {cust.created_by_code}
                                </span>
                              )}
                            </div>
                            
                            <div className="text-xs text-slate-600 font-mono truncate">{cust.email || '(No Email Registered)'}</div>
                            
                            <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-2 items-center">
                              {cust.institute && <span className="flex items-center"><Building className="w-3 h-3 mr-0.5 text-slate-400" />{cust.institute}</span>}
                              {cust.city && <span className="flex items-center"><MapPin className="w-3 h-3 mr-0.5 text-slate-400" />{cust.city}</span>}
                            </div>

                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {cust.tag1 && <span className="px-2 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">{cust.tag1}</span>}
                              {cust.tag2 && <span className="px-2 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-700 rounded-md border border-purple-100">{cust.tag2}</span>}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-md"
              >
                Apply Selection ({selectedCustomers.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Instant Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Save Content as Template</h3>
            <p className="text-xs text-slate-500">Save this subject and body as a reusable email template for future campaigns.</p>
            
            <form onSubmit={handleSaveAsTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text" required
                  placeholder="e.g. Special Followup 2026"
                  value={saveAsTemplateName}
                  onChange={e => setSaveAsTemplateName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-70 flex items-center"
                >
                  {savingTemplate ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComposeMailPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    }>
      <ComposeMailContent />
    </Suspense>
  );
}
