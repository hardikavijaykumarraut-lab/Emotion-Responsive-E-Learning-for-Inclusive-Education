const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Progress = require('../models/Progress');
const Emotion = require('../models/Emotion');
const SubjectProgress = require('../models/SubjectProgress');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get dashboard stats
router.get('/dashboard-stats', verifyToken, isAdmin, async (req, res) => {
  try {
    console.log('Dashboard stats request received from user:', req.user);
    
    const [
      totalStudents,
      activeStudents,
      avgProgressResult,
      emotionDistribution,
      recentEmotions
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ 
        role: 'student',
        lastActive: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Active in last 30 minutes
      }),
      Progress.aggregate([
        { $group: { _id: null, avg: { $avg: '$overallProgress' } } }
      ]),
      Emotion.aggregate([
        { $sort: { timestamp: -1 } },
        { $limit: 1000 }, // Last 1000 emotions for distribution
        { $group: { _id: '$emotion', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Emotion.find()
        .sort({ timestamp: -1 })
        .limit(10)
        .populate('userId', 'name email')
    ]);

    console.log('Aggregation results:', {
      totalStudents,
      activeStudents,
      avgProgressResult,
      emotionDistribution,
      recentEmotions: recentEmotions.map(e => ({
        emotion: e.emotion,
        confidence: e.confidence,
        timestamp: e.timestamp,
        student: {
          name: e.userId?.name,
          email: e.userId?.email
        }
      }))
    });

    // Get students with their progress
    const students = await User.find({ role: 'student' })
      .select('name email avatar lastActive')
      .lean();

    console.log('Found students:', students.length);

    const studentsWithProgress = await Promise.all(
      students.map(async (student) => {
        const progress = await Progress.findOne({ userId: student._id })
          .select('overallProgress subjectProgress lastActive')
          .lean();
        
        // Get recent emotions for this student
        const recentEmotions = await Emotion.find({ userId: student._id })
          .sort({ timestamp: -1 })
          .limit(5)
          .select('emotion confidence timestamp')
          .lean();

        // Get detailed subject progress
        const detailedSubjectProgress = await SubjectProgress.find({ userId: student._id })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        console.log('Student progress data:', {
          studentId: student._id,
          progress: progress?.overallProgress,
          subjectProgress: progress?.subjectProgress
        });

        // Calculate emotion distribution for this student
        const emotionDistribution = recentEmotions.reduce((acc, emotion) => {
          acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
          return acc;
        }, {});

        return {
          ...student,
          _id: student._id, // Ensure _id is included
          progress: progress?.overallProgress || 0,
          subjectProgress: progress?.subjectProgress || {},
          detailedSubjectProgress: detailedSubjectProgress || [],
          recentEmotions: recentEmotions || [],
          emotionDistribution: emotionDistribution,
          lastActive: progress?.lastActive || student.lastActive || new Date()
        };
      })
    );

    const avgProgress = avgProgressResult[0]?.avg || 0;

    const result = {
      stats: {
        totalStudents,
        activeStudents,
        avgProgress: avgProgress,
        emotionDistribution: emotionDistribution.map(e => ({
          emotion: e._id,
          count: e.count
        }))
      },
      students: studentsWithProgress,
      recentEmotions: recentEmotions.map(e => ({
        emotion: e.emotion,
        confidence: e.confidence,
        timestamp: e.timestamp,
        student: {
          name: e.userId?.name,
          email: e.userId?.email
        }
      }))
    };

    console.log('Final dashboard stats result:', JSON.stringify(result, null, 2));

    res.json(result);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', message: error.message });
  }
});

// Get student details
router.get('/student/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [student, progress, emotions] = await Promise.all([
      User.findById(id).select('name email avatar lastActive').lean(),
      Progress.findOne({ userId: id }).lean(),
      Emotion.find({ userId: id })
        .sort({ timestamp: -1 })
        .limit(50)
        .lean()
    ]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get detailed subject progress
    const detailedSubjectProgress = await SubjectProgress.find({ userId: id })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate emotion distribution for this student
    const emotionDistribution = emotions.reduce((acc, { emotion }) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {});

    // Calculate weekly progress
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyEmotions = emotions.filter(e => new Date(e.timestamp) >= oneWeekAgo);
    const weeklyProgress = weeklyEmotions.reduce((acc, { emotion }) => {
      // Simple scoring: positive emotions add to progress
      const score = {
        happy: 2,
        neutral: 1,
        sad: -1,
        angry: -2,
        fear: -1,
        surprise: 1,
        disgust: -1
      }[emotion] || 0;
      
      return acc + score;
    }, 0);

    res.json({
      student: {
        ...student,
        _id: student._id, // Ensure _id is included
        progress: progress?.overallProgress || 0,
        subjectProgress: progress?.subjectProgress || {},
        detailedSubjectProgress: detailedSubjectProgress || [],
        weeklyProgress,
        emotionDistribution,
        emotions: emotions.map(e => ({
          emotion: e.emotion,
          confidence: e.confidence,
          timestamp: e.timestamp
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ error: 'Failed to fetch student details', message: error.message });
  }
});

module.exports = router;