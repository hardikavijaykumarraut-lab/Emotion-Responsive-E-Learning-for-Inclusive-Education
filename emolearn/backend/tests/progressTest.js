const mongoose = require('mongoose');
const Progress = require('../models/Progress');

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

    // Simulate module completion
    const subjectData = progress.subjectProgress.mathematics;
    subjectData.modulesCompleted = 1;
    subjectData.progress = Math.round((subjectData.modulesCompleted / subjectData.totalModules) * 100);
    subjectData.lastAccessed = new Date();
    subjectData.timeSpent += 5; // 5 minutes
    
    // Update overall progress
    progress.calculateOverallProgress();
    
    // Add activity
    progress.addActivity({
      subject: 'mathematics',
      action: 'module_completed',
      timestamp: new Date(),
      type: 'module'
    });
    
    await progress.save();
    console.log('Updated progress after module completion');
    console.log('Mathematics progress:', progress.subjectProgress.mathematics.progress + '%');
    console.log('Overall progress:', progress.overallProgress + '%');

    // Simulate emotion logging
    await progress.updateEmotion('happy', 0.85);
    console.log('Logged emotion: happy (85% confidence)');

    // Retrieve and display progress summary
    const summary = progress.getProgressSummary();
    console.log('Progress Summary:', JSON.stringify(summary, null, 2));

    // Clean up test data
    await Progress.deleteOne({ _id: progress._id });
    console.log('Cleaned up test data');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
});