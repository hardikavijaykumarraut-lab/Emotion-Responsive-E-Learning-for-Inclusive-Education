import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Create API client with timeout
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Create the auth context
const AuthContext = createContext();

// Create a custom hook to use the auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize user from localStorage if available
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Update isAuthenticated when user or token changes
  useEffect(() => {
    setIsAuthenticated(!!user && !!token);
  }, [user, token]);

  // Check auth status on mount and when token changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentToken = token || localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (!storedUser) {
          setLoading(false);
          return;
        }
        
        const userData = JSON.parse(storedUser);
        
        // If it's a guest user, just set the user and token from storage
        if (userData.isGuest) {
          setUser(userData);
          setToken(currentToken);
          if (currentToken) {
            api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
          }
          setLoading(false);
          return;
        }
        
        // For authenticated users, verify with the server
        if (currentToken) {
          try {
            // Use the appropriate endpoint based on user role
            const endpoint = '/auth/me';
            const response = await api.get(endpoint);
            
            if (response.data.user) {
              const updatedUser = response.data.user;
              // Ensure the role is preserved and isAdmin flag is set
              if (!updatedUser.isAdmin) {
                updatedUser.isAdmin = updatedUser.role === 'admin';
              }
              
              setUser(updatedUser);
              setToken(currentToken);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              localStorage.setItem('token', currentToken);
              api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
            } else {
              throw new Error('No user data in response');
            }
          } catch (error) {
            console.error('Auth check failed:', error);
            // If it's a guest user, just continue with the stored user
            if (userData.isGuest) {
              setUser(userData);
              setToken(currentToken);
              if (currentToken) {
                api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
              }
            } else {
              // If it's an admin user and the token is invalid, log them out
              if (userData.role === 'admin') {
                console.log('Admin session expired or invalid, logging out...');
                logout();
              }
              throw error;
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  // Login function
  const login = async (email, password, role = 'student') => {
    try {
      setLoginLoading(true);
      setError(null);
      
      // Clear any existing auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      
      console.log('Attempting login with:', { email, role });
      
      try {
        let response;
        
        // Use the main login endpoint for both regular and admin users
        response = await api.post('/auth/login', { 
          email, 
          password,
          role: role // Always send the role parameter
        });
        
        console.log('Login response:', response.data);
        
        if (!response.data) {
          throw new Error('No data received from server');
        }
        
        // Handle the standard response format from our backend
        let authToken, userData;
        
        // Our backend returns: { success: true, data: { user, token, role }, message }
        if (response.data.success && response.data.data) {
          authToken = response.data.data.token;
          userData = response.data.data.user;
        }
        // Fallback for other formats
        else if (response.data.token && response.data.user) {
          authToken = response.data.token;
          userData = response.data.user;
        } else {
          console.error('Unexpected response format:', response.data);
          throw new Error('Invalid response format from server. Please try again.');
        }
        
        if (!authToken || !userData) {
          console.error('Missing token or user data:', { authToken, userData });
          throw new Error('Invalid response from server. Please try again.');
        }
        
        // Ensure user data has required fields and correct role
        const normalizedUser = {
          ...userData,
          role: userData.role || role,
          isAdmin: userData.role === 'admin' || role === 'admin',
          isGuest: false
        };
        
        // Store token and user data
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        
        // Update state
        api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        setToken(authToken);
        setUser(normalizedUser);
        
        console.log('Login successful:', normalizedUser);
        return normalizedUser;
        
      } catch (apiError) {
        console.error('Login API error:', apiError);
        const errorMessage = apiError.response?.data?.message || 
                           apiError.message || 
                           'Login failed. Please try again.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoginLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setRegisterLoading(true);
      setError(null);
      
      // Ensure role is set, default to 'student'
      const registrationData = {
        ...userData,
        role: userData.role || 'student'
      };
      
      const response = await api.post('/auth/register', registrationData);
      const { user: registeredUser, token: authToken } = response.data?.data || {};
      
      if (!registeredUser || !authToken) {
        throw new Error('Registration failed: Invalid response from server');
      }
      
      // Ensure user has role information
      const userRole = registeredUser.role || 'student';
      const userWithRole = {
        ...registeredUser,
        role: userRole === 'educator' ? 'admin' : userRole, // Convert educator role to admin
        isAdmin: userRole === 'admin' || userRole === 'educator',
        isStudent: userRole === 'student' || !userRole
      };
      
      // Store token and user data
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userWithRole));
      
      // Update state
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      setToken(authToken);
      setUser(userWithRole);
      
      return userWithRole;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setRegisterLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      if (user?.isGuest) {
        localStorage.removeItem('guestUser');
      } else {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout API error (proceeding with client-side cleanup):', error);
          // Continue with client-side cleanup even if API call fails
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth-related data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Reset state
      setToken(null);
      setUser(null);
      setError(null);
      
      // Clear auth header
      delete api.defaults.headers.common['Authorization'];
      
      // Instead of forcing a full page reload, we'll let the routing handle it
      // The AppContent component will redirect to login when user is null
    }
  }, [user]); // Add user to dependency array

  // Navigation throttle state
  const [lastNavigation, setLastNavigation] = useState(0);
  const navigationCooldown = 1000; // 1 second cooldown between navigations

  const loginAsGuest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear any existing auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      
      // Create a guest user object with all necessary properties
      const guestUser = {
        _id: `guest_${Date.now()}`,
        id: `guest_${Date.now()}`,
        name: 'Guest User',
        email: `guest_${Date.now()}@emolearn.app`,
        role: 'guest',
        isGuest: true,
        isAdmin: false,
        isStudent: true,
        createdAt: new Date().toISOString()
      };
      
      // Generate a mock token for guest user
      const guestToken = `guest_token_${Date.now()}`;
      
      // Store in localStorage
      localStorage.setItem('token', guestToken);
      localStorage.setItem('user', JSON.stringify(guestUser));
      
      // Update state
      api.defaults.headers.common['Authorization'] = `Bearer ${guestToken}`;
      setToken(guestToken);
      setUser(guestUser);
      
      console.log('Guest user logged in:', guestUser);
      return guestUser;
    } catch (error) {
      console.error('Error in loginAsGuest:', error);
      setError('Failed to initialize guest session');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Return the auth context value
  const value = {
    user,
    loading,
    loginLoading,
    registerLoading,
    error,
    login,
    logout,
    register,
    loginAsGuest,
    isAuthenticated,
    token,
    api // Expose the api instance
  };
  
  // Log authentication state changes for debugging
  useEffect(() => {
    console.log('Auth state changed:', { 
      isAuthenticated, 
      user: user ? { ...user, password: undefined } : null,
      hasToken: !!token
    });
  }, [isAuthenticated, user, token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export everything at once
export { AuthProvider, useAuth, api };
export default AuthProvider;