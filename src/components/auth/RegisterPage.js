import React, { useState } from 'react';
import { register } from '../../services/authService';

export default function RegisterPage({ onSuccess, onSwitch }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await register(form);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p>Sign up to start saving your API collections</p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="label">First Name</label>
              <input className="input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} disabled={loading} />
            </div>
            <div className="form-group">
              <label className="label">Last Name</label>
              <input className="input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} disabled={loading} />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Username</label>
            <input required className="input" value={form.username} onChange={e => setForm({...form, username: e.target.value})} disabled={loading} />
          </div>

          <div className="form-group">
            <label className="label">Email</label>
            <input required type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={loading} />
          </div>
          
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="label">Password</label>
            <input required type="password" className="input" minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})} disabled={loading} />
          </div>

          <button type="submit" className="btn btn-primary w-full" style={{ padding: '10px' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          Already have an account? <span className="auth-link" onClick={onSwitch}>Log in</span>
        </div>
      </div>
    </div>
  );
}
