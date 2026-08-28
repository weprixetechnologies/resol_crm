'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { 
  FileText, Plus, Edit, Trash2, Copy, Send, Eye, Code, Layout, 
  Sparkles, Check, Loader2, ArrowLeft, Monitor, Smartphone, Tag, RefreshCw,
  MoveUp, MoveDown, Layers, MousePointer, Settings, ChevronRight
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

const DEFAULT_BLOCKS = [
  {
    id: 'block-1',
    type: 'header',
    title: 'Welcome Aboard!',
    subtitle: 'Official Notification',
    bgColor: '#4f46e5',
    textColor: '#ffffff'
  },
  {
    id: 'block-2',
    type: 'heading',
    text: 'Hello {{name}},',
    size: '18px',
    color: '#1e293b',
    align: 'left'
  },
  {
    id: 'block-3',
    type: 'text',
    content: 'We are thrilled to welcome you from {{institute}} ({{city}}). Your registered details have been assigned under Staff Code: {{staff_code}}.'
  },
  {
    id: 'block-4',
    type: 'callout',
    title: 'Tag Reference: {{tag1}}',
    content: 'Special updates crafted for {{city}} region customers.',
    bgColor: '#f0f9ff',
    borderLeftColor: '#0284c7'
  },
  {
    id: 'block-5',
    type: 'button',
    text: 'Access Customer Portal',
    url: 'https://example.com',
    bgColor: '#4f46e5',
    textColor: '#ffffff',
    align: 'center'
  },
  {
    id: 'block-6',
    type: 'divider'
  },
  {
    id: 'block-7',
    type: 'footer',
    content: 'Sent via RESOL CRM • Managed by Staff {{staff_code}}',
    textColor: '#94a3b8'
  }
];

