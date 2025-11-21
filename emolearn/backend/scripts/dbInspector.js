const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emolearn');

// Import models
const Emotion = require('../models/Emotion');
const User = require('../models/User');

async function inspectDatabase() {
  try {
    console.log('🔍 Database Inspector Started\n');
    
    // Count documents in each collection
    const emotionCount = await Emotion.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log(`📊 Collection Counts:`);
    console.log(`   Emotions: ${emotionCount}`);
    console.log(`   Users: ${userCount}\n`);
    
    // Show recent emotions
    console.log('🎭 Recent Emotions:');
    const recentEmotions = await Emotion.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .populate('userId', 'name email');
    
    recentEmotions.forEach((emotion, index) => {
      console.log(`   ${index + 1}. ${emotion.emotion} (${emotion.confidence.toFixed(2)}) - ${emotion.timestamp}`);
    });
    
    // Show emotion distribution
    console.log('\n📈 Emotion Distribution:');
    const emotionStats = await Emotion.aggregate([
      { $group: { _id: '$emotion', count: { $sum: 1 }, avgConfidence: { $avg: '$confidence' } } },
      { $sort: { count: -1 } }
    ]);
    
    emotionStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} times (avg confidence: ${stat.avgConfidence.toFixed(2)})`);
    });
    
  } catch (error) {
    console.error('Error inspecting database:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run inspector
inspectDatabase();
