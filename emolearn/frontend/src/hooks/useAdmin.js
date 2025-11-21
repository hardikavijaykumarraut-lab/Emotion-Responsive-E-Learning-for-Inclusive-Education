import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import adminApi from '../api/adminApi';
import { formatDate, formatNumber, getStatusColor } from '../utils/adminUtils';

/**
 * Custom hook for admin-related state and actions
 */
const useAdmin = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // State for users
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userPagination, setUserPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    total: 0,
    orderBy: 'createdAt',
    order: 'desc',
  });
  
  // State for content
  const [content, setContent] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentPagination, setContentPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    total: 0,
    orderBy: 'createdAt',
    order: 'desc',
  });
  
  // State for analytics
  const [analytics, setAnalytics] = useState({
    userStats: {},
    contentStats: {},
    systemStats: {},
    loading: false,
  });
  
  // State for settings
  const [settings, setSettings] = useState({
    general: {},
    email: {},
    security: {},
    loading: false,
  });
  
  // Error state
  const [error, setError] = useState(null);

  // Fetch users with pagination and filters
  const fetchUsers = useCallback(async (params = {}) => {
    try {
      setLoadingUsers(true);
      const { data, pagination } = await adminApi.getUsers({
        page: userPagination.page + 1,
        limit: userPagination.rowsPerPage,
        sort: `${userPagination.orderBy}:${userPagination.order}`,
        ...params,
      });
      
      setUsers(data);
      setUserPagination(prev => ({
        ...prev,
        total: pagination.total,
      }));
    } catch (err) {
      setError('Failed to fetch users');
      enqueueSnackbar('Failed to fetch users', { variant: 'error' });
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [userPagination.page, userPagination.rowsPerPage, userPagination.orderBy, userPagination.order, enqueueSnackbar]);
  
  // Handle user pagination change
  const handleUserPageChange = (event, newPage) => {
    setUserPagination(prev => ({
      ...prev,
      page: newPage,
    }));
  };
  
  // Handle rows per page change
  const handleUserRowsPerPageChange = (event) => {
    setUserPagination(prev => ({
      ...prev,
      page: 0,
      rowsPerPage: parseInt(event.target.value, 10),
    }));
  };
  
  // Handle sort
  const handleUserSort = (property) => {
    const isAsc = userPagination.orderBy === property && userPagination.order === 'asc';
    setUserPagination(prev => ({
      ...prev,
      order: isAsc ? 'desc' : 'asc',
      orderBy: property,
    }));
  };
  
  // Create a new user
  const createUser = async (userData) => {
    try {
      const newUser = await adminApi.createUser(userData);
      enqueueSnackbar('User created successfully', { variant: 'success' });
      fetchUsers();
      return newUser;
    } catch (err) {
      setError('Failed to create user');
      enqueueSnackbar(err.response?.data?.message || 'Failed to create user', { variant: 'error' });
      throw err;
    }
  };
  
  // Update a user
  const updateUser = async (id, userData) => {
    try {
      const updatedUser = await adminApi.updateUser(id, userData);
      enqueueSnackbar('User updated successfully', { variant: 'success' });
      fetchUsers();
      return updatedUser;
    } catch (err) {
      setError('Failed to update user');
      enqueueSnackbar(err.response?.data?.message || 'Failed to update user', { variant: 'error' });
      throw err;
    }
  };
  
  // Delete a user
  const deleteUser = async (id) => {
    try {
      await adminApi.deleteUser(id);
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete user', { variant: 'error' });
      throw err;
    }
  };
  
  // Update user status
  const updateUserStatus = async (id, status) => {
    try {
      await adminApi.updateUserStatus(id, status);
      enqueueSnackbar(`User ${status} successfully`, { variant: 'success' });
      fetchUsers();
    } catch (err) {
      setError(`Failed to ${status} user`);
      enqueueSnackbar(err.response?.data?.message || `Failed to ${status} user`, { variant: 'error' });
      throw err;
    }
  };
  
  // Fetch content with pagination and filters
  const fetchContent = useCallback(async (params = {}) => {
    try {
      setLoadingContent(true);
      const { data, pagination } = await adminApi.getContent({
        page: contentPagination.page + 1,
        limit: contentPagination.rowsPerPage,
        sort: `${contentPagination.orderBy}:${contentPagination.order}`,
        ...params,
      });
      
      setContent(data);
      setContentPagination(prev => ({
        ...prev,
        total: pagination.total,
      }));
    } catch (err) {
      setError('Failed to fetch content');
      enqueueSnackbar('Failed to fetch content', { variant: 'error' });
      console.error('Error fetching content:', err);
    } finally {
      setLoadingContent(false);
    }
  }, [contentPagination.page, contentPagination.rowsPerPage, contentPagination.orderBy, contentPagination.order, enqueueSnackbar]);
  
  // Handle content pagination change
  const handleContentPageChange = (event, newPage) => {
    setContentPagination(prev => ({
      ...prev,
      page: newPage,
    }));
  };
  
  // Handle content rows per page change
  const handleContentRowsPerPageChange = (event) => {
    setContentPagination(prev => ({
      ...prev,
      page: 0,
      rowsPerPage: parseInt(event.target.value, 10),
    }));
  };
  
  // Handle content sort
  const handleContentSort = (property) => {
    const isAsc = contentPagination.orderBy === property && contentPagination.order === 'asc';
    setContentPagination(prev => ({
      ...prev,
      order: isAsc ? 'desc' : 'asc',
      orderBy: property,
    }));
  };
  
  // Create new content
  const createContent = async (contentData) => {
    try {
      const newContent = await adminApi.createContent(contentData);
      enqueueSnackbar('Content created successfully', { variant: 'success' });
      fetchContent();
      return newContent;
    } catch (err) {
      setError('Failed to create content');
      enqueueSnackbar(err.response?.data?.message || 'Failed to create content', { variant: 'error' });
      throw err;
    }
  };
  
  // Update content
  const updateContent = async (id, contentData) => {
    try {
      const updatedContent = await adminApi.updateContent(id, contentData);
      enqueueSnackbar('Content updated successfully', { variant: 'success' });
      fetchContent();
      return updatedContent;
    } catch (err) {
      setError('Failed to update content');
      enqueueSnackbar(err.response?.data?.message || 'Failed to update content', { variant: 'error' });
      throw err;
    }
  };
  
  // Delete content
  const deleteContent = async (id) => {
    try {
      await adminApi.deleteContent(id);
      enqueueSnackbar('Content deleted successfully', { variant: 'success' });
      fetchContent();
    } catch (err) {
      setError('Failed to delete content');
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete content', { variant: 'error' });
      throw err;
    }
  };
  
  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalytics(prev => ({ ...prev, loading: true }));
      
      const [userStats, contentStats, systemStats] = await Promise.all([
        adminApi.getUserStats(),
        adminApi.getContentStats(),
        adminApi.getSystemStatus(),
      ]);
      
      setAnalytics({
        userStats,
        contentStats,
        systemStats,
        loading: false,
      });
    } catch (err) {
      setError('Failed to fetch analytics');
      enqueueSnackbar('Failed to fetch analytics', { variant: 'error' });
      console.error('Error fetching analytics:', err);
      setAnalytics(prev => ({ ...prev, loading: false }));
    }
  }, [enqueueSnackbar]);
  
  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      setSettings(prev => ({ ...prev, loading: true }));
      const data = await adminApi.getSettings();
      setSettings({
        general: data.general || {},
        email: data.email || {},
        security: data.security || {},
        loading: false,
      });
    } catch (err) {
      setError('Failed to fetch settings');
      enqueueSnackbar('Failed to fetch settings', { variant: 'error' });
      console.error('Error fetching settings:', err);
      setSettings(prev => ({ ...prev, loading: false }));
    }
  }, [enqueueSnackbar]);
  
  // Update settings
  const updateSettings = async (updatedSettings) => {
    try {
      setSettings(prev => ({ ...prev, loading: true }));
      const data = await adminApi.updateSettings(updatedSettings);
      
      setSettings({
        general: data.general || {},
        email: data.email || {},
        security: data.security || {},
        loading: false,
      });
      
      enqueueSnackbar('Settings updated successfully', { variant: 'success' });
      return data;
    } catch (err) {
      setError('Failed to update settings');
      enqueueSnackbar(err.response?.data?.message || 'Failed to update settings', { variant: 'error' });
      throw err;
    } finally {
      setSettings(prev => ({ ...prev, loading: false }));
    }
  };
  
  // Clear error
  const clearError = () => {
    setError(null);
  };
  
  return {
    // Users
    users,
    loadingUsers,
    userPagination,
    fetchUsers,
    handleUserPageChange,
    handleUserRowsPerPageChange,
    handleUserSort,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    
    // Content
    content,
    loadingContent,
    contentPagination,
    fetchContent,
    handleContentPageChange,
    handleContentRowsPerPageChange,
    handleContentSort,
    createContent,
    updateContent,
    deleteContent,
    
    // Analytics
    analytics,
    fetchAnalytics,
    
    // Settings
    settings,
    fetchSettings,
    updateSettings,
    
    // Error handling
    error,
    clearError,
    
    // Utils
    formatDate,
    formatNumber,
    getStatusColor,
  };
};

export default useAdmin;
