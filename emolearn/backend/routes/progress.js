const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const SubjectProgressDetail = require('../models/SubjectProgress');
const User = require('../models/User');
const mongoose = require('mongoose');
const RealtimeService = require('../services/realtimeService');
const ProgressBroadcastService = require('../services/progressBroadcastService');

// Get the realtime service instance (this will need to be passed in or imported differently)
let realtimeService = null;

// Function to set the realtime service instance
const setRealtimeService = (service) => {
  realtimeService = service;
};

// GET /api/progress/:userId - Get user's overall progress
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    let progress = await Progress.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    // Create progress record if it doesn't exist
    if (!progress) {
      progress = new Progress({ userId: new mongoose.Types.ObjectId(userId) });
      progress.initializeDefaultAchievements();
      await progress.save();
    }
    
    // Check for weekly reset
    progress.checkWeeklyReset();
    await progress.save();
    
    // Get detailed progress information
    const detailedProgress = await SubjectProgressDetail.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: {
        ...progress.toObject(),
        detailedSubjectProgress: detailedProgress
      }
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user progress'
    });
  }
});

// GET /api/progress/:userId/subject/:subject - Get progress for specific subject
router.get('/:userId/subject/:subject', async (req, res) => {
  try {
    const { userId, subject } = req.params;
    
    const progress = await Progress.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'User progress not found'
      });
    }
    
    const subjectProgress = progress.subjectProgress[subject];
    
    if (!subjectProgress) {
      return res.status(404).json({
        success: false,
        error: 'Subject progress not found'
      });
    }
    
    res.json({
      success: true,
      data: subjectProgress
    });
  } catch (error) {
    console.error('Error fetching subject progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subject progress'
    });
  }
});

// POST /api/progress/:userId/update - Update user progress
router.post('/:userId/update', async (req, res) => {
  try {
    const { userId } = req.params;
    const { subject, action, score, moduleCompleted, timeSpent } = req.body;
    
    let progress = await Progress.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (!progress) {
      progress = new Progress({ userId: new mongoose.Types.ObjectId(userId) });
      progress.initializeDefaultAchievements();
      // Save the new progress record immediately
      await progress.save();
    }
    
    // Track if we need to create a new SubjectProgressDetail entry
    let shouldCreateSubjectProgressDetail = false;
    let subjectProgressDetailData = null;
    
    // Update subject progress
    if (subject && progress.subjectProgress[subject] !== undefined) {
      const subjectData = progress.subjectProgress[subject];
      
      if (moduleCompleted) {
        // Check if this module has already been completed to prevent duplicates
        // We'll use the currentModule value to determine which module we're completing
        const moduleNumber = getCurrentModuleNumber(subject, action);
        const moduleIndex = moduleNumber - 1; // Convert to 0-based index
        
        // Only increment if we're completing a new module (not already completed)
        if (subjectData.modulesCompleted <= moduleIndex) {
          subjectData.modulesCompleted = Math.min(
            moduleIndex + 1, // Complete the current module
            subjectData.totalModules
          );
          subjectData.progress = Math.round(
            (subjectData.modulesCompleted / subjectData.totalModules) * 100
          );
          
          // Update overall progress when a module is completed
          progress.calculateOverallProgress();
          
          // Mark that we need to create a SubjectProgressDetail entry
          shouldCreateSubjectProgressDetail = true;
          subjectProgressDetailData = {
            userId: new mongoose.Types.ObjectId(userId),
            subject: subject,
            module: `Module ${moduleNumber}`,
            moduleProgress: 100, // Since module is completed
            timeSpent: Math.round((timeSpent || 0) / 60) // Convert seconds to minutes
          };
        }
      } else if (timeSpent) {
        // Update time spent for content viewing
        subjectData.timeSpent += timeSpent;
        // Convert seconds to minutes for timeSpent in main progress
        progress.activeMinutes += Math.round(timeSpent / 60);
        
        // Update subject progress based on time spent (simplified calculation)
        // This helps show progress even when modules aren't completed
        const timeBasedProgress = Math.min(100, Math.round((subjectData.timeSpent / 60) * 2)); // 2% per minute, capped at 100%
        subjectData.progress = Math.max(subjectData.progress, timeBasedProgress);
        
        // Mark that we need to create a SubjectProgressDetail entry
        shouldCreateSubjectProgressDetail = true;
        const moduleNumber = getCurrentModuleNumber(subject, action) || 1;
        subjectProgressDetailData = {
          userId: new mongoose.Types.ObjectId(userId),
          subject: subject,
          module: `Module ${moduleNumber}`,
          moduleProgress: timeBasedProgress,
          timeSpent: Math.round(timeSpent / 60) // Convert seconds to minutes
        };
      } else if (score !== undefined && score !== null) {
        // Update for quiz completion
        // Update subject progress based on quiz score
        subjectData.progress = Math.max(subjectData.progress, Math.round(score));
        
        // Update average score
        if (subjectData.averageScore) {
          subjectData.averageScore = Math.round((subjectData.averageScore + score) / 2);
        } else {
          subjectData.averageScore = score;
        }
        
        // Mark that we need to create a SubjectProgressDetail entry
        shouldCreateSubjectProgressDetail = true;
        const moduleNumber = getCurrentModuleNumber(subject, action) || 1;
        subjectProgressDetailData = {
          userId: new mongoose.Types.ObjectId(userId),
          subject: subject,
          module: `Module ${moduleNumber}`,
          moduleProgress: Math.round(score),
          timeSpent: Math.round((timeSpent || 0) / 60) // Convert seconds to minutes
        };
      }
      
      // Update last accessed time for all actions
      subjectData.lastAccessed = new Date();
    }
    
    // Add to recent activity for all actions
    if (action) {
      const newActivity = {
        subject: subject,
        action: action,
        timestamp: new Date(),
        score: score,
        // Guard the helper call in case function isn't loaded in the running process
        type: (typeof getActionType === 'function') ? getActionType(action) : 'activity'
      };

      await progress.addActivity(newActivity); // This will save the progress
    } else {
      // Ensure overall progress is calculated before saving if no activity was added
      progress.calculateOverallProgress();
      await progress.save();
    }
    
    // Create SubjectProgressDetail entry only once if needed
    let subjectProgressDetail = null;
    if (shouldCreateSubjectProgressDetail && subjectProgressDetailData) {
      subjectProgressDetail = new SubjectProgressDetail(subjectProgressDetailData);
      await subjectProgressDetail.save();
      console.log('Saved SubjectProgressDetail:', subjectProgressDetail);
    }
    
    // Broadcast the update to both admin and student dashboards
    if (RealtimeService.getInstance()) {
      RealtimeService.getInstance().broadcastProgressUpdate(userId);
      RealtimeService.getInstance().broadcastStudentProgressUpdate(userId);
    }
    
    // Get updated detailed progress information
    const detailedProgress = await SubjectProgressDetail.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: {
        ...progress.toObject(),
        detailedSubjectProgress: detailedProgress
      },
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update progress'
    });
  }
});

