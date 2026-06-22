import React from 'react';
import { isAuthenticated, clearAuth } from '../services/authService';

const NAV_TABS = [
  { id: 'builder',   label: 'Request',   icon: '⚡' },
  { id: 'runner',    label: 'Runner',    icon: '▶' },
  { id: 'mock',      label: 'Mock',      icon: '🎭' },
  { id: 'websocket', label: 'WebSocket', icon: '🔌' },
];

export default function Header({ view, onViewChange, authed, onLogout }) {
  const handleLogout = () => {
    clearAuth();
    onLogout();
  };

  return (
    <header className="header">
      {/* Logo */}
      <div className="header-logo" onClick={() => onViewChange('builder')} style={{ cursor: 'pointer' }}>
        <div className="header-logo-icon">♀</div>
        <span>PostWomen</span>
      </div>

      {/* Navigation Tabs */}
      <nav className="header-nav">
        {NAV_TABS.map((tab) => (
          <button
            key={tab.id}
            id={`nav-${tab.id}`}
            className={`nav-tab ${view === tab.id ? 'active' : ''}`}
            onClick={() => onViewChange(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Auth Actions */}
      <div className="header-actions">
        {authed ? (
          <>
            <button
              id="nav-profile"
              className={`nav-tab ${view === 'profile' ? 'active' : ''}`}
              onClick={() => onViewChange('profile')}
            >
              👤 Profile
            </button>
            <button className="btn btn-ghost" onClick={handleLogout} style={{ fontSize: 12 }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              id="nav-login"
              className="btn btn-ghost"
              onClick={() => onViewChange('login')}
            >
              Login
            </button>
            <button
              id="nav-register"
              className="btn btn-primary"
              onClick={() => onViewChange('register')}
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </header>
  );
}