import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get auth header with JWT token
export const getAuthHeader = () => {
  // First try to get token from user object (old method)
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    return { 'Authorization': `Bearer ${user.token}` };
  }
  
  // If not found, try to get token directly (new method from AuthContext)
  const token = localStorage.getItem('token');
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  
  // If neither found, return empty object
  return {};
};

// Login user
export const login = async (email, password, role = 'student') => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
      role // Changed from userType to role to match backend expectation
    });
    
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify({
        ...response.data,
        role: response.data.user?.role || role // Ensure role is set correctly
      }));
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error.response?.data || { error: 'Login failed. Please try again.' };
  }
};

// Logout user
export const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

// Get current user
export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const user = getCurrentUser();
  // Check both old and new token storage methods
  const token = localStorage.getItem('token');
  return !!(user && (user.token || token));
};

// Check if user is admin
export const isAdmin = () => {
  const user = getCurrentUser();
  return !!(user && user.role === 'admin');
};

// Get user token
export const getToken = () => {
  // Try both old and new methods
  const user = getCurrentUser();
  if (user && user.token) {
    return user.token;
  }
  return localStorage.getItem('token');
};