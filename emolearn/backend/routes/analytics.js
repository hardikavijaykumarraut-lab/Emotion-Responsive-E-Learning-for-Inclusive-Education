const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Progress = require('../models/Progress');
const Emotion = require('../models/Emotion');
const Content = require('../models/Content');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get overall platform analytics (admin only)
router.get('/overview', verifyToken, isAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalProgress,
      emotionData,
      moduleCompletions
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      Progress.aggregate([
        { $group: { _id: null, total: { $sum: { $size: "$completedModules" } } } }
      ]),
      Emotion.aggregate([
        { $group: { _id: '$emotion', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Progress.aggregate([
        { $unwind: "$completedModules" },
        { $group: { _id: "$completedModules.moduleId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const subjects = await Content.getAllSubjects();
    const subjectStats = await Promise.all(subjects.map(async subject => {
      const progress = await Progress.countDocuments({
        'completedModules.moduleId': { $in: subject.modules.map(m => m._id.toString()) }
      });
      return {
        subjectId: subject._id,
        subjectName: subject.title,
        completionCount: progress,
        totalModules: subject.modules.length
      };
    }));

    res.json({
      totalUsers,
      activeUsers,
      totalModulesCompleted: totalProgress[0]?.total || 0,
      emotionDistribution: emotionData,
      popularModules: moduleCompletions,
      subjectStats
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Get user engagement metrics (admin only)
router.get('/engagement', verifyToken, isAdmin, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyActiveUsers = await User.aggregate([
      { $match: { lastActive: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$lastActive" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const sessionData = await User.aggregate([
      { $match: { lastActive: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $hour: "$lastActive" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const userRetention = await User.aggregate([
      { 
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $gte: ["$lastActive", thirtyDaysAgo] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      dailyActiveUsers,
      sessionData,
      userRetention
    });
  } catch (error) {
    console.error('Error fetching engagement metrics:', error);
    res.status(500).json({ error: 'Failed to fetch engagement metrics' });
  }
});

// Get learning progress analytics (admin only)
router.get('/progress', verifyToken, isAdmin, async (req, res) => {
  try {
    const progressData = await Progress.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: 1,
          userName: '$user.name',
          userEmail: '$user.email',
          progress: { $multiply: [{ $divide: [
            { $size: '$completedModules' },
            { $add: [
              { $size: '$completedModules' },
              { $size: '$inProgressModules' },
              1 // Avoid division by zero
            ]}
          ]}, 100] },
          lastActive: '$user.lastActive',
          completedModules: { $size: '$completedModules' },
          inProgressModules: { $size: '$inProgressModules' }
        }
      },
      { $sort: { progress: -1 } }
    ]);

    res.json(progressData);
  } catch (error) {
    console.error('Error fetching progress analytics:', error);
    res.status(500).json({ error: 'Failed to fetch progress analytics' });
  }
});

// Get content performance analytics (admin only)
router.get('/content-performance', verifyToken, isAdmin, async (req, res) => {
  try {
    const subjects = await Content.getAllSubjects();
    
    const contentPerformance = await Promise.all(subjects.map(async subject => {
      const moduleStats = await Promise.all(subject.modules.map(async module => {
        const completions = await Progress.countDocuments({
          'completedModules.moduleId': module._id.toString()
        });
        
        const inProgress = await Progress.countDocuments({
          'inProgressModules.moduleId': module._id.toString()
        });
        
        const quizScores = await Progress.aggregate([
          { $unwind: "$quizScores" },
          { $match: { 'quizScores.moduleId': module._id.toString() } },
          { 
            $group: {
              _id: null,
              avgScore: { $avg: '$quizScores.score' },
              totalAttempts: { $sum: 1 }
            }
          }
        ]);
        
        return {
          moduleId: module._id,
          moduleName: module.title,
          completions,
          inProgress,
          completionRate: completions / (completions + inProgress) || 0,
          avgQuizScore: quizScores[0]?.avgScore || 0,
          totalQuizAttempts: quizScores[0]?.totalAttempts || 0
        };
      }));
      
      return {
        subjectId: subject._id,
        subjectName: subject.title,
        modules: moduleStats
      };
    }));
    
    res.json(contentPerformance);
  } catch (error) {
    console.error('Error fetching content performance:', error);
    res.status(500).json({ error: 'Failed to fetch content performance data' });
  }
});

module.exports = router;
