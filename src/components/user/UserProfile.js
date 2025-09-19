import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import './UserProfile.css';

const UserProfile = () => {
  const { 
    user, 
    updateProfile, 
    changePassword, 
    generateAPIKey,
    getAPIKeys,
    deleteAPIKey,
    loading,
    error,
    clearError 
  } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showAPIKeyForm, setShowAPIKeyForm] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    avatar: '',
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        browser: true
      }
    }
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // API Key form state
  const [apiKeyName, setApiKeyName] = useState('');

  // Success messages
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});

  // Initialize profile data when user loads
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        bio: user.profile?.bio || '',
        avatar: user.profile?.avatar || '',
        preferences: {
          theme: user.preferences?.theme || 'light',
          language: user.preferences?.language || 'en',
          notifications: {
            email: user.preferences?.notifications?.email ?? true,
            browser: user.preferences?.notifications?.browser ?? true
          }
        }
      });
    }
  }, [user]);

  // Load API keys when switching to API keys tab
  useEffect(() => {
    if (activeTab === 'api-keys') {
      loadAPIKeys();
    }
  }, [activeTab]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadAPIKeys = async () => {
    try {
      const response = await getAPIKeys();
      if (response.success) {
        setApiKeys(response.data.apiKeys);
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const handleProfileInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: grandchild ? {
            ...prev[parent][child],
            [grandchild]: type === 'checkbox' ? checked : value
          } : (type === 'checkbox' ? checked : value)
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear password errors
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setSuccessMessage('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!validatePasswordForm()) {
      return;
    }

    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (result.success) {
        setSuccessMessage('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordForm(false);
      }
    } catch (error) {
      console.error('Password change error:', error);
    }
  };

  const handleGenerateAPIKey = async (e) => {
    e.preventDefault();
    clearError();

    if (!apiKeyName.trim()) {
      return;
    }

    try {
      const result = await generateAPIKey(apiKeyName);
      if (result.success) {
        setSuccessMessage(`API key "${apiKeyName}" generated successfully!`);
        setApiKeyName('');
        setShowAPIKeyForm(false);
        loadAPIKeys();
      }
    } catch (error) {
      console.error('API key generation error:', error);
    }
  };

  const handleDeleteAPIKey = async (keyId, keyName) => {
    if (!window.confirm(`Are you sure you want to delete the API key "${keyName}"?`)) {
      return;
    }

    try {
      const result = await deleteAPIKey(keyId);
      if (result.success) {
        setSuccessMessage(`API key "${keyName}" deleted successfully!`);
        loadAPIKeys();
      }
    } catch (error) {
      console.error('API key deletion error:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="user-avatar">
          {user.profile?.avatar ? (
            <img src={user.profile.avatar} alt="Profile" />
          ) : (
            <div className="avatar-placeholder">
              {user.profile?.firstName?.[0]}{user.profile?.lastName?.[0]}
            </div>
          )}
        </div>
        <div className="user-info">
          <h1>{user.profile?.firstName} {user.profile?.lastName}</h1>
          <p className="username">@{user.username}</p>
          <p className="email">{user.email}</p>
          <span className={`role-badge ${user.role}`}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Information
        </button>
        <button
          className={`tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button
          className={`tab ${activeTab === 'api-keys' ? 'active' : ''}`}
          onClick={() => setActiveTab('api-keys')}
        >
          API Keys
        </button>
        <button
          className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Profile Information</h2>
              <button
                className="edit-button"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileInputChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileInputChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileInputChange}
                  disabled={!isEditing}
                  rows="4"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="form-group">
                <label>Avatar URL</label>
                <input
                  type="url"
                  name="avatar"
                  value={profileData.avatar}
                  onChange={handleProfileInputChange}
                  disabled={!isEditing}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              {isEditing && (
                <div className="form-actions">
                  <button type="submit" className="save-button" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="security-section">
            <h2>Security Settings</h2>
            
            <div className="security-item">
              <div className="security-info">
                <h3>Password</h3>
                <p>Keep your account secure with a strong password</p>
              </div>
              <button
                className="change-password-button"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                Change Password
              </button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handlePasswordSubmit} className="password-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    className={passwordErrors.currentPassword ? 'error' : ''}
                  />
                  {passwordErrors.currentPassword && (
                    <span className="field-error">{passwordErrors.currentPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    className={passwordErrors.newPassword ? 'error' : ''}
                  />
                  {passwordErrors.newPassword && (
                    <span className="field-error">{passwordErrors.newPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    className={passwordErrors.confirmPassword ? 'error' : ''}
                  />
                  {passwordErrors.confirmPassword && (
                    <span className="field-error">{passwordErrors.confirmPassword}</span>
                  )}
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-button" disabled={loading}>
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setShowPasswordForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="account-info">
              <h3>Account Information</h3>
              <div className="info-item">
                <span className="label">Account Created:</span>
                <span className="value">{formatDate(user.createdAt)}</span>
              </div>
              {user.lastLogin && (
                <div className="info-item">
                  <span className="label">Last Login:</span>
                  <span className="value">{formatDate(user.lastLogin)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'api-keys' && (
          <div className="api-keys-section">
            <div className="section-header">
              <h2>API Keys</h2>
              <button
                className="generate-key-button"
                onClick={() => setShowAPIKeyForm(!showAPIKeyForm)}
              >
                Generate New Key
              </button>
            </div>

            {showAPIKeyForm && (
              <form onSubmit={handleGenerateAPIKey} className="api-key-form">
                <div className="form-group">
                  <label>API Key Name</label>
                  <input
                    type="text"
                    value={apiKeyName}
                    onChange={(e) => setApiKeyName(e.target.value)}
                    placeholder="Enter a name for your API key"
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="generate-button" disabled={loading}>
                    {loading ? 'Generating...' : 'Generate API Key'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setShowAPIKeyForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="api-keys-list">
              {apiKeys.length === 0 ? (
                <div className="empty-state">
                  <p>No API keys found. Generate your first API key to get started.</p>
                </div>
              ) : (
                apiKeys.map((key) => (
                  <div key={key.id} className="api-key-item">
                    <div className="key-info">
                      <h3>{key.name}</h3>
                      <p className="key-value">{key.key}</p>
                      <div className="key-meta">
                        <span>Created: {formatDate(key.createdAt)}</span>
                        {key.lastUsed && (
                          <span>Last used: {formatDate(key.lastUsed)}</span>
                        )}
                        <span className={`status ${key.isActive ? 'active' : 'inactive'}`}>
                          {key.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="key-actions">
                      <button
                        className="delete-key-button"
                        onClick={() => handleDeleteAPIKey(key.id, key.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="preferences-section">
            <h2>Preferences</h2>
            
            <form onSubmit={handleProfileSubmit}>
              <div className="preference-group">
                <h3>Appearance</h3>
                <div className="form-group">
                  <label>Theme</label>
                  <select
                    name="preferences.theme"
                    value={profileData.preferences.theme}
                    onChange={handleProfileInputChange}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>

              <div className="preference-group">
                <h3>Language</h3>
                <div className="form-group">
                  <label>Interface Language</label>
                  <select
                    name="preferences.language"
                    value={profileData.preferences.language}
                    onChange={handleProfileInputChange}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>

              <div className="preference-group">
                <h3>Notifications</h3>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="preferences.notifications.email"
                      checked={profileData.preferences.notifications.email}
                      onChange={handleProfileInputChange}
                    />
                    Email Notifications
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="preferences.notifications.browser"
                      checked={profileData.preferences.notifications.browser}
                      onChange={handleProfileInputChange}
                    />
                    Browser Notifications
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;