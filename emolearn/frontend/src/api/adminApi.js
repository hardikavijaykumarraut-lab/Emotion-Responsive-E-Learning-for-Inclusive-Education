import api from './api';

// Users API
export const getUsers = () => api.get('/admin/users');
export const createUser = (userData) => api.post('/admin/users', userData);
export const updateUser = (id, userData) => api.put(`/admin/users/${id}`, userData);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

// Content API
export const getContent = () => api.get('/admin/content');
export const createContent = (contentData) => api.post('/admin/content', contentData);
export const updateContent = (id, contentData) => api.put(`/admin/content/${id}`, contentData);
export const deleteContent = (id) => api.delete(`/admin/content/${id}`);

// Analytics API
export const getAnalytics = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/admin/analytics?${queryString}`);
};

export const getDashboardStats = () => api.get('/admin/analytics/dashboard-stats');

// Settings API
export const getSettings = () => api.get('/admin/settings');
export const updateSettings = (settings) => api.put('/admin/settings', settings);

// System Status API
export const getSystemStatus = () => api.get('/admin/status');

// User Statistics
export const getUserStats = () => api.get('/admin/stats/users');
export const getContentStats = () => api.get('/admin/stats/content');
export const getCourseStats = () => api.get('/admin/stats/courses');
export const getQuizStats = () => api.get('/admin/stats/quizzes');

// Export all API functions
export default {
  // Users
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  
  // Content
  getContent,
  createContent,
  updateContent,
  deleteContent,
  
  // Analytics
  getAnalytics,
  getDashboardStats,
  
  // Settings
  getSettings,
  updateSettings,
  
  // System
  getSystemStatus,
  
  // Stats
  getUserStats,
  getContentStats,
  getCourseStats,
  getQuizStats
};
