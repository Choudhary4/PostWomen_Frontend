import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as authService from '../../services/authService';
import LoadingSpinner from './LoadingSpinner';
import './UserProfile.css';

const UserProfile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    avatar: user?.avatar || ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // API Keys state
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    darkMode: false,
    language: 'en',
    timezone: 'UTC'
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'apiKeys') {
      loadApiKeys();
    } else if (activeTab === 'preferences') {
      loadPreferences();
    }
  }, [activeTab]);

  const showMessage = (type, content) => {
    setMessage({ type, content });
    setTimeout(() => setMessage({ type: '', content: '' }), 5000);
  };

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await authService.getAPIKeys();
      if (response.success && response.data && Array.isArray(response.data.apiKeys)) {
        setApiKeys(response.data.apiKeys);
      } else {
        setApiKeys([]); // Ensure apiKeys is always an array
        showMessage('error', 'Failed to load API keys');
      }
    } catch (error) {
      setApiKeys([]); // Ensure apiKeys is always an array on error
      showMessage('error', 'Error loading API keys');
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      setLoading(true);
      // For now, use local storage for preferences since backend method doesn't exist
      const savedPrefs = localStorage.getItem('user_preferences');
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    } catch (error) {
      showMessage('error', 'Error loading preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await updateProfile(profileForm);
      if (response.success) {
        showMessage('success', 'Profile updated successfully');
      } else {
        showMessage('error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      showMessage('error', 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      const response = await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      if (response.success) {
        showMessage('success', 'Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showMessage('error', response.message || 'Failed to change password');
      }
    } catch (error) {
      showMessage('error', 'Error changing password');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateApiKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      showMessage('error', 'Please enter a name for the API key');
      return;
    }

    try {
      setSaving(true);
      const response = await authService.generateAPIKey(newKeyName);
      if (response.success) {
        showMessage('success', 'API key generated successfully');
        setNewKeyName('');
        loadApiKeys(); // Reload the API keys list
      } else {
        showMessage('error', response.message || 'Failed to generate API key');
      }
    } catch (error) {
      showMessage('error', 'Error generating API key');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeApiKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to revoke this API key?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await authService.deleteAPIKey(keyId);
      if (response.success) {
        showMessage('success', 'API key revoked successfully');
        loadApiKeys();
      } else {
        showMessage('error', response.message || 'Failed to revoke API key');
      }
    } catch (error) {
      showMessage('error', 'Error revoking API key');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // For now, save to local storage since backend method doesn't exist
      localStorage.setItem('user_preferences', JSON.stringify(preferences));
      showMessage('success', 'Preferences updated successfully');
    } catch (error) {
      showMessage('error', 'Error updating preferences');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="user-profile">
        <div className="profile-error">
          <h2>Not Authenticated</h2>
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <div className="avatar-placeholder">
                {(user.name || user.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-details">
            <h1>{user.name || user.username}</h1>
            <p className="profile-email">{user.email}</p>
            <span className={`profile-role role-${user.role}`}>{user.role}</span>
          </div>
        </div>
      </div>

      {message.content && (
        <div className={`profile-message ${message.type}`}>
          {message.content}
        </div>
      )}

      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button
          className={`tab-btn ${activeTab === 'apiKeys' ? 'active' : ''}`}
          onClick={() => setActiveTab('apiKeys')}
        >
          API Keys
        </button>
        <button
          className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="profile-tab">
            <h2>Profile Information</h2>
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter your username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="avatar">Avatar URL</label>
                <input
                  type="url"
                  id="avatar"
                  value={profileForm.avatar}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, avatar: e.target.value }))}
                  placeholder="Enter avatar image URL"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <LoadingSpinner size="small" color="white" /> : 'Update Profile'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="security-tab">
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <LoadingSpinner size="small" color="white" /> : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'apiKeys' && (
          <div className="api-keys-tab">
            <h2>API Keys</h2>
            
            <div className="api-key-generator">
              <h3>Generate New API Key</h3>
              <form onSubmit={handleGenerateApiKey} className="api-key-form">
                <div className="form-group">
                  <label htmlFor="keyName">Key Name</label>
                  <input
                    type="text"
                    id="keyName"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Enter a name for this API key"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <LoadingSpinner size="small" color="white" /> : 'Generate API Key'}
                </button>
              </form>
            </div>

            <div className="api-keys-list">
              <h3>Your API Keys</h3>
              {loading ? (
                <LoadingSpinner text="Loading API keys..." />
              ) : (!Array.isArray(apiKeys) || apiKeys.length === 0) ? (
                <p>No API keys generated yet.</p>
              ) : (
                <div className="api-keys-table">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="api-key-item">
                      <div className="api-key-info">
                        <h4>{key.name}</h4>
                        <p>Created: {new Date(key.createdAt).toLocaleDateString()}</p>
                        <code className="api-key-value">{key.key}</code>
                      </div>
                      <button
                        onClick={() => handleRevokeApiKey(key.id)}
                        className="btn-danger"
                        disabled={saving}
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="preferences-tab">
            <h2>User Preferences</h2>
            {loading ? (
              <LoadingSpinner text="Loading preferences..." />
            ) : (
              <form onSubmit={handlePreferencesSubmit} className="profile-form">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                    />
                    Email Notifications
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.darkMode}
                      onChange={(e) => setPreferences(prev => ({ ...prev, darkMode: e.target.checked }))}
                    />
                    Dark Mode
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="language">Language</label>
                  <select
                    id="language"
                    value={preferences.language}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="timezone">Timezone</label>
                  <select
                    id="timezone"
                    value={preferences.timezone}
                    onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <LoadingSpinner size="small" color="white" /> : 'Save Preferences'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;