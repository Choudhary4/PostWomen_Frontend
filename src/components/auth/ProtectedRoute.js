import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null, adminOnly = false, moderatorOnly = false }) => {
  const { isAuthenticated, loading, hasRole, isAdmin, isModerator } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (moderatorOnly && !isModerator()) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render protected content
  return children;
};

// Admin-only Route Component
export const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute adminOnly>
      {children}
    </ProtectedRoute>
  );
};

// Moderator-only Route Component
export const ModeratorRoute = ({ children }) => {
  return (
    <ProtectedRoute moderatorOnly>
      {children}
    </ProtectedRoute>
  );
};

// Role-based Route Component
export const RoleBasedRoute = ({ children, role }) => {
  return (
    <ProtectedRoute requiredRole={role}>
      {children}
    </ProtectedRoute>
  );
};

// Public Route Component (redirects to dashboard if already authenticated)
export const PublicRoute = ({ children, redirectTo = '/' }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render public content
  return children;
};

// Unauthorized Access Component
export const UnauthorizedAccess = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isModerator } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <div className="unauthorized-icon">
          🚫
        </div>
        <h1>Access Denied</h1>
        <p>
          You don't have permission to access this page.
        </p>
        
        {user && (
          <div className="user-info">
            <p>
              <strong>Current Role:</strong> {user.role}
            </p>
            {!isAdmin() && !isModerator() && (
              <p className="role-note">
                This page requires admin or moderator privileges.
              </p>
            )}
          </div>
        )}

        <div className="unauthorized-actions">
          <button 
            onClick={handleGoBack}
            className="btn-secondary"
          >
            Go Back
          </button>
          <button 
            onClick={handleGoHome}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>

        <div className="contact-info">
          <p>
            Need access? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;