import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Trash2, Pencil, X, Check } from 'lucide-react';

const EMOJI = { Food:'🍔',Transport:'🚗',Shopping:'🛍️',Bills:'💡',Health:'💊',Entertainment:'🎬',Salary:'💼',Freelance:'💻',Investment:'📈',Education:'📚',Travel:'✈️',Other:'📦' };
const fmt = n => '₹' + Number(n).toLocaleString('en-IN');
const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

export default function TransactionsPage() {
  const [txns, setTxns]           = useState([]);
  const [pagination, setPag]      = useState({ page: 1, pages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(null);

  const [filters, setFilters] = useState({
    type: '', category: '', search: '', startDate: '', endDate: '',
    page: 1, limit: 15, sortBy: 'date', sortOrder: 'desc',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const [res, cats] = await Promise.all([
        api.get('/transactions', { params }),
        api.get('/categories'),
      ]);
      setTxns(res.data.data);
      setPag(res.data.pagination);
      setCategories(cats.data.data);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete ALL transactions? This cannot be undone.')) return;
    try {
      await api.delete('/transactions/bulk');
      toast.success('All transactions cleared');
      load();
    } catch { toast.error('Failed to clear'); }
  };

  const handleEdit = async () => {
    try {
      await api.put(`/transactions/${editing._id}`, editing);
      toast.success('Updated');
      setEditing(null);
      load();
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2>Transactions</h2>
        <button className="btn btn-danger btn-sm" onClick={handleClearAll}>🗑 Clear All</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-row" style={{ flexWrap: 'wrap', gap: 10 }}>
          <input className="form-input" placeholder="Search…" value={filters.search} onChange={e => setFilter('search', e.target.value)} style={{ flex: '1 1 180px' }} />
          <select className="form-select" value={filters.type} onChange={e => setFilter('type', e.target.value)} style={{ flex: '1 1 130px' }}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="form-select" value={filters.category} onChange={e => setFilter('category', e.target.value)} style={{ flex: '1 1 150px' }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c.name}>{c.emoji} {c.name}</option>)}
          </select>
          <input className="form-input" type="date" value={filters.startDate} onChange={e => setFilter('startDate', e.target.value)} style={{ flex: '1 1 140px' }} />
          <input className="form-input" type="date" value={filters.endDate} onChange={e => setFilter('endDate', e.target.value)} style={{ flex: '1 1 140px' }} />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : txns.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">💸</div><p>No transactions found</p></div></td></tr>
              ) : txns.map(t => (
                <tr key={t._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{EMOJI[t.category] || '📦'}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{t.description}</div>
                        {t.notes && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.notes}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-user">{t.category}</span></td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{fmtDate(t.date)}</td>
                  <td><span className={`badge badge-${t.type}`}>{t.type}</span></td>
                  <td><span className={`txn-amount ${t.type}`}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditing({ ...t })} title="Edit"><Pencil size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t._id)} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination" style={{ padding: '1rem' }}>
            <button className="page-btn" disabled={filters.page <= 1} onClick={() => setFilter('page', filters.page - 1)}>‹</button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).slice(
              Math.max(0, filters.page - 3), Math.min(pagination.pages, filters.page + 2)
            ).map(p => (
              <button key={p} className={`page-btn ${p === filters.page ? 'active' : ''}`} onClick={() => setFilter('page', p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={filters.page >= pagination.pages} onClick={() => setFilter('page', filters.page + 1)}>›</button>
            <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 8 }}>
              {pagination.total} total
            </span>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Transaction</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><X size={20} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={editing.description} onChange={e => setEditing(v => ({ ...v, description: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input className="form-input" type="number" min="0.01" step="0.01" value={editing.amount} onChange={e => setEditing(v => ({ ...v, amount: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={editing.type} onChange={e => setEditing(v => ({ ...v, type: e.target.value }))}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={editing.category} onChange={e => setEditing(v => ({ ...v, category: e.target.value }))}>
                  {categories.map(c => <option key={c._id} value={c.name}>{c.emoji} {c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={editing.date?.split('T')[0]} onChange={e => setEditing(v => ({ ...v, date: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" placeholder="Optional notes…" value={editing.notes || ''} onChange={e => setEditing(v => ({ ...v, notes: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEdit}><Check size={16} /> Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
