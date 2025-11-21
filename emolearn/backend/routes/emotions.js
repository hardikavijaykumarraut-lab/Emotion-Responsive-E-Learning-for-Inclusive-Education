const express = require('express');
const router = express.Router();
const Emotion = require('../models/Emotion');
const mongoose = require('mongoose');
const RealtimeService = require('../services/realtimeService');
const ProgressBroadcastService = require('../services/progressBroadcastService');

// Get the realtime service instance (this will need to be passed in or imported differently)
let realtimeService = null;

// Function to set the realtime service instance
const setRealtimeService = (service) => {
  realtimeService = service;
};

// POST /api/emotions/detect - Log detected emotion
router.post('/detect', async (req, res) => {
  try {
    const { userId, emotion, confidence, context, detectionData } = req.body;
    
    if (!userId || !emotion || confidence === undefined) {
      return res.status(400).json({ error: 'Missing required fields: userId, emotion, confidence' });
    }
    
    // Validate emotion is in the allowed enum values
    const validEmotions = ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral', 'confused'];
    if (!validEmotions.includes(emotion)) {
      return res.status(400).json({ error: `Invalid emotion value: ${emotion}. Must be one of: ${validEmotions.join(', ')}` });
    }
    
    const confidenceValue = Math.max(0, Math.min(1, confidence)); // Ensure confidence is between 0 and 1
    
    const emotionLog = new Emotion({
      userId: new mongoose.Types.ObjectId(userId),
      emotion,
      confidence: confidenceValue,
      context: context || {},
      detectionData: detectionData || {}
    });
    
    try {
      await emotionLog.save();
      console.log('Emotion saved successfully for user:', userId, emotion, confidence);
    } catch (saveError) {
      console.error('Error saving emotion:', saveError);
      return res.status(500).json({ error: 'Failed to save emotion data' });
    }
    
    // Also update the current emotion in the user's progress record
    const Progress = require('../models/Progress');
    let progress = await Progress.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (progress) {
      progress.currentEmotion = {
        emotion: emotion,
        confidence: confidence,
        timestamp: new Date()
      };
      
      // Add to emotion history (keep last 100 entries)
      progress.emotionHistory.unshift({
        emotion: emotion,
        confidence: confidence,
        timestamp: new Date()
      });
      
      progress.emotionHistory = progress.emotionHistory.slice(0, 100);
      await progress.save();
    }
    
    // Use the broadcast service to handle emotion updates
    try {
      await ProgressBroadcastService.broadcastEmotionUpdate(
        new mongoose.Types.ObjectId(userId),
        emotion,
        confidenceValue,
        context
      );
    } catch (broadcastError) {
      console.error('Error broadcasting emotion update:', broadcastError);
    }
    
    res.json({
      success: true,
      message: 'Emotion data logged successfully',
      data: emotionLog
    });
  } catch (error) {
    console.error('Error logging emotion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log emotion data'
    });
  }
});

// GET /api/emotions/summary/:userId - Get emotion summary/analytics
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;
    
    const summary = await Emotion.getEmotionSummary(userId, parseInt(days));
    
    // Calculate overall statistics
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    
    const totalLogs = await Emotion.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      timestamp: { $gte: daysAgo }
    });
    
    res.json({
      success: true,
      data: {
        totalLogs,
        period: `${days} days`,
        dailySummary: summary
      }
    });
  } catch (error) {
    console.error('Error generating emotion summary:', error);
    res.status(500).json({ error: 'Failed to generate emotion summary' });
  }
});

// GET /api/emotions/history/:userId - Get emotion history for user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7, limit = 100 } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    
    const userEmotions = await Emotion.find({
      userId: new mongoose.Types.ObjectId(userId),
      timestamp: { $gte: daysAgo }
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: userEmotions
    });
  } catch (error) {
    console.error('Error fetching emotion history:', error);
    res.status(500).json({ error: 'Failed to fetch emotion history' });
  }
});

// GET /api/emotions/realtime/:userId - Get recent emotion trends
router.get('/realtime/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { minutes = 30 } = req.query;
    
    const recentEmotions = await Emotion.getRealtimeTrends(userId, parseInt(minutes));
    
    res.json({
      success: true,
      data: recentEmotions
    });
  } catch (error) {
    console.error('Error fetching realtime emotions:', error);
    res.status(500).json({ error: 'Failed to fetch realtime emotion data' });
  }
});

module.exports = {
  router: router,
  setRealtimeService: setRealtimeService
};