// POST /api/progress/:userId/emotion - Log emotion data to progress record
router.post('/:userId/emotion', async (req, res) => {
  try {
    const { userId } = req.params;
    const { emotion, confidence, timestamp, context } = req.body;
    
    // Validate required fields
    if (!emotion || confidence === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: emotion, confidence'
      });
    }
    
    // Validate emotion is in the allowed enum values
    const validEmotions = ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral', 'confused'];
    if (!validEmotions.includes(emotion)) {
      return res.status(400).json({ 
        success: false,
        error: `Invalid emotion value: ${emotion}. Must be one of: ${validEmotions.join(', ')}` 
      });
    }
    
    // Validate confidence is between 0 and 1
    const confidenceValue = parseFloat(confidence);
    if (isNaN(confidenceValue) || confidenceValue < 0 || confidenceValue > 1) {
      return res.status(400).json({
        success: false,
        error: 'Confidence must be a number between 0 and 1'
      });
    }
    
    let progress = await Progress.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (!progress) {
      progress = new Progress({ userId: new mongoose.Types.ObjectId(userId) });
      progress.initializeDefaultAchievements();
      // Save the new progress record immediately
      await progress.save();
    }
    
    // Update current emotion in progress record
    progress.currentEmotion = {
      emotion: emotion,
      confidence: confidenceValue,
      timestamp: new Date()
    };
    
    // Add to emotion history in progress record (keep last 50 entries)
    progress.emotionHistory.unshift({
      emotion: emotion,
      confidence: confidenceValue,
      timestamp: new Date()
    });
    
    progress.emotionHistory = progress.emotionHistory.slice(0, 50);
    
    await progress.save();
    
    // Also save to separate Emotion collection for analytics
    const Emotion = require('../models/Emotion');
    const emotionLog = new Emotion({
      userId: new mongoose.Types.ObjectId(userId),
      emotion: emotion,
      confidence: confidenceValue,
      context: context || {},
      timestamp: new Date()
    });
    
    await emotionLog.save();
    
    // Broadcast progress update to admin dashboard and student
    if (realtimeService) {
      realtimeService.broadcastProgressUpdate(userId);
      realtimeService.broadcastStudentProgressUpdate(userId);
      // Also broadcast the new emotion to admin dashboard
      realtimeService.broadcastNewEmotion({
        userId,
        emotion,
        confidence: confidenceValue,
        context,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Emotion data logged successfully'
    });
  } catch (error) {
    console.error('Error logging emotion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log emotion data'
    });
  }
});

