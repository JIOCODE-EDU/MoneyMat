import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import DashboardPage    from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import AnalyticsPage    from './pages/AnalyticsPage';
import StatementsPage   from './pages/StatementsPage';
import ProfilePage      from './pages/ProfilePage';
import AdminPage        from './pages/AdminPage';
import Layout           from './components/layout/Layout';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index                element={<DashboardPage />} />
        <Route path="transactions"  element={<TransactionsPage />} />
        <Route path="analytics"     element={<AnalyticsPage />} />
        <Route path="statements"    element={<StatementsPage />} />
        <Route path="profile"       element={<ProfilePage />} />
        <Route path="admin"         element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px' },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
