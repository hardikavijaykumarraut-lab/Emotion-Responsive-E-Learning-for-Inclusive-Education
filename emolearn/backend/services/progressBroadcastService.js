const SubjectProgressDetail = require('../models/SubjectProgress');
const RealtimeService = require('./realtimeService');

class ProgressBroadcastService {
  static async broadcastSubjectProgressUpdate(userId, subject, module, moduleProgress, timeSpent) {
    try {
      // Create a new SubjectProgressDetail entry
      const subjectProgressDetail = new SubjectProgressDetail({
        userId,
        subject,
        module: module || 'Unknown Module',
        moduleProgress: moduleProgress || 0,
        timeSpent: timeSpent ? Math.round(timeSpent / 60) : 0 // Convert seconds to minutes
      });
      
      await subjectProgressDetail.save();
      
      // Broadcast the update if realtime service is available
      if (RealtimeService.getInstance()) {
        // Broadcast to admin dashboard
        RealtimeService.getInstance().broadcastProgressUpdate(userId);
        // Broadcast to student dashboard
        RealtimeService.getInstance().broadcastStudentProgressUpdate(userId);
      }
      
      return subjectProgressDetail;
    } catch (error) {
      console.error('Error broadcasting subject progress update:', error);
      throw error;
    }
  }
  
  static async broadcastEmotionUpdate(userId, emotion, confidence, context) {
    try {
      // Broadcast the emotion update if realtime service is available
      if (RealtimeService.getInstance()) {
        RealtimeService.getInstance().broadcastNewEmotion({
          userId,
          emotion,
          confidence,
          context,
          timestamp: new Date()
        });
        
        // Also broadcast progress updates
        RealtimeService.getInstance().broadcastProgressUpdate(userId);
        RealtimeService.getInstance().broadcastStudentProgressUpdate(userId);
      }
    } catch (error) {
      console.error('Error broadcasting emotion update:', error);
      throw error;
    }
  }
  
  // New method to broadcast general progress updates
  static async broadcastProgressUpdate(userId) {
    try {
      // Broadcast the update if realtime service is available
      if (RealtimeService.getInstance()) {
        // Broadcast to admin dashboard
        RealtimeService.getInstance().broadcastProgressUpdate(userId);
        // Broadcast to student dashboard
        RealtimeService.getInstance().broadcastStudentProgressUpdate(userId);
      }
    } catch (error) {
      console.error('Error broadcasting progress update:', error);
      throw error;
    }
  }
}

module.exports = ProgressBroadcastService;