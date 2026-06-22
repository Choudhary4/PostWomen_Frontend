import React from 'react';
import { isAuthenticated, clearAuth } from '../services/authService';

const Icons = {
  Request: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  Runner: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>,
  Mock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>,
  WebSocket: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10M12 4v4m0 0a4 4 0 0 1 4 4v5H8v-5a4 4 0 0 1 4-4Z"></path></svg>,
  Profile: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
};

const NAV_TABS = [
  { id: 'builder',   label: 'Request',   icon: Icons.Request },
  { id: 'runner',    label: 'Runner',    icon: Icons.Runner },
  { id: 'mock',      label: 'Mock',      icon: Icons.Mock },
  { id: 'websocket', label: 'WebSocket', icon: Icons.WebSocket },
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
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              id={`nav-${tab.id}`}
              className={`nav-tab ${view === tab.id ? 'active' : ''}`}
              onClick={() => onViewChange(tab.id)}
            >
              <span style={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}><Icon /></span>
              <span>{tab.label}</span>
            </button>
          );
        })}
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
              <span style={{ display: 'flex', alignItems: 'center', opacity: 0.8, marginRight: 6 }}><Icons.Profile /></span> Profile
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