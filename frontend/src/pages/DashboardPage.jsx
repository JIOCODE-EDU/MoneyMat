import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../utils/api';
import toast from 'react-hot-toast';

const EMOJI = { Food:'🍔',Transport:'🚗',Shopping:'🛍️',Bills:'💡',Health:'💊',Entertainment:'🎬',Salary:'💼',Freelance:'💻',Investment:'📈',Education:'📚',Travel:'✈️',Other:'📦' };
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function fmtDate(d) { return new Date(d+'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }

export default function DashboardPage() {
  const [summary, setSummary]     = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [breakdown, setBreakdown] = useState([]);
  const [trend, setTrend]         = useState([]);
  const [recent, setRecent]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    description: '', amount: '', category: 'Food', type: 'expense', date: today,
  });

  const load = useCallback(async () => {
    try {
      const [s, b, t, r, cats] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/by-category?type=expense'),
        api.get(`/analytics/monthly-trend?year=${new Date().getFullYear()}`),
        api.get('/analytics/recent'),
        api.get('/categories'),
      ]);
      setSummary(s.data.data);
      setBreakdown(b.data.data);
      setTrend(t.data.data.map(m => ({ ...m, name: MONTHS[m.month - 1] })));
      setRecent(r.data.data);
      setCategories(cats.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/transactions', {
        ...form,
        amount: parseFloat(form.amount),
      });
      toast.success('Transaction added!');
      setForm({ description: '', amount: '', category: 'Food', type: 'expense', date: today });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  if (loading) return <div className="loading-screen" style={{ minHeight: 400 }}><div className="spinner" /></div>;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Dashboard</h2>

      {/* Summary cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon income">↑</div>
          <div>
            <div className="summary-label">Total Income</div>
            <div className="summary-value income">{fmt(summary.totalIncome)}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon expense">↓</div>
          <div>
            <div className="summary-label">Total Expenses</div>
            <div className="summary-value expense">{fmt(summary.totalExpense)}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon balance">◈</div>
          <div>
            <div className="summary-label">Balance</div>
            <div className="summary-value balance">{fmt(summary.balance)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Add transaction */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Add Transaction</h3>
          <form onSubmit={handleAdd}>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                <input className="form-input" placeholder="Description" value={form.description} onChange={set('description')} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <input className="form-input" type="number" placeholder="Amount ₹" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} required />
              </div>
            </div>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <select className="form-select" value={form.category} onChange={set('category')}>
                {categories.map(c => <option key={c._id} value={c.name}>{c.emoji} {c.name}</option>)}
              </select>
              <select className="form-select" value={form.type} onChange={set('type')}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input className="form-input" type="date" value={form.date} onChange={set('date')} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
              {submitting ? 'Adding…' : '+ Add Transaction'}
            </button>
          </form>
        </div>

        {/* Spending breakdown */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Spending by Category</h3>
          {breakdown.length === 0 ? (
            <div className="empty-state"><p>No expenses yet.</p></div>
          ) : (
            breakdown.map(b => (
              <div key={b.category} className="breakdown-item">
                <span className="b-label">{EMOJI[b.category] || '📦'} {b.category}</span>
                <div className="b-bar-wrap">
                  <div className="b-bar" style={{ width: `${b.percentage}%` }} />
                </div>
                <span className="b-amount">{fmt(b.total)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Monthly trend chart */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Monthly Trend ({new Date().getFullYear()})</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1ece2" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b9b87' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b9b87' }} tickFormatter={v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'k' : v)} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="income"  fill="#10b981" radius={[4,4,0,0]} name="Income" />
                <Bar dataKey="expense" fill="#e11d48" radius={[4,4,0,0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Recent</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.length === 0 ? (
              <div className="empty-state"><p>No transactions yet.</p></div>
            ) : recent.slice(0, 6).map(t => (
              <div key={t._id} className="txn-item" style={{ padding: '10px 12px' }}>
                <div className="txn-left">
                  <div className="txn-emoji">{EMOJI[t.category] || '📦'}</div>
                  <div>
                    <div className="txn-desc" style={{ maxWidth: 120 }}>{t.description}</div>
                    <div className="txn-meta">{fmtDate(t.date.split('T')[0])}</div>
                  </div>
                </div>
                <span className={`txn-amount ${t.type}`} style={{ fontSize: 14 }}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
