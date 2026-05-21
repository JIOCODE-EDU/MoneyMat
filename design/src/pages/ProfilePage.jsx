import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', currency: user?.currency || 'INR' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/users/profile', profile);
      updateUser(res.data.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setChangingPwd(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setChangingPwd(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Profile</h2>

      {/* Avatar */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div className="user-avatar" style={{ width: 72, height: 72, fontSize: 28 }}>{initials}</div>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 20 }}>{user?.name}</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>{user?.email}</div>
          <span className={`badge badge-${user?.role}`} style={{ marginTop: 6 }}>{user?.role}</span>
        </div>
      </div>

      {/* Edit profile */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>Edit Profile</h3>
        <form onSubmit={saveProfile}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className="form-input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" value={user?.email} disabled style={{ opacity: 0.6 }} />
            <div className="form-error">Email cannot be changed</div>
          </div>
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select className="form-select" value={profile.currency} onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))}>
              <option value="INR">₹ Indian Rupee (INR)</option>
              <option value="USD">$ US Dollar (USD)</option>
              <option value="EUR">€ Euro (EUR)</option>
              <option value="GBP">£ British Pound (GBP)</option>
              <option value="AED">د.إ UAE Dirham (AED)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card">
        <h3 style={{ marginBottom: '1.25rem' }}>Change Password</h3>
        <form onSubmit={changePassword}>
          <div className="form-group">
            <label className="form-label">Current password</label>
            <input className="form-input" type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">New password</label>
            <input className="form-input" type="password" placeholder="Min. 6 characters" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm new password</label>
            <input className="form-input" type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={changingPwd}>
            {changingPwd ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
