import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthForms.css';

const LoginForm = ({ onSwitchToRegister }) => {
  const { login, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    identifier: '', // Can be email or username
    password: ''
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Clear errors when component mounts or unmounts
  React.useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.identifier.trim()) {
      errors.identifier = 'Email or username is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await login(formData);
      
      if (result.success) {
        // Login successful - the AuthContext will handle the redirect
        console.log('Login successful');
      }
    } catch (error) {
      console.error('Login submission error:', error);
    }
  };

  const handleDemoLogin = async () => {
    const demoCredentials = {
      identifier: 'admin@postman-mvp.local',
      password: 'admin123'
    };

    try {
      const result = await login(demoCredentials);
      if (result.success) {
        // Demo login successful - the AuthContext will handle the redirect
        console.log('Demo login successful');
      }
    } catch (error) {
      console.error('Demo login error:', error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="text-xl sm:text-2xl">Welcome Back</h1>
          <p className="text-sm sm:text-base">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="identifier">Email or Username</label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleInputChange}
              placeholder="john@example.com or username"
              className={validationErrors.identifier ? 'error' : ''}
              autoComplete="username"
              autoFocus
            />
            {validationErrors.identifier && (
              <span className="field-error">{validationErrors.identifier}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className={validationErrors.password ? 'error' : ''}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex="-1"
              >
                {showPassword ? '�' : '👁️'}
              </button>
            </div>
            {validationErrors.password && (
              <span className="field-error">{validationErrors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="auth-button primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing In...
              </>
            ) : (
              <>
                🚀 Sign In
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="auth-button secondary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Loading Demo...
              </>
            ) : (
              <>
                🎭 Try Demo Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            New to PostWomen?{' '}
            <button type="button" onClick={onSwitchToRegister} className="auth-link">
              Create an account
            </button>
          </p>
        </div>

        <div className="auth-divider">
          <span>✨ What's included</span>
        </div>

        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">🚀</span>
            <span>REST API Testing & Collections</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎭</span>
            <span>Mock Server with Dynamic Data</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔌</span>
            <span>WebSocket Real-time Testing</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎨</span>
            <span>Dark Mode & Custom Themes</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">👥</span>
            <span>Team Collaboration & Sharing</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔐</span>
            <span>Advanced Authentication & Security</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;