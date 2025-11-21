const mongoose = require('mongoose');
const Emotion = require('./emolearn/backend/models/Emotion');
const Progress = require('./emolearn/backend/models/Progress');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/emolearn', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testEmotionSaving() {
  try {
    console.log('Testing emotion saving...');
    
    // Create a test user ID (you'll need to replace this with an actual user ID from your database)
    const testUserId = '64f8b2c3d4e5f6a7b8c9d0e1'; // Replace with actual user ID
    
    // Test emotion data
    const testEmotion = new Emotion({
      userId: testUserId,
      emotion: 'happy',
      confidence: 0.85,
      context: {
        subject: 'mathematics',
        activity: 'learning',
        moduleId: 'module-1'
      }
    });
    
    // Save the emotion
    await testEmotion.save();
    console.log('Emotion saved successfully:', testEmotion._id);
    
    // Test progress update
    let progress = await Progress.findOne({ userId: testUserId });
    
    if (!progress) {
      progress = new Progress({ userId: testUserId });
      progress.initializeDefaultAchievements();
      await progress.save();
    }
    
    // Update current emotion in progress
    progress.currentEmotion = {
      emotion: 'happy',
      confidence: 0.85,
      timestamp: new Date()
    };
    
    // Add to emotion history
    progress.emotionHistory.unshift({
      emotion: 'happy',
      confidence: 0.85,
      timestamp: new Date()
    });
    
    progress.emotionHistory = progress.emotionHistory.slice(0, 50);
    await progress.save();
    
    console.log('Progress updated successfully');
    
    // Verify the data was saved
    const savedEmotion = await Emotion.findById(testEmotion._id);
    console.log('Retrieved emotion:', savedEmotion);
    
    const updatedProgress = await Progress.findOne({ userId: testUserId });
    console.log('Current emotion in progress:', updatedProgress.currentEmotion);
    console.log('Emotion history length:', updatedProgress.emotionHistory.length);
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

testEmotionSaving();