import axios from 'axios';
import { getAuthHeader } from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class EmotionService {
  /**
   * Get emotion summary for a user
   * @param {string} userId - User ID
   * @param {number} days - Number of days to fetch (default: 7)
   */
  async getEmotionSummary(userId, days = 7) {
    try {
      if (!userId) {
        console.warn('Cannot get emotion summary: No user ID provided');
        return { success: false, error: 'No user ID' };
      }

      const response = await axios.get(`${API_URL}/emotions/summary/${userId}`, {
        headers: getAuthHeader(),
        params: { days }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting emotion summary:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get emotion summary' 
      };
    }
  }

  /**
   * Get emotion history for a user
   * @param {string} userId - User ID
   * @param {number} days - Number of days to fetch (default: 7)
   * @param {number} limit - Maximum number of records to fetch (default: 100)
   */
  async getEmotionHistory(userId, days = 7, limit = 100) {
    try {
      if (!userId) {
        console.warn('Cannot get emotion history: No user ID provided');
        return { success: false, error: 'No user ID' };
      }

      const response = await axios.get(`${API_URL}/emotions/history/${userId}`, {
        headers: getAuthHeader(),
        params: { days, limit }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting emotion history:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get emotion history' 
      };
    }
  }

  /**
   * Get real-time emotion trends for a user
   * @param {string} userId - User ID
   * @param {number} minutes - Number of minutes to fetch (default: 30)
   */
  async getRealtimeTrends(userId, minutes = 30) {
    try {
      if (!userId) {
        console.warn('Cannot get real-time trends: No user ID provided');
        return { success: false, error: 'No user ID' };
      }

      const response = await axios.get(`${API_URL}/emotions/realtime/${userId}`, {
        headers: getAuthHeader(),
        params: { minutes }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting real-time trends:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get real-time trends' 
      };
    }
  }
}

// Export singleton instance
const emotionService = new EmotionService();
export default emotionService;