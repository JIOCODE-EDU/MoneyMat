import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';

const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

export default function AdminPage() {
  const [stats, setStats]   = useState(null);
  const [users, setUsers]   = useState([]);
  const [pagination, setPag]= useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading]= useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const loadStats = async () => {
    const res = await api.get('/admin/stats');
    setStats(res.data.data);
  };

  const loadUsers = async (p = 1, s = '') => {
    const res = await api.get('/admin/users', { params: { page: p, limit: 15, search: s } });
    setUsers(res.data.data);
    setPag(res.data.pagination);
  };

  useEffect(() => {
    Promise.all([loadStats(), loadUsers()])
      .catch(() => toast.error('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { loadUsers(1, search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await api.put(`/admin/users/${user._id}/role`, { role: newRole });
      toast.success(`${user.name} is now ${newRole}`);
      loadUsers(page, search);
    } catch { toast.error('Failed to update role'); }
  };

  const toggleStatus = async (user) => {
    try {
      await api.put(`/admin/users/${user._id}/status`);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      loadUsers(page, search);
    } catch { toast.error('Failed to update status'); }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name} and all their data?`)) return;
    try {
      await api.delete(`/admin/users/${user._id}`);
      toast.success('User deleted');
      loadUsers(page, search);
      loadStats();
    } catch { toast.error('Failed to delete user'); }
  };

  if (loading) return <div className="loading-screen" style={{ minHeight: 400 }}><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
        <ShieldCheck size={22} color="var(--accent)" />
        <h2>Admin Panel</h2>
      </div>

      {/* Platform stats */}
      {stats && (
        <div className="summary-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Users',      value: stats.totalUsers,       cls: 'users',   icon: '👤' },
            { label: 'Transactions',     value: stats.totalTransactions,cls: 'balance', icon: '💸' },
            { label: 'Platform Income',  value: fmt(stats.platformIncome),  cls: 'income',  icon: '↑' },
            { label: 'Platform Expense', value: fmt(stats.platformExpense), cls: 'expense', icon: '↓' },
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
      )}

      {/* Users table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h3>All Users ({pagination.total})</h3>
          <input
            className="form-input" placeholder="Search users…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 260 }}
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Last Login</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                        {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => toggleRole(u)}
                        title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                      >
                        {u.role === 'admin' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => toggleStatus(u)}
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {u.isActive ? '🔒' : '🔓'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u)} title="Delete user">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="pagination" style={{ padding: '1rem' }}>
            <button className="page-btn" disabled={page <= 1} onClick={() => { setPage(p => p-1); loadUsers(page-1, search); }}>‹</button>
            <span style={{ fontSize: 13 }}>Page {page} of {pagination.pages}</span>
            <button className="page-btn" disabled={page >= pagination.pages} onClick={() => { setPage(p => p+1); loadUsers(page+1, search); }}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}
