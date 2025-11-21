const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Progress = require('../models/Progress');
const Emotion = require('../models/Emotion');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get all students with their progress (admin only)
router.get('/students', verifyToken, isAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email lastActive')
      .lean();

    const studentsWithProgress = await Promise.all(students.map(async (student) => {
      const progress = await Progress.findOne({ userId: student._id });
      return {
        ...student,
        progress: progress?.overallProgress || 0,
        lastActive: student.lastActive || new Date()
      };
    }));

    res.json(studentsWithProgress);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID (admin only)
router.get('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user (admin only)
router.post('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const newUser = new User({ name, email, password, role });
    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (admin only)
router.put('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role, isActive } = req.body;
    const updateData = { name, email, role, isActive };

    if (password) {
      updateData.password = password;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user statistics (admin only)
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      students,
      teachers,
      admins,
      recentUsers,
      avgProgressResult,
      topEmotionsResult
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'admin' }),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role lastLogin'),
      Progress.aggregate([
        { $group: { _id: null, avgProgress: { $avg: '$subjectProgress.mathematics.progress' } } }
      ]),
      Emotion.aggregate([
        { $group: { _id: '$emotion', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ])
    ]);

    const averageProgress = avgProgressResult[0]?.avgProgress || 0;
    const topEmotions = topEmotionsResult.map(e => ({ emotion: e._id, count: e.count }));

    res.json({
      totalUsers,
      activeUsers,
      students,
      teachers,
      admins,
      recentUsers,
      averageProgress,
      topEmotions
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get user progress (admin only)
router.get('/users/:id/progress', verifyToken, isAdmin, async (req, res) => {
  try {
    const progress = await Progress.findOne({ userId: req.params.id });
    if (!progress) return res.status(404).json({ error: 'Progress data not found' });
    res.json(progress);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ error: 'Failed to fetch user progress' });
  }
});

// Get user emotion summary (admin only)
router.get('/users/:id/emotions', verifyToken, isAdmin, async (req, res) => {
  try {
    if (typeof Emotion.getEmotionSummary !== 'function') {
      throw new Error('Emotion.getEmotionSummary is not defined');
    }

    const emotionSummary = await Emotion.getEmotionSummary(req.params.id);
    res.json(emotionSummary);
  } catch (error) {
    console.error('Error fetching user emotions:', error);
    res.status(500).json({ error: 'Failed to fetch user emotions' });
  }
});

module.exports = router;