// Helper function to get action type from action string
function getActionType(action) {
  if (!action) return 'unknown';
  
  const actionLower = action.toLowerCase();
  if (actionLower.includes('quiz')) {
    return 'quiz';
  } else if (actionLower.includes('module')) {
    return 'module';
  } else if (actionLower.includes('content') || actionLower.includes('view')) {
    return 'content';
  } else if (actionLower.includes('assignment')) {
    return 'assignment';
  }
  return 'activity';
}

// Helper function to determine current module number
function getCurrentModuleNumber(subject, action) {
  // Extract module number from action if possible
  if (action && action.includes('module')) {
    const match = action.match(/module_(\d+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  // Default to module 1 if we can't determine
  return 1;
}

// Helper function to check for quiz achievements
function checkQuizAchievements(progress, score) {
  // Check for perfect score achievement
  if (score === 100) {
    // Find the Perfect Score achievement (id: 5)
    const perfectScoreAchievement = progress.achievements.find(a => a.id === 5);
    if (perfectScoreAchievement && !perfectScoreAchievement.earned) {
      perfectScoreAchievement.earned = true;
      perfectScoreAchievement.earnedDate = new Date();
      // Award points for achievement
      progress.totalPoints += 50;
      progress.weeklyProgress += 50;
    }
  }
}

// Helper function to check for streak achievements
function checkStreakAchievements(progress) {
  if (progress.currentStreak >= 3) {
    // Find the Streak Starter achievement (id: 3)
    const streakAchievement = progress.achievements.find(a => a.id === 3);
    if (streakAchievement && !streakAchievement.earned) {
      streakAchievement.earned = true;
      streakAchievement.earnedDate = new Date();
      // Award points for achievement
      progress.totalPoints += 50;
      progress.weeklyProgress += 50;
    }
  }
}

// GET /api/progress/:userId/achievements - Get user achievements
router.get('/:userId/achievements', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const progress = await Progress.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'User progress not found'
      });
    }
    
    res.json({
      success: true,
      data: progress.achievements
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements'
    });
  }
});

// POST /api/progress/:userId/achievement/:achievementId - Unlock achievement
router.post('/:userId/achievement/:achievementId', async (req, res) => {
  try {
    const { userId, achievementId } = req.params;
    
    const progress = await Progress.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'User progress not found'
      });
    }
    
    const achievement = progress.achievements.find(a => a.id === parseInt(achievementId));
    
    if (!achievement) {
      return res.status(404).json({
        success: false,
        error: 'Achievement not found'
      });
    }
    
    if (!achievement.earned) {
      achievement.earned = true;
      achievement.earnedDate = new Date();
      
      // Award points for achievement
      progress.totalPoints += 50;
      progress.weeklyProgress += 50;
      
      await progress.save();
      
      // Broadcast progress update to admin dashboard and student
      if (realtimeService) {
        realtimeService.broadcastProgressUpdate(userId);
        realtimeService.broadcastStudentProgressUpdate(userId);
      }
    }
    
    res.json({
      success: true,
      data: achievement
    });
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlock achievement'
    });
  }
});

// GET /api/progress/:userId/details - Get detailed progress information
router.get('/:userId/details', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get detailed progress information
    const detailedProgress = await SubjectProgressDetail.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: detailedProgress
    });
  } catch (error) {
    console.error('Error fetching detailed progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch detailed progress'
    });
  }
});

