import React, { useState, useEffect } from 'react';
import { getUser, fetchProfile, updateProfile, changePassword, logout } from '../../services/authService';

export default function ProfilePage({ onLogout }) {
  const [user, setUser] = useState(getUser());
  const [form, setForm] = useState({ firstName: '', lastName: '', bio: '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '' });
  
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const p = await fetchProfile();
      setUser(p);
      setForm({
        firstName: p.profile?.firstName || '',
        lastName: p.profile?.lastName || '',
        bio: p.profile?.bio || ''
      });
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const updated = await updateProfile(form);
      setUser(updated);
      setMsg({ text: 'Profile updated successfully', type: 'success' });
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      await changePassword(passForm);
      setMsg({ text: 'Password changed successfully', type: 'success' });
      setPassForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  if (!user) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      
      {msg.text && (
        <div className={`toast ${msg.type}`} style={{ position: 'static', maxWidth: 'none', marginBottom: 20 }}>
          {msg.text}
        </div>
      )}

      {/* ── Profile Info ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header justify-between">
          <span className="card-title">Profile Info</span>
          <button className="btn btn-danger text-sm" onClick={handleLogout}>Log Out</button>
        </div>
        <div className="card-body">
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{user.username}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{user.email}</div>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="label">First Name</label>
                <input className="input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} disabled={loading} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="label">Last Name</label>
                <input className="input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} disabled={loading} />
              </div>
            </div>
            
            <div className="form-group">
              <label className="label">Bio</label>
              <textarea className="textarea" style={{ minHeight: 80 }} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} disabled={loading} />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Change Password ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Change Password</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="label">Current Password</label>
              <input required type="password" className="input" value={passForm.currentPassword} onChange={e => setPassForm({...passForm, currentPassword: e.target.value})} disabled={loading} />
            </div>
            <div className="form-group">
              <label className="label">New Password</label>
              <input required type="password" minLength={6} className="input" value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} disabled={loading} />
            </div>
            <button type="submit" className="btn btn-secondary" disabled={loading || !passForm.currentPassword || !passForm.newPassword}>
              Change Password
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
