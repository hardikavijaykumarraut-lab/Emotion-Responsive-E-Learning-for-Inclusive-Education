const mongoose = require('mongoose');
const Progress = require('./backend/models/Progress');
const Emotion = require('./backend/models/Emotion');

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/emolearn';
console.log('Connecting to MongoDB at:', mongoUri);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('✅ Connected to MongoDB');

  try {
    // Test 1: Create a test user ID
    const testUserId = new mongoose.Types.ObjectId();
    console.log('📝 Test User ID:', testUserId);

    // Test 2: Create and save a progress record
    console.log('\n--- Testing Progress Tracking ---');
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
    const savedProgress = await progress.save();
    console.log('✅ Progress record created successfully');

    // Test 3: Update progress (simulate module completion)
    const subjectData = savedProgress.subjectProgress.mathematics;
    subjectData.modulesCompleted = 1;
    subjectData.progress = Math.round((subjectData.modulesCompleted / subjectData.totalModules) * 100);
    subjectData.lastAccessed = new Date();
    subjectData.timeSpent += 300; // 5 minutes
    
    savedProgress.calculateOverallProgress();
    savedProgress.activeMinutes += 5;
    
    await savedProgress.save();
    console.log('✅ Progress updated successfully');
    console.log('   Mathematics progress:', subjectData.progress + '%');
    console.log('   Overall progress:', savedProgress.overallProgress + '%');

    // Test 4: Log emotion data
    console.log('\n--- Testing Emotion Logging ---');
    const emotionLog = new Emotion({
      userId: testUserId,
      emotion: 'happy',
      confidence: 0.85,
      context: {
        subject: 'mathematics',
        activity: 'learning',
        moduleId: 'module-1'
      },
      timestamp: new Date()
    });
    
    await emotionLog.save();
    console.log('✅ Emotion logged successfully');

    // Test 5: Retrieve and verify data
    console.log('\n--- Verifying Data ---');
    const retrievedProgress = await Progress.findOne({ userId: testUserId });
    console.log('✅ Progress retrieval successful');
    console.log('   Retrieved progress:', retrievedProgress.overallProgress + '%');
    
    const retrievedEmotions = await Emotion.find({ userId: testUserId });
    console.log('✅ Emotion retrieval successful');
    console.log('   Number of emotions logged:', retrievedEmotions.length);
    if (retrievedEmotions.length > 0) {
      console.log('   Last emotion:', retrievedEmotions[0].emotion, 
                  '(' + (retrievedEmotions[0].confidence * 100).toFixed(1) + '% confidence)');
    }

    // Test 6: Clean up test data
    console.log('\n--- Cleaning Up ---');
    await Progress.deleteOne({ userId: testUserId });
    await Emotion.deleteMany({ userId: testUserId });
    console.log('✅ Test data cleaned up successfully');

    console.log('\n🎉 All tests passed! The system is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
});