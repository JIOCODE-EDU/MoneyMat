import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, ArrowLeftRight, BarChart2,
  FileText, User, ShieldCheck, LogOut, Menu, X,
} from 'lucide-react';

const NAV = [
  { to: '/',            label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { to: '/transactions',label: 'Transactions', icon: ArrowLeftRight },
  { to: '/analytics',   label: 'Analytics',    icon: BarChart2 },
  { to: '/statements',  label: 'Statements',   icon: FileText },
  { to: '/profile',     label: 'Profile',      icon: User },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <span>💰</span> MoneyMate
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <ShieldCheck size={18} />
              Admin Panel
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="page-header">
          <button
            className="mobile-menu-btn btn btn-secondary btn-sm"
            onClick={() => setSidebarOpen(o => !o)}
            style={{ display: 'flex' }}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <div />
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
          </div>
        </header>

        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
