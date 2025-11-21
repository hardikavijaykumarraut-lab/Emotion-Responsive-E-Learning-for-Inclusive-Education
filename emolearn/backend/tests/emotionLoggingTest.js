const mongoose = require('mongoose');
const Emotion = require('../models/Emotion');
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
      userId: testUserId
    });
    
    progress.initializeDefaultAchievements();
    await progress.save();
    console.log('Created progress record:', progress._id);

    // Simulate emotion detection and logging
    const emotions = ['happy', 'engagement', 'confusion', 'boredom', 'frustration'];
    
    for (let i = 0; i < 5; i++) {
      const emotion = emotions[i];
      const confidence = Math.random();
      
      // Log to separate emotion collection
      const emotionLog = new Emotion({
        userId: testUserId,
        emotion: emotion,
        confidence: confidence,
        context: {
          subject: 'mathematics',
          activity: 'learning',
          moduleId: `module-${i+1}`,
          sessionId: 'test-session-' + Math.random().toString(36).substr(2, 9)
        },
        timestamp: new Date()
      });
      
      await emotionLog.save();
      
      // Also update progress record
      progress.currentEmotion = {
        emotion: emotion,
        confidence: confidence,
        timestamp: new Date()
      };
      
      // Add to emotion history (keep last 50 entries)
      progress.emotionHistory.unshift({
        emotion: emotion,
        confidence: confidence,
        timestamp: new Date()
      });
      
      progress.emotionHistory = progress.emotionHistory.slice(0, 50);
      await progress.save();
      
      console.log(`Logged emotion: ${emotion} (${(confidence * 100).toFixed(1)}% confidence)`);
    }
    
    // Retrieve and display emotion history
    const emotionHistory = await Emotion.find({ userId: testUserId }).sort({ timestamp: -1 });
    console.log('Emotion History:');
    emotionHistory.forEach(record => {
      console.log(`  ${record.emotion} (${(record.confidence * 100).toFixed(1)}% confidence) at ${record.timestamp}`);
    });
    
    // Retrieve and display current emotion from progress record
    const updatedProgress = await Progress.findOne({ userId: testUserId });
    if (updatedProgress && updatedProgress.currentEmotion) {
      console.log('Current Emotion in Progress Record:');
      console.log(`  ${updatedProgress.currentEmotion.emotion} (${(updatedProgress.currentEmotion.confidence * 100).toFixed(1)}% confidence)`);
    }

    // Clean up test data
    await Progress.deleteOne({ _id: progress._id });
    await Emotion.deleteMany({ userId: testUserId });
    console.log('Cleaned up test data');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
});