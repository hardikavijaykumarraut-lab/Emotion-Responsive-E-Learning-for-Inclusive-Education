const mongoose = require('mongoose');
const Progress = require('../models/Progress');
const SubjectProgressDetail = require('../models/SubjectProgress');

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/emolearn';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Create a test user ID
    const testUserId = new mongoose.Types.ObjectId();

    // Create a new progress record
    let progress = new Progress({ 
      userId: testUserId,
      subjectProgress: {
        mathematics: {
          progress: 0,
          modulesCompleted: 0,
          totalModules: 3,
          lastAccessed: new Date(),
          timeSpent: 0,
          averageScore: 0
        }
      }
    });
    
    progress.initializeDefaultAchievements();
    await progress.save();
    console.log('Created progress record:', progress._id);

    // Simulate module completion with detailed tracking
    const subjectData = progress.subjectProgress.mathematics;
    subjectData.modulesCompleted = 1;
    subjectData.progress = Math.round((subjectData.modulesCompleted / subjectData.totalModules) * 100);
    subjectData.lastAccessed = new Date();
    subjectData.timeSpent += 300; // 300 seconds (5 minutes)
    
    // Update overall progress
    progress.calculateOverallProgress();
    progress.activeMinutes += 5; // 5 minutes
    
    // Add activity
    progress.addActivity({
      subject: 'mathematics',
      action: 'module_1_completed',
      timestamp: new Date(),
      type: 'module'
    });
    
    await progress.save();
    
    // Also save to the new detailed progress tracking table
    const subjectProgressDetail = new SubjectProgressDetail({
      userId: testUserId,
      subject: 'mathematics',
      module: 'Module 1',
      moduleProgress: 100, // Since module is completed
      timeSpent: 5 // 5 minutes
    });
    
    await subjectProgressDetail.save();
    console.log('Updated progress after module completion');
    console.log('Mathematics progress:', progress.subjectProgress.mathematics.progress + '%');
    console.log('Overall progress:', progress.overallProgress + '%');
    
    // Retrieve and display detailed progress
    const detailedProgress = await SubjectProgressDetail.find({ userId: testUserId });
    console.log('Detailed Progress Records:');
    detailedProgress.forEach(record => {
      console.log(`  ID: ${record._id}`);
      console.log(`  Subject: ${record.subject}`);
      console.log(`  Module: ${record.module}`);
      console.log(`  Progress: ${record.moduleProgress}%`);
      console.log(`  Time Spent: ${record.timeSpent} minutes`);
      console.log(`  Last Updated: ${record.updatedAt}`);
      console.log('---');
    });

    // Clean up test data
    await Progress.deleteOne({ _id: progress._id });
    await SubjectProgressDetail.deleteMany({ userId: testUserId });
    console.log('Cleaned up test data');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
});