import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as authService from '../../services/authService';
import LoadingSpinner from '../auth/LoadingSpinner';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Dashboard state
  const [stats, setStats] = useState(null);

  // Users management state
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    role: '',
    isActive: ''
  });
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Create admin state
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  // Load data based on active tab
  useEffect(() => {
    if (!isAdmin()) return; // Early return if not admin
    
    switch (activeTab) {
      case 'dashboard':
        loadDashboardStats();
        break;
      case 'users':
        loadUsers();
        break;
      default:
        break;
    }
  }, [activeTab, filters, isAdmin]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Redirect if not admin
  if (!isAdmin()) {
    return (
      <div className="admin-panel">
        <div className="unauthorized">
          <h1>Access Denied</h1>
          <p>You need admin privileges to access this panel.</p>
        </div>
      </div>
    );
  }

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authService.getSystemStats();
      if (response.success) {
        setStats(response.data);
      } else {
        setError('Failed to load system statistics');
      }
    } catch (error) {
      setError('Error loading dashboard data');
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      const response = await authService.getUsers(params);
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      setError('Error loading users data');
      console.error('Users load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 for filter changes
    }));
  };

  const handleUserSelection = (userId, isSelected) => {
    if (isSelected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleUserRoleUpdate = async (userId, newRole) => {
    try {
      setError('');
      const response = await authService.updateUserRole(userId, newRole);
      if (response.success) {
        setSuccessMessage(`User role updated to ${newRole}`);
        loadUsers();
      } else {
        setError(response.message || 'Failed to update user role');
      }
    } catch (error) {
      setError('Error updating user role');
      console.error('Role update error:', error);
    }
  };

  const handleUserStatusUpdate = async (userId, isActive) => {
    try {
      setError('');
      const response = await authService.updateUserStatus(userId, isActive);
      if (response.success) {
        setSuccessMessage(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
        loadUsers();
      } else {
        setError(response.message || 'Failed to update user status');
      }
    } catch (error) {
      setError('Error updating user status');
      console.error('Status update error:', error);
    }
  };

  const handleUserUnlock = async (userId) => {
    try {
      setError('');
      const response = await authService.unlockUser(userId);
      if (response.success) {
        setSuccessMessage('User account unlocked successfully');
        loadUsers();
      } else {
        setError(response.message || 'Failed to unlock user');
      }
    } catch (error) {
      setError('Error unlocking user');
      console.error('Unlock error:', error);
    }
  };

  const handleUserDelete = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError('');
      const response = await authService.deleteUser(userId);
      if (response.success) {
        setSuccessMessage(`User "${username}" deleted successfully`);
        loadUsers();
        setSelectedUsers(prev => prev.filter(id => id !== userId));
      } else {
        setError(response.message || 'Failed to delete user');
      }
    } catch (error) {
      setError('Error deleting user');
      console.error('Delete error:', error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      setError('Please select users to perform bulk action');
      return;
    }

    const actionText = {
      activate: 'activate',
      deactivate: 'deactivate',
      unlock: 'unlock',
      delete: 'delete'
    }[action];

    if (!window.confirm(`Are you sure you want to ${actionText} ${selectedUsers.length} selected users?`)) {
      return;
    }

    try {
      setError('');
      setLoading(true);
      const response = await authService.bulkActions(action, selectedUsers);
      if (response.success) {
        setSuccessMessage(`Bulk ${actionText} completed successfully`);
        setSelectedUsers([]);
        loadUsers();
      } else {
        setError(response.message || `Failed to ${actionText} users`);
      }
    } catch (error) {
      setError(`Error performing bulk ${actionText}`);
      console.error('Bulk action error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const response = await authService.createAdmin(adminFormData);
      if (response.success) {
        setSuccessMessage('Admin user created successfully');
        setAdminFormData({
          username: '',
          email: '',
          password: '',
          firstName: '',
          lastName: ''
        });
        setShowCreateAdmin(false);
        if (activeTab === 'users') {
          loadUsers();
        }
      } else {
        setError(response.message || 'Failed to create admin user');
      }
    } catch (error) {
      setError('Error creating admin user');
      console.error('Create admin error:', error);
    } finally {
      setLoading(false);
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

  const renderDashboard = () => (
    <div className="dashboard-content">
      <h2>Admin Dashboard</h2>
      
      {loading ? (
        <LoadingSpinner message="Loading dashboard..." />
      ) : stats ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>Total Users</h3>
                <p className="stat-number">{stats.users.total}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>Active Users</h3>
                <p className="stat-number">{stats.users.active}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">⛔</div>
              <div className="stat-info">
                <h3>Inactive Users</h3>
                <p className="stat-number">{stats.users.inactive}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🔒</div>
              <div className="stat-info">
                <h3>Locked Users</h3>
                <p className="stat-number">{stats.users.locked}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-section">
            <h3>User Roles Distribution</h3>
            <div className="role-stats">
              <div className="role-stat">
                <span className="role-badge admin">Admin</span>
                <span className="role-count">{stats.roles.admin}</span>
              </div>
              <div className="role-stat">
                <span className="role-badge moderator">Moderator</span>
                <span className="role-count">{stats.roles.moderator}</span>
              </div>
              <div className="role-stat">
                <span className="role-badge user">User</span>
                <span className="role-count">{stats.roles.user}</span>
              </div>
            </div>
          </div>

          <div className="dashboard-section">
            <h3>Recent Activity</h3>
            <div className="activity-stats">
              <div className="activity-item">
                <span className="activity-label">New registrations (last 30 days):</span>
                <span className="activity-value">{stats.activity.recentRegistrations}</span>
              </div>
              <div className="activity-item">
                <span className="activity-label">Recent logins (last 24 hours):</span>
                <span className="activity-value">{stats.activity.recentLogins}</span>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );

  const renderUsers = () => (
    <div className="users-content">
      <div className="users-header">
        <h2>User Management</h2>
        <button 
          className="create-admin-btn"
          onClick={() => setShowCreateAdmin(true)}
        >
          Create Admin User
        </button>
      </div>

      {/* Filters */}
      <div className="users-filters">
        <input
          type="text"
          placeholder="Search users..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="search-input"
        />
        
        <select
          value={filters.role}
          onChange={(e) => handleFilterChange('role', e.target.value)}
          className="filter-select"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="user">User</option>
        </select>
        
        <select
          value={filters.isActive}
          onChange={(e) => handleFilterChange('isActive', e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bulk-actions">
          <span className="selected-count">{selectedUsers.length} users selected</span>
          <div className="bulk-buttons">
            <button onClick={() => handleBulkAction('activate')}>Activate</button>
            <button onClick={() => handleBulkAction('deactivate')}>Deactivate</button>
            <button onClick={() => handleBulkAction('unlock')}>Unlock</button>
            <button onClick={() => handleBulkAction('delete')} className="danger">Delete</button>
          </div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner message="Loading users..." />
      ) : (
        <>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                      />
                    </td>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.profile?.avatar ? (
                            <img src={user.profile.avatar} alt="Avatar" />
                          ) : (
                            <div className="avatar-placeholder">
                              {user.profile?.firstName?.[0]}{user.profile?.lastName?.[0]}
                            </div>
                          )}
                        </div>
                        <div className="user-details">
                          <div className="user-name">
                            {user.profile?.firstName} {user.profile?.lastName}
                          </div>
                          <div className="user-email">{user.email}</div>
                          <div className="user-username">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleUserRoleUpdate(user.id, e.target.value)}
                        className={`role-select ${user.role}`}
                        disabled={user.id === user.id} // Prevent self-role change
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <div className="status-controls">
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {user.isLocked && (
                          <span className="status-badge locked">Locked</span>
                        )}
                      </div>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</td>
                    <td>
                      <div className="user-actions">
                        <button
                          onClick={() => handleUserStatusUpdate(user.id, !user.isActive)}
                          className={user.isActive ? 'deactivate-btn' : 'activate-btn'}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        {user.isLocked && (
                          <button
                            onClick={() => handleUserUnlock(user.id)}
                            className="unlock-btn"
                          >
                            Unlock
                          </button>
                        )}
                        <button
                          onClick={() => handleUserDelete(user.id, user.username)}
                          className="delete-btn"
                          disabled={user.id === user.id} // Prevent self-deletion
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handleFilterChange('page', pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="pagination-btn"
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages} 
                ({pagination.total} total users)
              </span>
              
              <button
                onClick={() => handleFilterChange('page', pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Admin Modal */}
      {showCreateAdmin && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create Admin User</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateAdmin(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateAdmin} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={adminFormData.firstName}
                    onChange={(e) => setAdminFormData(prev => ({
                      ...prev,
                      firstName: e.target.value
                    }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={adminFormData.lastName}
                    onChange={(e) => setAdminFormData(prev => ({
                      ...prev,
                      lastName: e.target.value
                    }))}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={adminFormData.username}
                  onChange={(e) => setAdminFormData(prev => ({
                    ...prev,
                    username: e.target.value
                  }))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData(prev => ({
                    ...prev,
                    email: e.target.value
                  }))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={adminFormData.password}
                  onChange={(e) => setAdminFormData(prev => ({
                    ...prev,
                    password: e.target.value
                  }))}
                  required
                  minLength="8"
                />
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="create-btn" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Admin'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowCreateAdmin(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div className="admin-user-info">
          <span>Welcome, {user?.profile?.firstName} {user?.profile?.lastName}</span>
          <span className="role-badge admin">Admin</span>
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

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
      </div>
    </div>
  );
};

export default AdminPanel;