// POST /api/progress/:userId/subject/:subject/update - Update subject-specific progress in detail
router.post('/:userId/subject/:subject/update', async (req, res) => {
  try {
    const { userId, subject } = req.params;
    const { module, moduleProgress, timeSpent, action } = req.body;
    
    // Use the broadcast service to create the entry and broadcast updates
    const subjectProgressDetail = await ProgressBroadcastService.broadcastSubjectProgressUpdate(
      new mongoose.Types.ObjectId(userId),
      subject,
      module,
      moduleProgress,
      timeSpent
    );
    
    // Also update the main progress record
    let progress = await Progress.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (!progress) {
      progress = new Progress({ userId: new mongoose.Types.ObjectId(userId) });
      progress.initializeDefaultAchievements();
      await progress.save();
    }
    
    // Initialize subject progress if it doesn't exist
    if (!progress.subjectProgress[subject]) {
      progress.subjectProgress[subject] = {
        progress: 0,
        modulesCompleted: 0,
        totalModules: 3,
        lastAccessed: new Date(),
        timeSpent: 0,
        averageScore: 0
      };
    }
    
    // Update subject progress
    const subjectData = progress.subjectProgress[subject];
    subjectData.lastAccessed = new Date();
    
    if (timeSpent) {
      subjectData.timeSpent += timeSpent;
      progress.activeMinutes += Math.round(timeSpent / 60);
    }
    
    // Update overall progress calculation
    progress.calculateOverallProgress();
    
    // Add to recent activity
    if (action) {
      const newActivity = {
        subject: subject,
        action: action,
        timestamp: new Date(),
        type: 'module'
      };
      
      progress.addActivity(newActivity);
    }
    
    await progress.save();
    
    // Get updated detailed progress information
    const detailedProgress = await SubjectProgressDetail.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50);
    
    // Update the progress object with detailed progress
    const progressWithDetails = {
      ...progress.toObject(),
      detailedSubjectProgress: detailedProgress
    };
    
    // Broadcast the update to both admin and student dashboards
    if (RealtimeService.getInstance()) {
      RealtimeService.getInstance().broadcastProgressUpdate(userId);
      RealtimeService.getInstance().broadcastStudentProgressUpdate(userId);
    }
    
    res.json({
      success: true,
      data: {
        subjectProgressDetail,
        progress: progressWithDetails,
        detailedSubjectProgress: detailedProgress
      },
      message: 'Subject progress updated successfully'
    });
  } catch (error) {
    console.error('Error updating subject progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subject progress'
    });
  }
});

// GET /api/progress/:userId/last-module/:subject - Get the last module the user was on for a subject
router.get('/:userId/last-module/:subject', async (req, res) => {
  try {
    const { userId, subject } = req.params;
    
    // First, try to get from the detailed progress
    const lastDetailedProgress = await SubjectProgressDetail
      .findOne({ 
        userId: new mongoose.Types.ObjectId(userId),
        subject: subject
      })
      .sort({ createdAt: -1 });
    
    if (lastDetailedProgress) {
      // Extract module number from the module name
      const moduleMatch = lastDetailedProgress.module.match(/Module\s+(\d+)/i);
      let moduleIndex = 0;
      if (moduleMatch && moduleMatch[1]) {
        moduleIndex = parseInt(moduleMatch[1]) - 1; // Convert to 0-based index
      }
      
      return res.json({
        success: true,
        data: {
          moduleIndex: moduleIndex,
          module: lastDetailedProgress.module,
          lastAccessed: lastDetailedProgress.createdAt
        }
      });
    }
    
    // If no detailed progress, try the main progress record
    const progress = await Progress.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (progress && progress.subjectProgress[subject]) {
      const subjectData = progress.subjectProgress[subject];
      // If modules have been completed, resume from the next incomplete module
      if (subjectData.modulesCompleted > 0) {
        // Resume from the next module (but not beyond the total modules)
        const nextModule = Math.min(subjectData.modulesCompleted, subjectData.totalModules - 1);
        return res.json({
          success: true,
          data: {
            moduleIndex: nextModule,
            lastAccessed: subjectData.lastAccessed
          }
        });
      }
      // If no modules completed, start from the beginning
      return res.json({
        success: true,
        data: {
          moduleIndex: 0,
          lastAccessed: subjectData.lastAccessed
        }
      });
    }
    
    // Default to first module if no progress found
    res.json({
      success: true,
      data: {
        moduleIndex: 0,
        module: 'Module 1'
      }
    });
  } catch (error) {
    console.error('Error fetching last module:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch last module data'
    });
  }
});

module.exports = {
  router: router,
  setRealtimeService: setRealtimeService
};