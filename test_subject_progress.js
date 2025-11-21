const mongoose = require('mongoose');

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/emolearn';

console.log('Attempting to connect to MongoDB at:', mongoUri);

mongoose.connect(mongoUri);

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

db.on('connected', async () => {
  console.log('✅ Successfully connected to MongoDB');
  
  try {
    // Load the SubjectProgressDetail model
    const SubjectProgressDetail = require('./emolearn/backend/models/SubjectProgress');
    
    // Create a test subject progress record
    const testSubjectProgress = new SubjectProgressDetail({
      userId: new mongoose.Types.ObjectId(),
      subject: 'mathematics',
      module: 'Module 1',
      moduleProgress: 75,
      timeSpent: 30
    });
    
    // Save the test record
    const savedRecord = await testSubjectProgress.save();
    console.log('✅ Successfully saved subject progress record:', savedRecord._id);
    
    // Retrieve the record to verify it was saved correctly
    const retrievedRecord = await SubjectProgressDetail.findById(savedRecord._id);
    console.log('✅ Successfully retrieved subject progress record:');
    console.log('  User ID:', retrievedRecord.userId);
    console.log('  Subject:', retrievedRecord.subject);
    console.log('  Module:', retrievedRecord.module);
    console.log('  Progress:', retrievedRecord.moduleProgress + '%');
    console.log('  Time Spent:', retrievedRecord.timeSpent + ' minutes');
    console.log('  Created At:', retrievedRecord.createdAt);
    console.log('  Updated At:', retrievedRecord.updatedAt);
    
    // Clean up - delete the test record
    await SubjectProgressDetail.findByIdAndDelete(savedRecord._id);
    console.log('✅ Successfully deleted test record');
    
    console.log('🎉 Subject progress data storage is working correctly');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error with subject progress operations:', error);
    mongoose.connection.close();
    process.exit(1);
  }
});

db.on('disconnected', () => {
  console.log(' MongoDB disconnected');
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT. Closing MongoDB connection');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });
});

setTimeout(() => {
  console.log('❌ Connection timeout - could not connect to MongoDB');
  process.exit(1);
}, 30000);