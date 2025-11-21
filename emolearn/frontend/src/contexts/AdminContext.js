import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import adminApi from '../api/adminApi';

// Create the context
const AdminContext = createContext();

// Custom hook to use the admin context
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

// Provider component
export const AdminProvider = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  
  // State for users management
  const [users, setUsers] = useState([]);
  const [userPagination, setUserPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    total: 0,
    orderBy: 'createdAt',
    order: 'desc',
    search: '',
    role: '',
    status: '',
  });
  
  // State for content management
  const [content, setContent] = useState([]);
  const [contentPagination, setContentPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    total: 0,
    orderBy: 'createdAt',
    order: 'desc',
    search: '',
    type: '',
    status: '',
  });
  
  // State for analytics
  const [analytics, setAnalytics] = useState({
    loading: false,
    data: {},
    error: null,
  });
  
  // State for settings
  const [settings, setSettings] = useState({
    loading: false,
    data: {},
    error: null,
  });
  
  // State for loading and error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch users with pagination and filters
  const fetchUsers = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const { data, pagination } = await adminApi.getUsers({
        page: userPagination.page + 1,
        limit: userPagination.rowsPerPage,
        sort: `${userPagination.orderBy}:${userPagination.order}`,
        search: userPagination.search,
        role: userPagination.role,
        status: userPagination.status,
        ...params,
      });
      
      setUsers(data);
      setUserPagination(prev => ({
        ...prev,
        total: pagination.total,
        ...params,
      }));
      
      return { data, pagination };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch users';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userPagination, enqueueSnackbar]);

  // Handle user pagination change
  const handleUserPageChange = (event, newPage) => {
    fetchUsers({ page: newPage });
  };

  // Handle rows per page change
  const handleUserRowsPerPageChange = (event) => {
    fetchUsers({
      page: 0,
      rowsPerPage: parseInt(event.target.value, 10),
    });
  };

  // Handle sort
  const handleUserSort = (property) => {
    const isAsc = userPagination.orderBy === property && userPagination.order === 'asc';
    fetchUsers({
      orderBy: property,
      order: isAsc ? 'desc' : 'asc',
    });
  };

  // Handle search
  const handleUserSearch = (search) => {
    fetchUsers({
      page: 0,
      search,
    });
  };

  // Handle filter
  const handleUserFilter = (filters) => {
    fetchUsers({
      page: 0,
      ...filters,
    });
  };

  // Create a new user
  const createUser = async (userData) => {
    try {
      setLoading(true);
      const newUser = await adminApi.createUser(userData);
      enqueueSnackbar('User created successfully', { variant: 'success' });
      fetchUsers();
      return newUser;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create user';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update a user
  const updateUser = async (id, userData) => {
    try {
      setLoading(true);
      const updatedUser = await adminApi.updateUser(id, userData);
      enqueueSnackbar('User updated successfully', { variant: 'success' });
      fetchUsers();
      return updatedUser;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update user';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a user
  const deleteUser = async (id) => {
    try {
      setLoading(true);
      await adminApi.deleteUser(id);
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
      fetchUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete user';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user status
  const updateUserStatus = async (id, status) => {
    try {
      setLoading(true);
      await adminApi.updateUserStatus(id, { status });
      enqueueSnackbar(`User ${status} successfully`, { variant: 'success' });
      fetchUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Failed to ${status} user`;
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch content with pagination and filters
  const fetchContent = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const { data, pagination } = await adminApi.getContent({
        page: contentPagination.page + 1,
        limit: contentPagination.rowsPerPage,
        sort: `${contentPagination.orderBy}:${contentPagination.order}`,
        search: contentPagination.search,
        type: contentPagination.type,
        status: contentPagination.status,
        ...params,
      });
      
      setContent(data);
      setContentPagination(prev => ({
        ...prev,
        total: pagination.total,
        ...params,
      }));
      
      return { data, pagination };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch content';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contentPagination, enqueueSnackbar]);

  // Handle content pagination change
  const handleContentPageChange = (event, newPage) => {
    fetchContent({ page: newPage });
  };

  // Handle content rows per page change
  const handleContentRowsPerPageChange = (event) => {
    fetchContent({
      page: 0,
      rowsPerPage: parseInt(event.target.value, 10),
    });
  };

  // Handle content sort
  const handleContentSort = (property) => {
    const isAsc = contentPagination.orderBy === property && contentPagination.order === 'asc';
    fetchContent({
      orderBy: property,
      order: isAsc ? 'desc' : 'asc',
    });
  };

  // Handle content search
  const handleContentSearch = (search) => {
    fetchContent({
      page: 0,
      search,
    });
  };

  // Handle content filter
  const handleContentFilter = (filters) => {
    fetchContent({
      page: 0,
      ...filters,
    });
  };

  // Create new content
  const createContent = async (contentData) => {
    try {
      setLoading(true);
      const newContent = await adminApi.createContent(contentData);
      enqueueSnackbar('Content created successfully', { variant: 'success' });
      fetchContent();
      return newContent;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create content';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update content
  const updateContent = async (id, contentData) => {
    try {
      setLoading(true);
      const updatedContent = await adminApi.updateContent(id, contentData);
      enqueueSnackbar('Content updated successfully', { variant: 'success' });
      fetchContent();
      return updatedContent;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update content';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete content
  const deleteContent = async (id) => {
    try {
      setLoading(true);
      await adminApi.deleteContent(id);
      enqueueSnackbar('Content deleted successfully', { variant: 'success' });
      fetchContent();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete content';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update content status
  const updateContentStatus = async (id, status) => {
    try {
      setLoading(true);
      await adminApi.updateContentStatus(id, { status });
      enqueueSnackbar(`Content ${status} successfully`, { variant: 'success' });
      fetchContent();
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Failed to ${status} content`;
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalytics(prev => ({ ...prev, loading: true, error: null }));
      const data = await adminApi.getAnalytics();
      setAnalytics({
        loading: false,
        data,
        error: null,
      });
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch analytics';
      setError(errorMessage);
      setAnalytics(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    }
  }, [enqueueSnackbar]);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      setSettings(prev => ({ ...prev, loading: true, error: null }));
      const data = await adminApi.getSettings();
      setSettings({
        loading: false,
        data,
        error: null,
      });
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch settings';
      setError(errorMessage);
      setSettings(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    }
  }, [enqueueSnackbar]);

  // Update settings
  const updateSettings = async (settingsData) => {
    try {
      setSettings(prev => ({ ...prev, loading: true, error: null }));
      const data = await adminApi.updateSettings(settingsData);
      setSettings({
        loading: false,
        data,
        error: null,
      });
      enqueueSnackbar('Settings updated successfully', { variant: 'success' });
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update settings';
      setError(errorMessage);
      setSettings(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Initial data loading
  useEffect(() => {
    fetchUsers();
    fetchContent();
    fetchAnalytics();
    fetchSettings();
  }, [fetchUsers, fetchContent, fetchAnalytics, fetchSettings]);

  // Context value
  const value = {
    // Users
    users,
    userPagination,
    loading,
    error,
    fetchUsers,
    handleUserPageChange,
    handleUserRowsPerPageChange,
    handleUserSort,
    handleUserSearch,
    handleUserFilter,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    
    // Content
    content,
    contentPagination,
    fetchContent,
    handleContentPageChange,
    handleContentRowsPerPageChange,
    handleContentSort,
    handleContentSearch,
    handleContentFilter,
    createContent,
    updateContent,
    deleteContent,
    updateContentStatus,
    
    // Analytics
    analytics,
    fetchAnalytics,
    
    // Settings
    settings,
    fetchSettings,
    updateSettings,
    
    // Error handling
    clearError,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;
