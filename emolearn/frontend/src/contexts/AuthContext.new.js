import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create API client with timeout
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
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
      window.location.href = '/login';
    }
    return Promise.reject({
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
    });
  }
);

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [error, setError] = useState(null);

  // Set up axios interceptor for auth token
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      const currentToken = token || localStorage.getItem('token');
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    });

    return () => api.interceptors.request.eject(requestInterceptor);
  }, [token]);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const guestUser = localStorage.getItem('guestUser');
        if (guestUser) {
          setUser(JSON.parse(guestUser));
          setLoading(false);
          return;
        }
        
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          const response = await api.get('/auth/me');
          if (response.data?.user) {
            setUser(response.data.user);
            setToken(currentToken);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          setToken(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoginLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data?.data || {};
      
      if (!user || !token) throw new Error('Invalid response from server');
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      return user;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  const register = async (userData) => {
    setRegisterLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data?.data || {};
      
      if (!user || !token) throw new Error('Registration failed');
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      return user;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setRegisterLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user?.isGuest) {
        localStorage.removeItem('guestUser');
      } else {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setError(null);
    }
  };

  const loginAsGuest = () => {
    const guestUser = {
      id: 'guest',
      name: 'Guest User',
      email: 'guest@emolearn.com',
      role: 'guest',
      isGuest: true
    };
    
    localStorage.setItem('guestUser', JSON.stringify(guestUser));
    setUser(guestUser);
    return guestUser;
  };

  const value = {
    user,
    loading,
    loginLoading,
    registerLoading,
    error,
    login,
    register,
    logout,
    loginAsGuest,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
export { api };
