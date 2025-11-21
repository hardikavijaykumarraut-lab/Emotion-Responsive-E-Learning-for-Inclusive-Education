import axios from 'axios';
import realtimeService from './realtimeService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Fetches dashboard statistics from the server
 * @returns {Promise<Object>} Dashboard statistics
 */
export const getDashboardStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/analytics/dashboard-stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

/**
 * Fetches detailed information about a specific student
 * @param {string} studentId - ID of the student
 * @returns {Promise<Object>} Student details
 */
export const getStudentDetails = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/admin/analytics/student/${studentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching student ${studentId} details:`, error);
    throw error;
  }
};

/**
 * Subscribes to real-time updates
 * @param {Function} callback - Callback function to handle updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToRealtimeUpdates = (callback) => {
  // Connect to WebSocket if not already connected
  realtimeService.connect();
  
  // Add the callback to handle messages
  const messageHandler = (message) => {
    try {
      const data = JSON.parse(message.data);
      callback(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  realtimeService.addMessageHandler(messageHandler);
  
  // Return unsubscribe function
  return () => {
    realtimeService.removeMessageHandler(messageHandler);
  };
};

/**
 * Fetches emotion logs with pagination
 * @param {Object} options - Pagination and filtering options
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.limit - Number of items per page
 * @param {string} options.studentId - Optional student ID to filter by
 * @returns {Promise<Object>} Paginated emotion logs
 */
export const getEmotionLogs = async ({ page = 1, limit = 10, studentId } = {}) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(studentId && { studentId })
    });
    
    const response = await axios.get(`${API_URL}/admin/analytics/emotion-logs?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching emotion logs:', error);
    throw error;
  }
};

/**
 * Fetches progress data for all students
 * @returns {Promise<Array>} List of students with their progress
 */
export const getAllStudentsProgress = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/analytics/students-progress`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching students progress:', error);
    throw error;
  }
};

/**
 * Fetches emotion statistics for a given time period
 * @param {Object} options - Time period options
 * @param {string} options.startDate - Start date in ISO format
 * @param {string} options.endDate - End date in ISO format
 * @param {string} options.granularity - Time granularity ('day', 'week', 'month')
 * @returns {Promise<Object>} Emotion statistics
 */
export const getEmotionStats = async ({ startDate, endDate, granularity = 'day' }) => {
  try {
    const params = new URLSearchParams({
      startDate,
      endDate,
      granularity
    });
    
    const response = await axios.get(`${API_URL}/admin/analytics/emotion-stats?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching emotion statistics:', error);
    throw error;
  }
};

export default {
  getDashboardStats,
  getStudentDetails,
  subscribeToRealtimeUpdates,
  getEmotionLogs,
  getAllStudentsProgress,
  getEmotionStats
};