const PRESET_TEMPLATES = [
  {
    name: 'Welcome & Onboarding',
    subject: 'Welcome to RESOL CRM, {{name}}!',
    blocks: DEFAULT_BLOCKS
  },
  {
    name: 'Product & Service Announcement',
    subject: 'Important Announcement for {{designation}} {{name}}',
    blocks: [
      { id: 'b1', type: 'header', title: 'Official Announcement', subtitle: 'Customer Relations', bgColor: '#0369a1', textColor: '#ffffff' },
      { id: 'b2', type: 'heading', text: 'Dear {{name}},', size: '18px', color: '#0f172a', align: 'left' },
      { id: 'b3', type: 'text', content: 'As a valued {{designation}} at {{department}} ({{city}}), we are pleased to update you regarding our latest CRM initiatives.' },
      { id: 'b4', type: 'callout', title: 'Special Notice', content: 'Updates active for {{tag1}} in {{city}} region.', bgColor: '#f0f9ff', borderLeftColor: '#0284c7' },
      { id: 'b5', type: 'footer', content: 'Best regards, Customer Relations Team', textColor: '#64748b' }
    ]
  },
  {
    name: 'Follow-up Notice',
    subject: 'Follow-up regarding your request - {{name}}',
    blocks: [
      { id: 'f1', type: 'heading', text: 'Follow-Up Reminder for {{name}}', size: '20px', color: '#0f172a', align: 'left' },
      { id: 'f2', type: 'text', content: 'Following up on our recent communications regarding {{institute}}. Please confirm if you require further assistance or documentation sent to {{email}}.' },
      { id: 'f3', type: 'button', text: 'Reply Now', url: 'mailto:support@example.com', bgColor: '#10b981', textColor: '#ffffff', align: 'left' },
      { id: 'f4', type: 'divider' },
      { id: 'f5', type: 'footer', content: 'RESOL CRM Auto-Reminder', textColor: '#94a3b8' }
    ]
  }
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  // Editor Form State
  const [form, setForm] = useState({ name: '', subject: '', body_html: '' });
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [selectedBlockId, setSelectedBlockId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('visual'); // 'visual', 'code', 'preview'
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop', 'mobile'

  const [syncingId, setSyncingId] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [msg91LiveModal, setMsg91LiveModal] = useState(false);
  const [msg91LiveTemplates, setMsg91LiveTemplates] = useState([]);
  const [msg91LiveLoading, setMsg91LiveLoading] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    const res = await fetchApi('/mail/templates');
    if (res.success) {
      setTemplates(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSyncTemplate = async (id) => {
    setSyncingId(id);
    const res = await fetchApi(`/mail/templates/${id}/sync-msg91`, { method: 'POST' });
    setSyncingId(null);
    if (res.success) {
      alert(`Template #${id} successfully synced to MSG91!\nMSG91 Slug: "${res.data?.msg91_slug || res.data?.msg91_template_id}"`);
      loadTemplates();
    } else {
      alert(`Sync failed: ${res.error?.message || 'Unknown error'}`);
    }
  };

  const handleSyncAllTemplates = async () => {
    setSyncingAll(true);
    const res = await fetchApi('/mail/templates/sync-all-msg91', { method: 'POST' });
    setSyncingAll(false);
    if (res.success) {
      alert(`Batch sync to MSG91 complete!\nSynced: ${Array.isArray(res.data) ? res.data.filter(r => r.status === 'synced').length : 0} templates.`);
      loadTemplates();
    } else {
      alert(`Batch sync failed: ${res.error?.message || 'Unknown error'}`);
    }
  };

  const openMsg91LiveModal = async () => {
    setMsg91LiveModal(true);
    setMsg91LiveLoading(true);
    const res = await fetchApi('/mail/templates/msg91-live');
    setMsg91LiveLoading(false);
    if (res.success && Array.isArray(res.data?.templates)) {
      setMsg91LiveTemplates(res.data.templates);
    } else if (res.success && Array.isArray(res.data)) {
      setMsg91LiveTemplates(res.data);
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      setMsg91LiveTemplates(res.data.data);
    } else {
      setMsg91LiveTemplates([]);
    }
  };

  const compileBlocksToHtml = (blocksArr) => {
    if (!blocksArr || blocksArr.length === 0) return '';
    let html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">\n`;
    
    blocksArr.forEach(b => {
      switch (b.type) {
        case 'header':
          html += `  <div style="background-color: ${b.bgColor || '#4f46e5'}; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; margin-bottom: 20px;">\n`;
          html += `    <h1 style="color: ${b.textColor || '#ffffff'}; margin: 0; font-size: 24px;">${b.title || 'Header Title'}</h1>\n`;
          if (b.subtitle) html += `    <p style="color: ${b.textColor || '#ffffff'}; margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">${b.subtitle}</p>\n`;
          html += `  </div>\n`;
          break;

        case 'heading':
          html += `  <h2 style="color: ${b.color || '#1e293b'}; text-align: ${b.align || 'left'}; font-size: ${b.size || '20px'}; margin: 15px 0;">${b.text || 'Heading'}</h2>\n`;
          break;

        case 'text':
          html += `  <p style="color: #475569; line-height: 1.6; font-size: 14px; margin: 12px 0;">${(b.content || '').replace(/\n/g, '<br/>')}</p>\n`;
          break;

        case 'button':
          html += `  <div style="text-align: ${b.align || 'center'}; margin: 20px 0;">\n`;
          html += `    <a href="${b.url || 'https://example.com'}" style="background-color: ${b.bgColor || '#4f46e5'}; color: ${b.textColor || '#ffffff'}; padding: 12px 26px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 14px;">${b.text || 'Click Here'}</a>\n`;
          html += `  </div>\n`;
          break;

        case 'callout':
          html += `  <div style="background-color: ${b.bgColor || '#f0f9ff'}; border-left: 4px solid ${b.borderLeftColor || '#0284c7'}; padding: 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">\n`;
          if (b.title) html += `    <h4 style="color: ${b.borderLeftColor || '#0284c7'}; margin: 0 0 6px 0; font-size: 15px;">${b.title}</h4>\n`;
          html += `    <p style="color: #334155; margin: 0; font-size: 13px; line-height: 1.5;">${(b.content || '').replace(/\n/g, '<br/>')}</p>\n`;
          html += `  </div>\n`;
          break;

        case 'divider':
          html += `  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />\n`;
          break;

        case 'footer':
          html += `  <p style="color: ${b.textColor || '#94a3b8'}; font-size: 12px; text-align: center; margin: 20px 0 0 0;">${b.content || 'Sent via RESOL CRM'}</p>\n`;
          break;
      }
    });

    html += `</div>`;
    return html;
  };

  // Sync Blocks to body_html
  useEffect(() => {
    if (activeTab === 'visual') {
      const compiled = compileBlocksToHtml(blocks);
      setForm(prev => ({ ...prev, body_html: compiled }));
    }
  }, [blocks, activeTab]);

  const openNewEditor = (preset = null) => {
    setEditingTemplate(null);
    if (preset) {
      const presetBlocks = preset.blocks || DEFAULT_BLOCKS;
      setBlocks(presetBlocks);
      setForm({ name: preset.name, subject: preset.subject, body_html: compileBlocksToHtml(presetBlocks) });
    } else {
      setBlocks(DEFAULT_BLOCKS);
      setForm({ name: '', subject: '', body_html: compileBlocksToHtml(DEFAULT_BLOCKS) });
    }
    setSelectedBlockId(DEFAULT_BLOCKS[0]?.id || null);
    setActiveTab('visual');
    setIsEditorOpen(true);
  };

  const openEditEditor = (tpl) => {
    setEditingTemplate(tpl);
    let parsedBlocks = null;
    try {
      if (tpl.design_json) {
        parsedBlocks = typeof tpl.design_json === 'string' ? JSON.parse(tpl.design_json) : tpl.design_json;
      }
    } catch (e) {
      console.error('Error parsing design_json:', e);
    }

    if (Array.isArray(parsedBlocks) && parsedBlocks.length > 0) {
      setBlocks(parsedBlocks);
      setSelectedBlockId(parsedBlocks[0].id);
      setActiveTab('visual');
    } else {
      setBlocks(DEFAULT_BLOCKS);
      setActiveTab('code');
    }

    setForm({ name: tpl.name, subject: tpl.subject, body_html: tpl.body_html });
    setIsEditorOpen(true);
  };

  const addBlock = (type) => {
    const newId = 'block-' + Date.now();
    let newBlock = { id: newId, type };

    switch (type) {
      case 'header':
        newBlock = { ...newBlock, title: 'Header Title', subtitle: 'Subtitle text', bgColor: '#4f46e5', textColor: '#ffffff' };
        break;
      case 'heading':
        newBlock = { ...newBlock, text: 'New Heading', size: '20px', color: '#1e293b', align: 'left' };
        break;
      case 'text':
        newBlock = { ...newBlock, content: 'Enter text paragraph here. Use dynamic variables like {{name}} or {{institute}}.' };
        break;
      case 'button':
        newBlock = { ...newBlock, text: 'Click Here', url: 'https://example.com', bgColor: '#4f46e5', textColor: '#ffffff', align: 'center' };
        break;
      case 'callout':
        newBlock = { ...newBlock, title: 'Important Highlight', content: 'Special callout text here.', bgColor: '#f0f9ff', borderLeftColor: '#0284c7' };
        break;
      case 'divider':
        break;
      case 'footer':
        newBlock = { ...newBlock, content: 'Sent via RESOL CRM • All rights reserved.', textColor: '#94a3b8' };
        break;
    }

    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newId);
  };

  const updateSelectedBlock = (updatedProps) => {
    setBlocks(prev => prev.map(b => b.id === selectedBlockId ? { ...b, ...updatedProps } : b));
  };

  const moveBlock = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(newIndex, 0, moved);
    setBlocks(newBlocks);
  };

  const duplicateBlock = (block) => {
    const newId = 'block-' + Date.now();
    const cloned = { ...block, id: newId };
    setBlocks(prev => [...prev, cloned]);
    setSelectedBlockId(newId);
  };

  const removeBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const insertTagToBlock = (tagStr) => {
    if (!selectedBlock) return;
    if (selectedBlock.type === 'text') {
      updateSelectedBlock({ content: (selectedBlock.content || '') + ` ${tagStr} ` });
    } else if (selectedBlock.type === 'heading') {
      updateSelectedBlock({ text: (selectedBlock.text || '') + ` ${tagStr} ` });
    } else if (selectedBlock.type === 'header') {
      updateSelectedBlock({ title: (selectedBlock.title || '') + ` ${tagStr} ` });
    } else if (selectedBlock.type === 'callout') {
      updateSelectedBlock({ content: (selectedBlock.content || '') + ` ${tagStr} ` });
    } else if (selectedBlock.type === 'button') {
      updateSelectedBlock({ text: (selectedBlock.text || '') + ` ${tagStr} ` });
    } else if (selectedBlock.type === 'footer') {
      updateSelectedBlock({ content: (selectedBlock.content || '') + ` ${tagStr} ` });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.body_html.trim()) {
      alert('Template Name, Subject, and Content are required.');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      subject: form.subject.trim(),
      body_html: form.body_html,
      design_json: blocks
    };

    let res;
    if (editingTemplate) {
      res = await fetchApi(`/mail/templates/${editingTemplate.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetchApi('/mail/templates', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    setSaving(false);

    if (res.success) {
      setIsEditorOpen(false);
      loadTemplates();
    } else {
      alert(res.error?.message || 'Failed to save email template');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    const res = await fetchApi(`/mail/templates/${id}`, { method: 'DELETE' });
    if (res.success) {
      loadTemplates();
    } else {
      alert(res.error?.message || 'Failed to delete template');
    }
  };

  // Sample Customer Data for Live Preview
  const sampleCustomer = {
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@example.com',
    city: 'Mumbai',
    state: 'Maharashtra',
    institute: 'IIT Bombay',
    department: 'Computer Science & Engineering',
    designation: 'Senior Professor',
    staff_code: 'ST01',
    tag1: 'VIP Academic',
    tag2: 'Conference Speaker'
  };

  const getInterpolatedHtml = (html) => {
    if (!html) return '';
    let result = html;
    Object.keys(sampleCustomer).forEach(key => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
      result = result.replace(regex, sampleCustomer[key]);
    });
    return result;
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Design customized Drag-and-Drop React Email templates for customer communication.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openMsg91LiveModal}
            className="inline-flex items-center px-3.5 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            MSG91 Mapping & Approval Status
          </button>
          <button
            onClick={handleSyncAllTemplates}
            disabled={syncingAll}
            className="inline-flex items-center px-3.5 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50"
          >
            {syncingAll ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Sync All to MSG91
          </button>
          <button
            onClick={() => openNewEditor()}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-xl hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Drag & Drop Builder
          </button>
        </div>
      </div>

      {/* Preset Starter Cards */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-base">Quick Preset Templates</h3>
          </div>
          <span className="text-xs text-indigo-200">Click to customize in Drag & Drop builder</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PRESET_TEMPLATES.map((p, idx) => (
            <div 
              key={idx} 
              onClick={() => openNewEditor(p)}
              className="bg-white/10 hover:bg-white/20 border border-white/10 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
            >
              <h4 className="font-bold text-sm text-white mb-1">{p.name}</h4>
              <p className="text-xs text-indigo-200 line-clamp-2">{p.subject}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Template Grid List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Saved Templates ({templates.length})</h2>
          <span className="text-xs text-slate-500">Synced templates use registered MSG91 slugs automatically</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">No saved custom email templates found.</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Create your first template using our visual Drag & Drop Builder.</p>
            <button
              onClick={() => openNewEditor()}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Launch Drag & Drop Builder
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(tpl => {
              const msg91Slug = tpl.msg91_slug || tpl.msg91_template_id;
              const isSyncing = syncingId === tpl.id;
              return (
                <div key={tpl.id} className="border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-all shadow-xs flex flex-col justify-between bg-white">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        ID #{tpl.id}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(tpl.updated_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-1">{tpl.name}</h3>
                    <p className="text-xs text-slate-500 font-medium mb-2.5 line-clamp-1">Subject: {tpl.subject}</p>

                    {/* MSG91 Mapping Status Badge */}
                    <div className="mb-3">
                      {msg91Slug ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 mr-1" /> MSG91 Slug: {msg91Slug}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          ⚠️ Not Synced to MSG91
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 h-24 overflow-hidden text-[11px] text-slate-600 font-mono mb-4 relative">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 opacity-90 pointer-events-none"></div>
                      {tpl.body_html.replace(/<[^>]*>?/gm, '')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    <button
                      onClick={() => handleSyncTemplate(tpl.id)}
                      disabled={isSyncing}
                      className="inline-flex items-center px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
                      title="Push/Sync Template to MSG91"
                    >
                      {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                      {msg91Slug ? 'Re-Sync' : 'Sync MSG91'}
                    </button>
                    <Link
                      href={`/email/compose?templateId=${tpl.id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors flex-1 justify-center"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" /> Compose
                    </Link>
                    <button
                      onClick={() => openEditEditor(tpl)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Template"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drag & Drop Template Builder Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[94vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    {editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Drag & Drop HTML Email Builder'}
                  </h3>
                  <p className="text-xs text-slate-500">Visual block editor & React Email output.</p>
                </div>
              </div>

              {/* Mode Tabs */}
              <div className="flex items-center bg-slate-200 p-1 rounded-xl space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('visual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center ${activeTab === 'visual' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <MousePointer className="w-3.5 h-3.5 mr-1" /> Visual Builder
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center ${activeTab === 'code' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Code className="w-3.5 h-3.5 mr-1" /> Raw HTML Code
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center ${activeTab === 'preview' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> Live Preview
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              
              {/* Template Title & Subject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Template Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text" required
                    placeholder="e.g. Welcome Onboarding 2026"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Subject Line <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text" required
                    placeholder="e.g. Welcome {{name}} from {{institute}}"
                    value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Tab 1: Visual Drag & Drop Builder */}
              {activeTab === 'visual' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Drag/Add Blocks Palette (3 cols) */}
                  <div className="lg:col-span-3 space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Add Elements</h4>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => addBlock('header')}
                        className="w-full p-2.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-xl text-left text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors shadow-2xs"
                      >
                        <span>🎨 Header Banner</span>
                        <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => addBlock('heading')}
                        className="w-full p-2.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-xl text-left text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors shadow-2xs"
                      >
                        <span>Title / Heading</span>
                        <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => addBlock('text')}
                        className="w-full p-2.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-xl text-left text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors shadow-2xs"
                      >
                        <span>📝 Text Paragraph</span>
                        <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => addBlock('callout')}
                        className="w-full p-2.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-xl text-left text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors shadow-2xs"
                      >
                        <span>📌 Highlight Box</span>
                        <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => addBlock('button')}
                        className="w-full p-2.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-xl text-left text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors shadow-2xs"
                      >
                        <span>🔘 Call-to-Action Button</span>
                        <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => addBlock('divider')}
                        className="w-full p-2.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-xl text-left text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors shadow-2xs"
                      >
                        <span>➖ Divider Line</span>
                        <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => addBlock('footer')}
                        className="w-full p-2.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-xl text-left text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors shadow-2xs"
                      >
                        <span>🏷️ Footer Signature</span>
                        <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Column: Email Layout Stack (5 cols) */}
                  <div className="lg:col-span-5 space-y-3 bg-slate-100 p-4 rounded-2xl border border-slate-200 min-h-[450px]">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
                      <span className="font-bold text-slate-700 uppercase tracking-wider">Email Canvas Blocks ({blocks.length})</span>
                      <span className="text-[11px] text-slate-500">Click block to edit properties</span>
                    </div>

                    {blocks.length === 0 ? (
                      <div className="text-center py-16 text-slate-400 text-xs">
                        Canvas is empty. Add elements from left panel.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {blocks.map((b, idx) => {
                          const isSelected = b.id === selectedBlockId;
                          return (
                            <div
                              key={b.id}
                              onClick={() => setSelectedBlockId(b.id)}
                              className={`p-3 bg-white rounded-xl border transition-all cursor-pointer relative group ${
                                isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {b.type}
                                </span>

                                <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); moveBlock(idx, 'up'); }}
                                    className="p-1 text-slate-400 hover:text-slate-700"
                                    title="Move Up"
                                  >
                                    <MoveUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); moveBlock(idx, 'down'); }}
                                    className="p-1 text-slate-400 hover:text-slate-700"
                                    title="Move Down"
                                  >
                                    <MoveDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); duplicateBlock(b); }}
                                    className="p-1 text-slate-400 hover:text-indigo-600"
                                    title="Duplicate"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeBlock(b.id); }}
                                    className="p-1 text-slate-400 hover:text-rose-600"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Block Preview Content */}
                              <div className="text-xs text-slate-800 font-medium truncate">
                                {b.type === 'header' && (b.title || 'Header')}
                                {b.type === 'heading' && (b.text || 'Heading')}
                                {b.type === 'text' && (b.content || 'Text')}
                                {b.type === 'button' && `[Button: ${b.text || 'Click'}]`}
                                {b.type === 'callout' && (b.title || b.content || 'Highlight')}
                                {b.type === 'divider' && '-------------------------'}
                                {b.type === 'footer' && (b.content || 'Footer')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Inspector & Property Controls (4 cols) */}
                  <div className="lg:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                      <Settings className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Block Properties</h4>
                    </div>

                    {/* Dynamic Tags Chips */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center">
                        <Tag className="w-3 h-3 mr-1 text-indigo-600" /> Insert Variable into Selected Block:
                      </label>
                      <div className="flex flex-wrap gap-1 bg-white p-2 rounded-xl border border-slate-200">
                        {DYNAMIC_TAGS.map(t => (
                          <button
                            key={t.tag}
                            type="button"
                            onClick={() => insertTagToBlock(t.tag)}
                            className="px-1.5 py-0.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded text-[10px] font-mono font-medium text-indigo-700"
                          >
                            + {t.tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {!selectedBlock ? (
                      <div className="text-xs text-slate-400 italic py-8 text-center">Select a block on the middle canvas to edit its properties.</div>
                    ) : (
                      <div className="space-y-3 text-xs">
                        {/* Header Block Properties */}
                        {selectedBlock.type === 'header' && (
                          <>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Banner Title</label>
                              <input
                                type="text"
                                value={selectedBlock.title || ''}
                                onChange={e => updateSelectedBlock({ title: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Subtitle</label>
                              <input
                                type="text"
                                value={selectedBlock.subtitle || ''}
                                onChange={e => updateSelectedBlock({ subtitle: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">Background</label>
                                <input
                                  type="color"
                                  value={selectedBlock.bgColor || '#4f46e5'}
                                  onChange={e => updateSelectedBlock({ bgColor: e.target.value })}
                                  className="w-full h-8 rounded border border-slate-300 cursor-pointer"
                                />
                              </div>
                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">Text Color</label>
                                <input
                                  type="color"
                                  value={selectedBlock.textColor || '#ffffff'}
                                  onChange={e => updateSelectedBlock({ textColor: e.target.value })}
                                  className="w-full h-8 rounded border border-slate-300 cursor-pointer"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Heading Block Properties */}
                        {selectedBlock.type === 'heading' && (
                          <>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Heading Text</label>
                              <input
                                type="text"
                                value={selectedBlock.text || ''}
                                onChange={e => updateSelectedBlock({ text: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">Font Size</label>
                                <select
                                  value={selectedBlock.size || '20px'}
                                  onChange={e => updateSelectedBlock({ size: e.target.value })}
                                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                                >
                                  <option value="16px">Small (16px)</option>
                                  <option value="20px">Medium (20px)</option>
                                  <option value="24px">Large (24px)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">Alignment</label>
                                <select
                                  value={selectedBlock.align || 'left'}
                                  onChange={e => updateSelectedBlock({ align: e.target.value })}
                                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                                >
                                  <option value="left">Left</option>
                                  <option value="center">Center</option>
                                  <option value="right">Right</option>
                                </select>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Text Block Properties */}
                        {selectedBlock.type === 'text' && (
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Paragraph Content</label>
                            <textarea
                              rows={5}
                              value={selectedBlock.content || ''}
                              onChange={e => updateSelectedBlock({ content: e.target.value })}
                              className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                            />
                          </div>
                        )}

                        {/* Callout Properties */}
                        {selectedBlock.type === 'callout' && (
                          <>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Callout Title</label>
                              <input
                                type="text"
                                value={selectedBlock.title || ''}
                                onChange={e => updateSelectedBlock({ title: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Callout Message</label>
                              <textarea
                                rows={3}
                                value={selectedBlock.content || ''}
                                onChange={e => updateSelectedBlock({ content: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">Accent Color</label>
                                <input
                                  type="color"
                                  value={selectedBlock.borderLeftColor || '#0284c7'}
                                  onChange={e => updateSelectedBlock({ borderLeftColor: e.target.value })}
                                  className="w-full h-8 rounded border border-slate-300 cursor-pointer"
                                />
                              </div>
                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">Background</label>
                                <input
                                  type="color"
                                  value={selectedBlock.bgColor || '#f0f9ff'}
                                  onChange={e => updateSelectedBlock({ bgColor: e.target.value })}
                                  className="w-full h-8 rounded border border-slate-300 cursor-pointer"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Button Properties */}
                        {selectedBlock.type === 'button' && (
                          <>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Button Text</label>
                              <input
                                type="text"
                                value={selectedBlock.text || ''}
                                onChange={e => updateSelectedBlock({ text: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Button Link URL</label>
                              <input
                                type="text"
                                value={selectedBlock.url || ''}
                                onChange={e => updateSelectedBlock({ url: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">Button Color</label>
                                <input
                                  type="color"
                                  value={selectedBlock.bgColor || '#4f46e5'}
                                  onChange={e => updateSelectedBlock({ bgColor: e.target.value })}
                                  className="w-full h-8 rounded border border-slate-300 cursor-pointer"
                                />
                              </div>
                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">Alignment</label>
                                <select
                                  value={selectedBlock.align || 'center'}
                                  onChange={e => updateSelectedBlock({ align: e.target.value })}
                                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                                >
                                  <option value="left">Left</option>
                                  <option value="center">Center</option>
                                  <option value="right">Right</option>
                                </select>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Footer Properties */}
                        {selectedBlock.type === 'footer' && (
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Footer Text</label>
                            <input
                              type="text"
                              value={selectedBlock.content || ''}
                              onChange={e => updateSelectedBlock({ content: e.target.value })}
                              className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Raw HTML Editor */}
              {activeTab === 'code' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Body HTML Code <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={14}
                    value={form.body_html}
                    onChange={e => setForm({...form, body_html: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl p-4 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent leading-relaxed"
                  ></textarea>
                </div>
              )}

              {/* Tab 3: Live Desktop/Mobile Preview */}
              {activeTab === 'preview' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-600 font-medium">
                      Simulating preview for sample customer: <span className="font-bold text-indigo-700">{sampleCustomer.name}</span> ({sampleCustomer.institute})
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setPreviewMode('desktop')}
                        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center ${previewMode === 'desktop' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'}`}
                      >
                        <Monitor className="w-4 h-4 mr-1" /> Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('mobile')}
                        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center ${previewMode === 'mobile' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'}`}
                      >
                        <Smartphone className="w-4 h-4 mr-1" /> Mobile
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-200 p-4 rounded-2xl flex justify-center">
                    <div className={`bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden transition-all ${
                      previewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-2xl'
                    }`}>
                      <div className="bg-slate-100 p-3 border-b border-slate-200 text-xs text-slate-600">
                        <div><strong>Subject:</strong> {getInterpolatedHtml(form.subject)}</div>
                        <div className="text-slate-400 mt-0.5"><strong>From:</strong> RESOL CRM &lt;no-reply@example.com&gt;</div>
                      </div>
                      <div 
                        className="p-4" 
                        dangerouslySetInnerHTML={{ __html: getInterpolatedHtml(form.body_html) }} 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide rounded-xl shadow-md transition-all disabled:opacity-70"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MSG91 Template Mapping & Live Approval Status Modal */}
      {msg91LiveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-emerald-500 text-slate-900 rounded-xl flex items-center justify-center font-bold">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">MSG91 Template Mapping & Approval Status</h3>
                  <p className="text-xs text-slate-300">Live verification of CRM templates against MSG91 API</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMsg91LiveModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Table */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-600 font-medium">Total Saved Templates: <strong>{templates.length}</strong></span>
                <button
                  type="button"
                  onClick={openMsg91LiveModal}
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Live Status
                </button>
              </div>

              {msg91LiveLoading ? (
                <div className="flex justify-center items-center h-36">
                  <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3">CRM ID</th>
                        <th className="p-3">Template Name</th>
                        <th className="p-3">Email Subject</th>
                        <th className="p-3">MSG91 Slug / ID</th>
                        <th className="p-3">MSG91 Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(msg91LiveTemplates.length > 0 ? msg91LiveTemplates : templates).map(tpl => {
                        const slug = tpl.msg91_slug || tpl.msg91_template_id;
                        const status = (tpl.msg91_status || tpl.liveStatus || (slug ? 'ACTIVE' : 'NOT_UPLOADED')).toUpperCase();
                        const statusId = tpl.msg91_status_id;
                        const versionId = tpl.msg91_version_id;
                        const reasonId = tpl.reason_id;
                        const isSyncing = syncingId === tpl.id;

                        return (
                          <tr key={tpl.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-mono font-bold text-indigo-700">#{tpl.id}</td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-900">{tpl.name}</div>
                              {versionId && <div className="text-[10px] text-slate-400 font-mono">Version: {versionId}</div>}
                            </td>
                            <td className="p-3 text-slate-500 max-w-[180px] truncate">{tpl.subject}</td>
                            <td className="p-3 font-mono text-slate-700">
                              {slug ? (
                                <div>
                                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold text-xs">{slug}</span>
                                  {tpl.msg91_template_id && (
                                    <div className="text-[10px] text-slate-400 mt-0.5">ID: {String(tpl.msg91_template_id)}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Not Assigned</span>
                              )}
                            </td>
                            <td className="p-3">
                              {status === 'ACTIVE' || status === 'APPROVED' ? (
                                <div>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    ACTIVE ✓
                                  </span>
                                </div>
                              ) : status === 'PENDING' ? (
                                <div>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    PENDING ⏳
                                  </span>
                                  <p className="text-[10px] text-amber-700 mt-0.5">Cannot send until approved.</p>
                                </div>
                              ) : status === 'REJECTED' ? (
                                <div>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                    REJECTED ❌
                                  </span>
                                  {reasonId && <p className="text-[10px] text-rose-700 mt-0.5">Reason: {reasonId}</p>}
                                </div>
                              ) : status === 'DRAFT' ? (
                                <div>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                    DRAFT 📝
                                  </span>
                                  <p className="text-[10px] text-slate-500 mt-0.5">Draft mode.</p>
                                </div>
                              ) : (
                                <div>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                    UNKNOWN
                                  </span>
                                  {statusId !== undefined && statusId !== null && (
                                    <p className="text-[10px] text-purple-700 mt-0.5">MSG91 Status ID: {statusId}</p>
                                  )}
                                  <p className="text-[9px] text-slate-400 mt-0.5">Unable to determine approval state.</p>
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleSyncTemplate(tpl.id)}
                                disabled={isSyncing}
                                className="inline-flex items-center px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 text-xs"
                              >
                                {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                                {slug ? 'Sync MSG91 Status' : 'Upload to MSG91'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setMsg91LiveModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
