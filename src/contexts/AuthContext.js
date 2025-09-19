import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = authService.getToken();
      if (token) {
        // Verify token and get user data
        const userData = await authService.getCurrentUser();
        if (userData.success) {
          setUser(userData.data.user);
          setIsAuthenticated(true);
        } else {
          // Token is invalid, clear it
          authService.removeToken();
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setError('Failed to initialize authentication');
      authService.removeToken();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(credentials);
      
      if (response.success) {
        const { token, user: userData } = response.data;
        
        // Store token
        authService.setToken(token);
        
        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, data: userData };
      } else {
        setError(response.message || 'Login failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.register(userData);
      
      if (response.success) {
        const { token, user: newUser } = response.data;
        
        // Store token
        authService.setToken(token);
        
        // Update state
        setUser(newUser);
        setIsAuthenticated(true);
        
        return { success: true, data: newUser };
      } else {
        setError(response.message || 'Registration failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // Call logout endpoint (optional for JWT)
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call result
      authService.removeToken();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.updateProfile(profileData);
      
      if (response.success) {
        setUser(response.data.user);
        return { success: true, data: response.data.user };
      } else {
        setError(response.message || 'Profile update failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.changePassword(passwordData);
      
      if (response.success) {
        return { success: true, message: 'Password changed successfully' };
      } else {
        setError(response.message || 'Password change failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Password change error:', error);
      const errorMessage = error.response?.data?.message || 'Password change failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Generate API key function
  const generateAPIKey = async (keyName) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.generateAPIKey(keyName);
      
      if (response.success) {
        return { success: true, data: response.data.apiKey };
      } else {
        setError(response.message || 'API key generation failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('API key generation error:', error);
      const errorMessage = error.response?.data?.message || 'API key generation failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Get user's API keys
  const getAPIKeys = async () => {
    try {
      const response = await authService.getAPIKeys();
      return response;
    } catch (error) {
      console.error('Get API keys error:', error);
      return { success: false, message: 'Failed to fetch API keys' };
    }
  };

  // Delete API key
  const deleteAPIKey = async (keyId) => {
    try {
      const response = await authService.deleteAPIKey(keyId);
      return response;
    } catch (error) {
      console.error('Delete API key error:', error);
      return { success: false, message: 'Failed to delete API key' };
    }
  };

  // Check if user has specific role
  const hasRole = (requiredRole) => {
    if (!user || !isAuthenticated) return false;
    
    const roleHierarchy = { admin: 3, moderator: 2, user: 1 };
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  };

  // Check if user is admin
  const isAdmin = () => hasRole('admin');

  // Check if user is moderator or above
  const isModerator = () => hasRole('moderator');

  // Clear error function
  const clearError = () => setError(null);

  // Context value
  const value = {
    // State
    user,
    loading,
    error,
    isAuthenticated,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    generateAPIKey,
    getAPIKeys,
    deleteAPIKey,
    
    // Utilities
    hasRole,
    isAdmin,
    isModerator,
    clearError,
    initializeAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;