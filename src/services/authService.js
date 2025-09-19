import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://post-women-backend.vercel.app/api';

const TOKEN_KEY = 'postman_mvp_token';
const USER_KEY = 'postman_mvp_user';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      removeToken();
      removeUser();
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Token management functions
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// User data management functions
export const setUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = () => {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

// Authentication API functions

// Register new user
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration API error:', error);
    throw error;
  }
};

// Login user
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    console.error('Login API error:', error);
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.error('Logout API error:', error);
    throw error;
  }
};

// Get current user profile
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (error) {
    console.error('Get current user API error:', error);
    throw error;
  }
};

// Update user profile
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Update profile API error:', error);
    throw error;
  }
};

// Change password
export const changePassword = async (passwordData) => {
  try {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Change password API error:', error);
    throw error;
  }
};

// Generate API key
export const generateAPIKey = async (keyName) => {
  try {
    const response = await api.post('/auth/api-keys', { name: keyName });
    return response.data;
  } catch (error) {
    console.error('Generate API key error:', error);
    throw error;
  }
};

// Get user's API keys
export const getAPIKeys = async () => {
  try {
    const response = await api.get('/auth/api-keys');
    return response.data;
  } catch (error) {
    console.error('Get API keys error:', error);
    throw error;
  }
};

// Delete API key
export const deleteAPIKey = async (keyId) => {
  try {
    const response = await api.delete(`/auth/api-keys/${keyId}`);
    return { success: true, message: 'API key deleted successfully' };
  } catch (error) {
    console.error('Delete API key error:', error);
    throw error;
  }
};

// Admin API functions

// Get all users (admin only)
export const getUsers = async (params = {}) => {
  try {
    const response = await api.get('/admin/users', { params });
    return response.data;
  } catch (error) {
    console.error('Get users API error:', error);
    throw error;
  }
};

// Get specific user (admin only)
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get user by ID API error:', error);
    throw error;
  }
};

// Update user role (admin only)
export const updateUserRole = async (userId, role) => {
  try {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    console.error('Update user role API error:', error);
    throw error;
  }
};

// Update user status (admin only)
export const updateUserStatus = async (userId, isActive) => {
  try {
    const response = await api.put(`/admin/users/${userId}/status`, { isActive });
    return response.data;
  } catch (error) {
    console.error('Update user status API error:', error);
    throw error;
  }
};

// Unlock user account (admin only)
export const unlockUser = async (userId) => {
  try {
    const response = await api.post(`/admin/users/${userId}/unlock`);
    return response.data;
  } catch (error) {
    console.error('Unlock user API error:', error);
    throw error;
  }
};

// Delete user (admin only)
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/admin/users/${userId}`);
    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('Delete user API error:', error);
    throw error;
  }
};

// Get system statistics (admin only)
export const getSystemStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Get system stats API error:', error);
    throw error;
  }
};

// Create admin user (admin only)
export const createAdmin = async (adminData) => {
  try {
    const response = await api.post('/admin/create-admin', adminData);
    return response.data;
  } catch (error) {
    console.error('Create admin API error:', error);
    throw error;
  }
};

// Perform bulk actions on users (admin only)
export const bulkActions = async (action, userIds) => {
  try {
    const response = await api.post('/admin/bulk-actions', { action, userIds });
    return response.data;
  } catch (error) {
    console.error('Bulk actions API error:', error);
    throw error;
  }
};

// Utility functions

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();
  return !!(token && user);
};

// Get auth headers for manual requests
export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Format API errors for display
export const formatAPIError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else {
    return 'An unexpected error occurred';
  }
};

// Validate token expiry (basic check)
export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;

  try {
    // Decode JWT token (basic check without verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Token validation error:', error);
    return true;
  }
};

// Clear all auth data
export const clearAuthData = () => {
  removeToken();
  removeUser();
};

export default api;