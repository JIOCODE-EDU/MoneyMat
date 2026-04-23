import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const statusIcon = (s) => {
  if (s === 'completed') return <CheckCircle size={16} color="#059669" />;
  if (s === 'failed')    return <AlertCircle size={16} color="#e11d48" />;
  return <Clock size={16} color="#f59e0b" />;
};

export default function StatementsPage() {
  const [statements, setStatements] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [dragOver, setDragOver]     = useState(false);
  const fileRef = useRef();

  const load = async () => {
    try {
      const res = await api.get('/statements');
      setStatements(res.data.data);
    } catch { toast.error('Failed to load statements'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Only CSV files are supported');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      await api.post('/statements/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Statement uploaded and processing…');
      setTimeout(load, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const exportPDF = async () => {
    try {
      const res = await api.get('/statements/export/pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement('a');
      a.href = url; a.download = `moneymate-statement-${Date.now()}.pdf`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch { toast.error('PDF export failed'); }
  };

  const exportCSV = async () => {
    try {
      const res = await api.get('/statements/export/csv', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement('a');
      a.href = url; a.download = `moneymate-export-${Date.now()}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch { toast.error('CSV export failed'); }
  };

  const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2>Statements</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportPDF}>
            <FileText size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* Upload area */}
      <div
        className={`upload-area card ${dragOver ? 'drag-over' : ''}`}
        style={{ marginBottom: '1.5rem', cursor: uploading ? 'default' : 'pointer' }}
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault(); setDragOver(false);
          handleUpload(e.dataTransfer.files[0]);
        }}
      >
        <input
          ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files[0])}
        />
        <div className="upload-icon">{uploading ? '⏳' : '📂'}</div>
        <div className="upload-text">
          {uploading ? 'Uploading…' : 'Drop your bank statement CSV here'}
        </div>
        <div className="upload-sub">
          or click to browse — supports CSV format with columns: date, description, amount, type, category
        </div>
      </div>

      {/* CSV format guide */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#f0fdf8' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: 15 }}>📋 Expected CSV Format</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>date</th><th>description</th><th>amount</th><th>type</th><th>category</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2024-01-15</td><td>Grocery Store</td><td>850</td><td>expense</td><td>Food</td>
              </tr>
              <tr>
                <td>2024-01-20</td><td>Monthly Salary</td><td>50000</td><td>income</td><td>Salary</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Statement history */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1.5px solid var(--border)' }}>
          <h3>Upload History</h3>
        </div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : statements.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📂</div><p>No statements uploaded yet</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>File</th><th>Status</th><th>Records</th><th>Imported</th><th>Income</th><th>Expense</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {statements.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.originalName}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{(s.fileSize / 1024).toFixed(1)} KB</div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        {statusIcon(s.status)} {s.status}
                      </span>
                    </td>
                    <td>{s.totalRecords}</td>
                    <td>
                      <span style={{ color: 'var(--income)', fontWeight: 600 }}>{s.importedRecords}</span>
                      {s.skippedRecords > 0 && <span style={{ color: 'var(--expense)', fontSize: 11 }}> ({s.skippedRecords} skipped)</span>}
                    </td>
                    <td style={{ color: 'var(--income)', fontWeight: 600 }}>{fmt(s.totalIncome)}</td>
                    <td style={{ color: 'var(--expense)', fontWeight: 600 }}>{fmt(s.totalExpense)}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
