'use client';

import { useState } from 'react';
import { fetchApi } from '@/lib/api';
import { UploadCloud, CheckCircle, AlertCircle, XCircle, FileSpreadsheet, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [commitSuccess, setCommitSuccess] = useState(false);
  
  const [duplicatesModalOpen, setDuplicatesModalOpen] = useState(false);
  const [internalDuplicateGroups, setInternalDuplicateGroups] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewData(null);
      setError('');
      setCommitSuccess(false);
      setInternalDuplicateGroups([]);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetchApi('/import/preview', {
        method: 'POST',
        body: formData
      });
      
      if (res.success) {
        const rows = res.data;
        
        // Find internal duplicates in the Excel file
        const eMap = {};
        const mMap = {};
        rows.forEach(r => {
           if(r.email) {
              const e = r.email.toLowerCase().trim();
              if(!eMap[e]) eMap[e] = [];
              eMap[e].push(r);
           }
           if(r.mobile) {
              const m = r.mobile.replace(/\D/g, '');
              if(!mMap[m]) mMap[m] = [];
              mMap[m].push(r);
           }
        });
        
        let groups = [];
        const seenRows = new Set();
        Object.values(eMap).forEach(arr => {
           if(arr.length > 1) {
              const g = arr.filter(r => !seenRows.has(r.rowNumber));
              if(g.length > 1) {
                 groups.push(g);
                 g.forEach(r => seenRows.add(r.rowNumber));
              }
           }
        });
        Object.values(mMap).forEach(arr => {
           if(arr.length > 1) {
              const g = arr.filter(r => !seenRows.has(r.rowNumber));
              if(g.length > 1) {
                 groups.push(g);
                 g.forEach(r => seenRows.add(r.rowNumber));
              }
           }
        });

        if (groups.length > 0) {
           setInternalDuplicateGroups(groups);
           setDuplicatesModalOpen(true);
        }

        setPreviewData(rows);
      } else {
        setError(res.error?.message || 'Failed to parse file');
      }
    } catch (err) {
      setError('Network error or server unreachable');
    }
    setLoading(false);
  };

  const handleResolveGroup = (groupIndex, selectedRowNumber) => {
    const group = internalDuplicateGroups[groupIndex];
    const rejectedRows = group.filter(r => r.rowNumber !== selectedRowNumber).map(r => r.rowNumber);
    
    const newData = previewData.filter(r => !rejectedRows.includes(r.rowNumber));
    setPreviewData(newData);
    
    const newGroups = [...internalDuplicateGroups];
    newGroups.splice(groupIndex, 1);
    setInternalDuplicateGroups(newGroups);
    
    if (newGroups.length === 0) {
        setDuplicatesModalOpen(false);
    }
  };

  const handleCommit = async () => {
    setLoading(true);
    setError('');

    // Commit both VALID and EXACT_DUPLICATE (backend skips existing user update and adds remark)
    const committableRows = previewData.filter(row => row.status === 'VALID' || row.status === 'EXACT_DUPLICATE');

    if (committableRows.length === 0) {
      setError('No valid rows to commit.');
      setLoading(false);
      return;
    }

    const res = await fetchApi('/import/commit', {
      method: 'POST',
      body: JSON.stringify({ rows: committableRows })
    });

    setLoading(false);

    if (res.success) {
      setCommitSuccess(true);
      const remaining = previewData.filter(row => row.status !== 'VALID' && row.status !== 'EXACT_DUPLICATE');
      if (remaining.length === 0) {
        setPreviewData(null);
        setFile(null);
      } else {
        setPreviewData(remaining);
      }
    } else {
      setError(res.error?.message || 'Commit failed');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'VALID': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1"/> Valid</span>;
      case 'EXACT_DUPLICATE': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"><AlertCircle className="w-3 h-3 mr-1"/> DB Exists (Will Append Remark)</span>;
      case 'FUZZY_DUPLICATE': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800"><AlertCircle className="w-3 h-3 mr-1"/> Fuzzy Dupe</span>;
      case 'INVALID': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800"><XCircle className="w-3 h-3 mr-1"/> Invalid</span>;
      default: return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-rose-100 text-rose-800"><AlertCircle className="w-3 h-3 mr-1"/> Error</span>;
    }
  };

  const committableCount = previewData ? previewData.filter(r => r.status === 'VALID' || r.status === 'EXACT_DUPLICATE').length : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bulk Import Customer Data</h1>
        <p className="text-sm text-slate-500 mt-1">Upload an Excel (.xlsx) file to batch import Customer Data into RESOL CRM.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {commitSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 flex items-start">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-emerald-800">Import Successful</h3>
            <p className="text-sm">The batch has been successfully processed.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div className="space-y-1 text-sm text-slate-600">
            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
              <span>Upload a file</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".xlsx" onChange={handleFileChange} />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-slate-500">Excel (.xlsx) up to 10MB</p>
          <p className="text-xs text-indigo-600 font-medium">Supported Columns: Name, Email, Mobile, ISD Code (+91), City, State, Designation, Institute, Department, Region, Remark</p>
        </div>

        {file && (
          <div className="mt-6 flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 text-left">
            <div className="flex items-center">
              <FileSpreadsheet className="w-8 h-8 text-emerald-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            {!previewData && (
              <button 
                onClick={handlePreview} 
                disabled={loading}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                Preview Data
              </button>
            )}
          </div>
        )}
      </div>

      {previewData && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Preview Import</h3>
              <p className="text-xs text-slate-500 mt-1">Review the data before committing. DB Exists will just append remarks safely.</p>
            </div>
            <div className="flex space-x-3">
              {internalDuplicateGroups.length > 0 ? (
                <button
                  onClick={() => setDuplicatesModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors animate-pulse"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Resolve Internal Duplicates
                </button>
              ) : (
                <button 
                  onClick={handleCommit} 
                  disabled={loading || committableCount === 0}
                  className="flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Commit All Rows ({committableCount})
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Row</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ISD Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {previewData.map((row, idx) => (
                  <tr key={idx} className={row.status === 'INVALID' ? 'bg-slate-50/50' : 'hover:bg-slate-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{row.rowNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(row.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{row.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{row.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{row.country_code || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{row.mobile}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Internal Duplicates Review Modal */}
      {duplicatesModalOpen && internalDuplicateGroups.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">Resolve Internal Excel Duplicates</h3>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <p className="text-sm text-slate-600 mb-4">
                The uploaded Excel file contains multiple rows with the exact same Email or Mobile number. You must accept exactly ONE row from this group to keep in the batch.
              </p>
              <div className="space-y-4">
                {internalDuplicateGroups[0].map(row => (
                  <div key={row.rowNumber} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-900">{row.name} <span className="text-xs text-slate-500 font-normal ml-2">Row {row.rowNumber}</span></h4>
                      <p className="text-sm text-slate-600 mt-1">Email: {row.email} | Mobile: {row.mobile}</p>
                      <p className="text-xs text-slate-500 mt-1">Institute: {row.institute || 'N/A'}</p>
                      {row.remark && <p className="text-xs text-amber-600 mt-1">Remark: {row.remark}</p>}
                    </div>
                    <div className="flex space-x-2 shrink-0">
                      <button onClick={() => handleResolveGroup(0, row.rowNumber)} className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-medium flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" /> Accept This Row
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
