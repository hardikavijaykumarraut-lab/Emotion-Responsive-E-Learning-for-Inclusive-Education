import { api } from '../contexts/AuthContext';

class ProgressService {
  /**
   * Update user progress in real-time
   * @param {string} userId - User ID
   * @param {Object} progressData - Progress data to update
   */
  async updateProgress(userId, progressData) {
    try {
      if (!userId) {
        console.warn('Cannot update progress: No user ID provided');
        return { success: false, error: 'No user ID' };
      }

      const response = await api.post(`/progress/${userId}/update`, progressData);
      return response.data;
    } catch (error) {
      console.error('Error updating progress:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to update progress' 
      };
    }
  }

  /**
   * Log emotion data to the database
   * @param {string} userId - User ID
   * @param {Object} emotionData - Emotion data (emotion, confidence, timestamp, context)
   */
  async logEmotion(userId, emotionData) {
    try {
      if (!userId) {
        console.warn('Cannot log emotion: No user ID provided');
        return { success: false, error: 'No user ID' };
      }

      const response = await api.post(`/progress/${userId}/emotion`, {
        emotion: emotionData.emotion,
        confidence: emotionData.confidence,
        timestamp: emotionData.timestamp || new Date().toISOString(),
        context: emotionData.context || {}
      });
      
      return response.data;
    } catch (error) {
      console.error('Error logging emotion:', error);
      // Also try to log directly to the emotions endpoint as fallback
      try {
        await api.post(`/emotions/detect`, {
          userId: userId,
          emotion: emotionData.emotion,
          confidence: emotionData.confidence,
          context: emotionData.context || {},
          timestamp: emotionData.timestamp || new Date().toISOString()
        });
        console.log('Emotion logged to fallback endpoint');
        return { success: true, message: 'Emotion logged successfully' };
      } catch (fallbackError) {
        console.error('Error logging emotion to fallback endpoint:', fallbackError);
        return { 
          success: false, 
          error: error.response?.data?.error || 'Failed to log emotion' 
        };
      }
    }
  }

  /**
   * Get user's progress
   * @param {string} userId - User ID
   */
  async getProgress(userId) {
    try {
      if (!userId) {
        console.warn('Cannot get progress: No user ID provided');
        return { success: false, error: 'No user ID' };
      }

      const response = await api.get(`/progress/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting progress:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get progress' 
      };
    }
  }

  /**
   * Track module completion
   * @param {string} userId - User ID
   * @param {string} subject - Subject name
   * @param {number} timeSpent - Time spent in seconds
   * @param {string} action - Action identifier
   */
  async trackModuleCompletion(userId, subject, timeSpent = 0, action = 'module_completed') {
    return this.updateProgress(userId, {
      subject,
      action,
      moduleCompleted: true,
      timeSpent,
      score: null
    });
  }

  /**
   * Track quiz completion
   * @param {string} userId - User ID
   * @param {string} subject - Subject name
   * @param {number} score - Quiz score (0-100)
   * @param {number} timeSpent - Time spent in seconds
   */
  async trackQuizCompletion(userId, subject, score, timeSpent = 0) {
    return this.updateProgress(userId, {
      subject,
      action: 'quiz_completed',
      moduleCompleted: false,
      timeSpent,
      score
    });
  }

  /**
   * Track content viewing
   * @param {string} userId - User ID
   * @param {string} subject - Subject name
   * @param {number} timeSpent - Time spent in seconds
   */
  async trackContentView(userId, subject, timeSpent) {
    return this.updateProgress(userId, {
      subject,
      action: 'content_viewed',
      moduleCompleted: false,
      timeSpent,
      score: null
    });
  }

  /**
   * Get subject-specific progress
   * @param {string} userId - User ID
   * @param {string} subject - Subject name
   */
  async getSubjectProgress(userId, subject) {
    try {
      if (!userId || !subject) {
        console.warn('Cannot get subject progress: Missing user ID or subject');
        return { success: false, error: 'Missing parameters' };
      }

      const response = await api.get(`/progress/${userId}/subject/${subject}`);
      return response.data;
    } catch (error) {
      console.error('Error getting subject progress:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get subject progress' 
      };
    }
  }

  /**
   * Get user achievements
   * @param {string} userId - User ID
   */
  async getAchievements(userId) {
    try {
      if (!userId) {
        console.warn('Cannot get achievements: No user ID provided');
        return { success: false, error: 'No user ID' };
      }

      const response = await api.get(`/progress/${userId}/achievements`);
      return response.data;
    } catch (error) {
      console.error('Error getting achievements:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get achievements' 
      };
    }
  }

  /**
   * Get detailed progress information
   * @param {string} userId - User ID
   */
  async getDetailedProgress(userId) {
    try {
      if (!userId) {
        console.warn('Cannot get detailed progress: No user ID provided');
        return { success: false, error: 'No user ID' };
      }

      const response = await api.get(`/progress/${userId}/details`);
      return response.data;
    } catch (error) {
      console.error('Error getting detailed progress:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get detailed progress' 
      };
    }
  }

  /**
   * Get comprehensive student progress including all relevant data
   * @param {string} userId - User ID
   */
  async getStudentProgress(userId) {
    try {
      if (!userId) {
        console.warn('Cannot get student progress: No user ID provided');
        return { success: false, error: 'No user ID' };
      }

      // Fetch progress data which now includes detailed progress
      const progressResponse = await this.getProgress(userId);

      if (!progressResponse.success) {
        throw new Error(progressResponse.error || 'Failed to fetch progress');
      }

      return progressResponse.data;
    } catch (error) {
      console.error('Error getting student progress:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get student progress' 
      };
    }
  }

  /**
   * Unlock an achievement
   * @param {string} userId - User ID
   * @param {string} achievementId - Achievement ID
   */
  async unlockAchievement(userId, achievementId) {
    try {
      if (!userId || !achievementId) {
        console.warn('Cannot unlock achievement: Missing parameters');
        return { success: false, error: 'Missing parameters' };
      }

      const response = await api.post(`/progress/${userId}/achievement/${achievementId}`);
      return response.data;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to unlock achievement' 
      };
    }
  }
}

// Export singleton instance
const progressService = new ProgressService();
export default progressService;

// Export individual functions for convenience
export const updateProgress = (userId, progressData) => progressService.updateProgress(userId, progressData);
export const logEmotion = (userId, emotionData) => progressService.logEmotion(userId, emotionData);
export const getProgress = (userId) => progressService.getProgress(userId);
export const trackModuleCompletion = (userId, subject, timeSpent) => progressService.trackModuleCompletion(userId, subject, timeSpent);
export const trackQuizCompletion = (userId, subject, score, timeSpent) => progressService.trackQuizCompletion(userId, subject, score, timeSpent);
export const trackContentView = (userId, subject, timeSpent) => progressService.trackContentView(userId, subject, timeSpent);
export const getSubjectProgress = (userId, subject) => progressService.getSubjectProgress(userId, subject);
export const getAchievements = (userId) => progressService.getAchievements(userId);
export const getDetailedProgress = (userId) => progressService.getDetailedProgress(userId);
export const getStudentProgress = (userId) => progressService.getStudentProgress(userId);
export const unlockAchievement = (userId, achievementId) => progressService.unlockAchievement(userId, achievementId);