import React, { useState } from 'react';
import { login } from '../../services/authService';

export default function LoginPage({ onSuccess, onSwitch }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login({ identifier, password });
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
        <h2>Welcome Back</h2>
        <p>Login to sync your collections and history</p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email or Username</label>
            <input 
              required 
              className="input" 
              placeholder="jane@example.com" 
              value={identifier} 
              onChange={e => setIdentifier(e.target.value)} 
              disabled={loading}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="label">Password</label>
            <input 
              required 
              type="password" 
              className="input" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" style={{ padding: '10px' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          Don't have an account? <span className="auth-link" onClick={onSwitch}>Sign up</span>
        </div>
      </div>
    </div>
  );
}
