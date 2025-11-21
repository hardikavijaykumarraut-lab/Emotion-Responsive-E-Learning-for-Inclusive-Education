const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  earned: { type: Boolean, default: false },
  earnedDate: { type: Date }
});

const activitySchema = new mongoose.Schema({
  subject: { type: String, required: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  score: { type: Number },
  type: { 
    type: String, 
    enum: ['quiz', 'content', 'module', 'assignment'],
    required: true 
  }
});

const subjectProgressSchema = new mongoose.Schema({
  progress: { type: Number, default: 0, min: 0, max: 100 },
  modulesCompleted: { type: Number, default: 0 },
  totalModules: { type: Number, default: 3 },
  lastAccessed: { type: Date, default: Date.now },
  timeSpent: { type: Number, default: 0 }, // in minutes
  averageScore: { type: Number, default: 0 }
});

// Remove the separate emotionHistorySchema since we're using a simpler approach
// The emotionHistory will be stored directly in the emotionHistory field

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  activeMinutes: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  currentEmotion: {
    emotion: String,
    confidence: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  emotionHistory: [{
    emotion: String,
    confidence: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  totalPoints: { type: Number, default: 0 },
  weeklyGoal: { type: Number, default: 300 },
  weeklyProgress: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  subjectProgress: {
    mathematics: { type: subjectProgressSchema, default: () => ({}) },
    science: { type: subjectProgressSchema, default: () => ({}) },
    history: { type: subjectProgressSchema, default: () => ({}) },
    programming: { type: subjectProgressSchema, default: () => ({}) },
    art: { type: subjectProgressSchema, default: () => ({}) },
    music: { type: subjectProgressSchema, default: () => ({}) },
    physicalEducation: { type: subjectProgressSchema, default: () => ({}) },
    languages: { type: subjectProgressSchema, default: () => ({}) },
    lifeSkills: { type: subjectProgressSchema, default: () => ({}) },
    'computer-science': { type: subjectProgressSchema, default: () => ({}) },
    physics: { type: subjectProgressSchema, default: () => ({}) },
    chemistry: { type: subjectProgressSchema, default: () => ({}) },
    biology: { type: subjectProgressSchema, default: () => ({}) }
  },
  recentActivity: [activitySchema],
  achievements: [achievementSchema],
  lastReset: { type: Date, default: Date.now }
});

// Add activity to recent activities (keep last 10)
progressSchema.methods.addActivity = function(activityData) {
  const activity = { ...activityData, timestamp: new Date() };
  this.recentActivity.unshift(activity);
  this.recentActivity = this.recentActivity.slice(0, 10);
  this.lastUpdated = new Date();
  this.lastActive = new Date();
  // Save the progress record immediately to ensure real-time updates
  return this.save();
};

// Calculate overall progress based on subject progresses
progressSchema.methods.calculateOverallProgress = function() {
  const subjects = Object.values(this.subjectProgress || {}).filter(subj => subj && subj.progress !== undefined);
  if (subjects.length === 0) {
    this.overallProgress = 0;
    return;
  }
  
  const totalProgress = subjects.reduce((sum, subject) => {
    return sum + (subject.progress || 0);
  }, 0);
  
  this.overallProgress = Math.round(totalProgress / subjects.length);
  this.lastUpdated = new Date();
};

// Update weekly progress reset
progressSchema.methods.checkWeeklyReset = function() {
  const now = new Date();
  const lastReset = this.lastReset || now;
  const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
  
  if (daysSinceReset >= 7) {
    this.weeklyProgress = 0;
    this.lastReset = now;
  }
  // Don't save here to prevent parallel save issues
};

// Pre-save hook to calculate overall progress
progressSchema.pre('save', function(next) {
  // Always calculate overall progress on save
  this.calculateOverallProgress();
  this.checkWeeklyReset();
  next();
});

// Add a method to initialize default achievements if they don't exist
progressSchema.methods.initializeDefaultAchievements = function() {
  if (!this.achievements || this.achievements.length === 0) {
    this.achievements = [
      {
        id: 1,
        title: "First Steps",
        description: "Complete your first module",
        icon: "👣",
        earned: false
      },
      {
        id: 2,
        title: "Streak Builder",
        description: "Maintain a 3-day study streak",
        icon: "🔥",
        earned: false
      },
      {
        id: 3,
        title: "Quiz Master",
        description: "Score 90% or higher on a quiz",
        icon: "🏆",
        earned: false
      },
      {
        id: 4,
        title: "Time Manager",
        description: "Study for 60 minutes in one session",
        icon: "⏱️",
        earned: false
      },
      {
        id: 5,
        title: "Subject Specialist",
        description: "Complete all modules in one subject",
        icon: "📚",
        earned: false
      },
      {
        id: 6,
        title: "Emotion Explorer",
        description: "Detect all basic emotions",
        icon: "😊",
        earned: false
      }
    ];
  }
};

// Add a method to update emotion
progressSchema.methods.updateEmotion = function(emotion, confidence) {
  this.currentEmotion = {
    emotion,
    confidence,
    timestamp: new Date()
  };
  
  // Add to emotion history (keep last 50 entries)
  this.emotionHistory.unshift({
    emotion,
    confidence,
    timestamp: new Date()
  });
  
  this.emotionHistory = this.emotionHistory.slice(0, 50);
  this.lastActive = new Date();
  
  return this.save();
};

// Add a method to update activity time
progressSchema.methods.updateActivityTime = function(minutes) {
  this.activeMinutes += minutes;
  this.lastActive = new Date();
  return this.save();
};

// Add a method to get progress summary
progressSchema.methods.getProgressSummary = function() {
  const subjects = Object.entries(this.subjectProgress || {})
    .filter(([_, data]) => data && data.progress !== undefined)
    .map(([subject, data]) => ({
      subject,
      progress: data.progress || 0,
      modulesCompleted: data.modulesCompleted || 0,
      totalModules: data.totalModules || 3,
      lastAccessed: data.lastAccessed
    }));
    
  return {
    userId: this.userId,
    overallProgress: this.overallProgress,
    activeMinutes: this.activeMinutes,
    lastActive: this.lastActive,
    currentStreak: this.currentStreak,
    longestStreak: this.longestStreak,
    weeklyProgress: this.weeklyProgress,
    weeklyGoal: this.weeklyGoal,
    subjects
  };
};

// Add lastStudyDate field to track study streaks
progressSchema.add({
  lastStudyDate: { type: Date }
});

module.exports = mongoose.model('Progress', progressSchema);