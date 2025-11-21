import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Box, CircularProgress, Typography, Button, Container } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

// Simple implementation of useSnackbar
const useSnackbar = () => {
  const showMessage = (message, options = {}) => {
    console.log(`[Snackbar] ${message}`, options);
  };

  return {
    enqueueSnackbar: showMessage,
    closeSnackbar: () => {},
  };
};

/**
 * Higher-Order Component to protect admin routes
 * - Verifies user authentication
 * - Validates admin role
 * - Handles loading and error states
 * - Provides smooth redirects
 */
const AdminRoute = ({ children, requiredRoles = ['admin'] }) => {
  const { user, loading, isAuthenticated } = useAuth(); // Changed from currentUser to user
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user has required role
  const hasRequiredRole = () => {
    if (!user) return false; // Changed from currentUser to user
    
    // Check for admin role
    const userRoles = [];
    if (user.role) userRoles.push(user.role);
    if (user.isAdmin) userRoles.push('admin');
    
    // If no specific roles required, just check authentication
    if (!requiredRoles || requiredRoles.length === 0) return true;
    
    // Check if user has any of the required roles
    return requiredRoles.some(role => userRoles.includes(role));
  };

  // Show unauthorized message and redirect if user lacks permissions
  useEffect(() => {
    if (loading || !isAuthenticated) return;
    
    if (!hasRequiredRole()) {
      console.log('Access denied. User roles:', {
        role: user?.role, // Changed from currentUser to user
        isAdmin: user?.isAdmin, // Changed from currentUser to user
        requiredRoles
      });
      
      enqueueSnackbar('You do not have permission to access the admin panel', { 
        variant: 'error',
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });
      
      // Redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, isAuthenticated, enqueueSnackbar, navigate, requiredRoles]); // Changed from currentUser to user

  // Show loading state
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
        flexDirection="column"
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" mt={3} color="textSecondary">
          Verifying permissions...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check user role - this should be handled by the useEffect hook
  // But we'll keep this as a fallback
  if (!hasRequiredRole()) {
    // Show loading state while redirecting
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
        flexDirection="column"
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" mt={3} color="textSecondary">
          Redirecting...
        </Typography>
      </Box>
    );
  }

  // User is authenticated and has required role
  return children;
};

// Prop validation
AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRoles: PropTypes.arrayOf(PropTypes.string)
};

export default AdminRoute;