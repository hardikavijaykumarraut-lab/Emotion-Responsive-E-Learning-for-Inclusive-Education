const mongoose = require('mongoose');

// Use the same configuration as the backend
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect('mongodb://localhost:27017/emolearn');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

// Test the SubjectProgressDetail model
const testSubjectProgressModel = async () => {
  try {
    // Load the SubjectProgressDetail model
    const SubjectProgressDetail = require('./emolearn/backend/models/SubjectProgress');
    
    console.log('Testing SubjectProgressDetail model...');
    
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
    
    // Test querying by user ID
    const userRecords = await SubjectProgressDetail.find({ userId: retrievedRecord.userId });
    console.log('✅ Found', userRecords.length, 'records for user');
    
    // Test querying by subject
    const subjectRecords = await SubjectProgressDetail.find({ subject: 'mathematics' });
    console.log('✅ Found', subjectRecords.length, 'records for mathematics subject');
    
    // Clean up - delete the test record
    await SubjectProgressDetail.findByIdAndDelete(savedRecord._id);
    console.log('✅ Successfully deleted test record');
    
    return true;
  } catch (error) {
    console.error('❌ Error with SubjectProgressDetail model:', error.message);
    return false;
  }
};

// Run the test
const runTest = async () => {
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }
  
  const success = await testSubjectProgressModel();
  
  // Close connection
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  
  if (success) {
    console.log('🎉 SubjectProgressDetail model is working correctly!');
    process.exit(0);
  } else {
    console.log('❌ SubjectProgressDetail model test failed');
    process.exit(1);
  }
};

runTest();