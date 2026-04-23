import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS  = ['#10b981','#3b82f6','#f59e0b','#e11d48','#8b5cf6','#f97316','#06b6d4','#64748b','#ec4899','#14b8a6','#84cc16','#6366f1'];
const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

export default function AnalyticsPage() {
  const year = new Date().getFullYear();
  const [trend,    setTrend]    = useState([]);
  const [catExp,   setCatExp]   = useState([]);
  const [catInc,   setCatInc]   = useState([]);
  const [summary,  setSummary]  = useState({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/analytics/monthly-trend?year=${year}`),
      api.get('/analytics/by-category?type=expense'),
      api.get('/analytics/by-category?type=income'),
      api.get('/analytics/summary'),
    ]).then(([t, ce, ci, s]) => {
      setTrend(t.data.data.map(m => ({ ...m, name: MONTHS[m.month - 1] })));
      setCatExp(ce.data.data);
      setCatInc(ci.data.data);
      setSummary(s.data.data);
    }).catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="loading-screen" style={{ minHeight: 400 }}><div className="spinner" /></div>;

  const savingsRate = summary.totalIncome > 0
    ? (((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100).toFixed(1)
    : 0;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Analytics</h2>

      {/* KPI row */}
      <div className="summary-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Income',   value: fmt(summary.totalIncome),   cls: 'income',  icon: '↑' },
          { label: 'Total Expenses', value: fmt(summary.totalExpense),  cls: 'expense', icon: '↓' },
          { label: 'Net Balance',    value: fmt(summary.balance),       cls: 'balance', icon: '◈' },
          { label: 'Savings Rate',   value: `${savingsRate}%`,          cls: 'users',   icon: '💾' },
        ].map(k => (
          <div key={k.label} className="summary-card">
            <div className={`summary-icon ${k.cls}`}>{k.icon}</div>
            <div>
              <div className="summary-label">{k.label}</div>
              <div className={`summary-value ${k.cls}`}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly trend */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>Income vs Expense — {year}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1ece2" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b9b87' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6b9b87' }} tickFormatter={v => '₹'+(v>=1000?(v/1000).toFixed(0)+'k':v)} />
            <Tooltip formatter={v => fmt(v)} />
            <Legend />
            <Bar dataKey="income"  fill="#10b981" radius={[4,4,0,0]} name="Income" />
            <Bar dataKey="expense" fill="#e11d48" radius={[4,4,0,0]} name="Expense" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Balance line */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>Monthly Balance</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1ece2" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b9b87' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6b9b87' }} tickFormatter={v => '₹'+(v>=1000?(v/1000).toFixed(0)+'k':v)} />
            <Tooltip formatter={v => fmt(v)} />
            <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} name="Balance" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Expense by Category</h3>
          {catExp.length === 0 ? <div className="empty-state"><p>No expense data</p></div> : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={catExp} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, percentage }) => `${category} ${percentage}%`} labelLine={false}>
                    {catExp.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {catExp.map((c, i) => (
                  <span key={c.category} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                    {c.category} — {fmt(c.total)}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Income by Category</h3>
          {catInc.length === 0 ? <div className="empty-state"><p>No income data</p></div> : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={catInc} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, percentage }) => `${category} ${percentage}%`} labelLine={false}>
                    {catInc.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {catInc.map((c, i) => (
                  <span key={c.category} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                    {c.category} — {fmt(c.total)}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
