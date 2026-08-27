'use client';

import { useState } from 'react';
import { fetchApi } from '@/lib/api';
import { UploadCloud, CheckCircle, AlertCircle, XCircle, FileSpreadsheet, Loader2, ChevronLeft, ChevronRight, Layers, Database, Filter } from 'lucide-react';

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [commitResult, setCommitResult] = useState(null);
  
  // Pagination & Table Filter State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filterStatus, setFilterStatus] = useState('all');

  const [duplicatesModalOpen, setDuplicatesModalOpen] = useState(false);
  const [internalDuplicateGroups, setInternalDuplicateGroups] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewData(null);
      setSummaryData(null);
      setError('');
      setCommitResult(null);
      setInternalDuplicateGroups([]);
      setCurrentPage(1);
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
        let rows = [];
        let summary = null;
        if (res.data && Array.isArray(res.data.rows)) {
          rows = res.data.rows;
          summary = res.data.summary;
        } else if (Array.isArray(res.data)) {
          rows = res.data;
        }

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
        setSummaryData(summary || {
          totalRows: rows.length,
          validCount: rows.filter(r => r.status === 'VALID').length,
          exactDuplicateCount: rows.filter(r => r.status === 'EXACT_DUPLICATE').length,
          invalidCount: rows.filter(r => r.status === 'INVALID').length,
          executionTimeMs: 0
        });
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

    // Commit both VALID and EXACT_DUPLICATE
    const committableRows = previewData.filter(row => row.status === 'VALID' || row.status === 'EXACT_DUPLICATE');

    if (committableRows.length === 0) {
      setError('No valid rows to commit.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetchApi('/import/commit', {
        method: 'POST',
        body: JSON.stringify({ rows: committableRows })
      });

      setLoading(false);

      if (res.success) {
        setCommitResult(res.data || { count: committableRows.length });
        const remaining = previewData.filter(row => row.status !== 'VALID' && row.status !== 'EXACT_DUPLICATE');
        if (remaining.length === 0) {
          setPreviewData(null);
          setFile(null);
          setSummaryData(null);
        } else {
          setPreviewData(remaining);
        }
      } else {
        setError(res.error?.message || 'Commit failed');
      }
    } catch (err) {
      setLoading(false);
      setError('Bulk commit error or connection lost during import');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'VALID': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1"/> Valid</span>;
      case 'EXACT_DUPLICATE': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"><AlertCircle className="w-3 h-3 mr-1"/> DB Exists (Append Remark)</span>;
      case 'FUZZY_DUPLICATE': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"><AlertCircle className="w-3 h-3 mr-1"/> Fuzzy Dupe</span>;
      case 'INVALID': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800"><XCircle className="w-3 h-3 mr-1"/> Invalid</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800"><AlertCircle className="w-3 h-3 mr-1"/> Error</span>;
    }
  };

  const committableCount = previewData ? previewData.filter(r => r.status === 'VALID' || r.status === 'EXACT_DUPLICATE').length : 0;

  // Filtered and paginated preview rows for lag-free DOM rendering
  const filteredPreviewData = (previewData || []).filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const totalPages = Math.ceil(filteredPreviewData.length / pageSize) || 1;
  const currentPaginatedRows = filteredPreviewData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bulk Import Customer Data (1 Lakh Capability)</h1>
        <p className="text-sm text-slate-500 mt-1">Upload large Excel (.xlsx) files up to 100,000 records at once into RESOL CRM.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {commitResult && (
        <div className="p-5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 flex items-start space-x-3">
          <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-emerald-900 text-base">Bulk Import Successfully Completed</h3>
            <p className="text-sm text-emerald-700">
              Processed <strong className="font-bold">{commitResult.totalProcessed || commitResult.count}</strong> records: 
              inserted <strong className="font-bold">{commitResult.count}</strong> new contacts into database 
              {commitResult.skippedCount > 0 && <span> (skipped {commitResult.skippedCount} existing duplicates)</span>} 
              {commitResult.timeMs > 0 && <span> in { (commitResult.timeMs / 1000).toFixed(2) }s</span>}.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shadow-xs">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div className="space-y-1 text-sm text-slate-600">
            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
              <span>Select Excel File (.xlsx)</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".xlsx" onChange={handleFileChange} />
            </label>
            <p className="text-xs text-slate-400">or drag and drop here</p>
          </div>
          <p className="text-xs text-slate-500 font-medium">Supports up to 100,000 (1 Lakh) rows per file (up to 100MB)</p>
          <p className="text-xs text-indigo-600">Columns: Name, Email, Mobile, ISD Code (+91), City, State, Designation, Institute, Department, Country, Status, Tag 1, Tag 2, Remark</p>
        </div>

        {file && (
          <div className="mt-6 flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 text-left">
            <div className="flex items-center">
              <FileSpreadsheet className="w-8 h-8 text-emerald-600 mr-3" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            {!previewData && (
              <button 
                onClick={handlePreview} 
                disabled={loading}
                className="flex items-center px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70 shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                {loading ? 'Processing File...' : 'Parse & Preview Batch'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards Section */}
      {summaryData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Rows</span>
              <Layers className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{summaryData.totalRows.toLocaleString()}</p>
            {summaryData.executionTimeMs > 0 && (
              <p className="text-[11px] text-slate-400 mt-1">Parsed in {summaryData.executionTimeMs}ms</p>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Valid Records</span>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-900 mt-2">{summaryData.validCount.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-600 mt-1">Ready for database insertion</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">DB / File Duplicates</span>
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-2">{summaryData.exactDuplicateCount.toLocaleString()}</p>
            <p className="text-[11px] text-blue-600 mt-1">Will append remarks safely</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Invalid Rows</span>
              <XCircle className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-rose-900 mt-2">{summaryData.invalidCount.toLocaleString()}</p>
            <p className="text-[11px] text-rose-600 mt-1">Missing email & mobile</p>
          </div>
        </div>
      )}

      {/* Preview Table with Pagination */}
      {previewData && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Batch Data Preview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Displaying paginated preview of parsed dataset.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Filter by Status */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses ({previewData.length.toLocaleString()})</option>
                  <option value="VALID">Valid ({summaryData?.validCount || 0})</option>
                  <option value="EXACT_DUPLICATE">Duplicates ({summaryData?.exactDuplicateCount || 0})</option>
                  <option value="INVALID">Invalid ({summaryData?.invalidCount || 0})</option>
                </select>
              </div>

              {internalDuplicateGroups.length > 0 ? (
                <button
                  onClick={() => setDuplicatesModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors animate-pulse"
                >
                  <AlertCircle className="w-4 h-4 mr-1.5" />
                  Resolve Excel Duplicates ({internalDuplicateGroups.length})
                </button>
              ) : (
                <button 
                  onClick={handleCommit} 
                  disabled={loading || committableCount === 0}
                  className="flex items-center px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-emerald-700 shadow-md transition-all transform active:scale-95 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  {loading ? 'Bulk Importing...' : `Commit ${committableCount.toLocaleString()} Records`}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto min-h-[350px]">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Row</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tag 1</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Remark</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {currentPaginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400 text-sm">No records match the selected status filter.</td>
                  </tr>
                ) : (
                  currentPaginatedRows.map((row, idx) => (
                    <tr key={idx} className={row.status === 'INVALID' ? 'bg-slate-50/50' : 'hover:bg-slate-50'}>
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-500 font-mono">{row.rowNumber}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap">{getStatusBadge(row.status)}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-sm font-semibold text-slate-900">{row.name || '-'}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-sm text-slate-600">{row.email || '-'}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-sm text-slate-600 font-mono">{row.country_code ? `${row.country_code} ` : ''}{row.mobile || '-'}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-sm text-slate-500">{row.city || '-'}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-sm text-slate-500">{row.tag1 || '-'}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-400 max-w-xs truncate">{row.remark || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Controls */}
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-semibold text-slate-900">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(currentPage * pageSize, filteredPreviewData.length)}</span> of <span className="font-semibold text-slate-900">{filteredPreviewData.length.toLocaleString()}</span> rows
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }}
                className="text-xs font-semibold border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-700"
              >
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-700 px-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal Duplicates Review Modal */}
      {duplicatesModalOpen && internalDuplicateGroups.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Resolve Internal Excel Duplicates</h3>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <p className="text-sm text-slate-600 mb-4">
                The uploaded file contains multiple rows with the exact same Email or Mobile number. Select ONE row to keep in the batch.
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
