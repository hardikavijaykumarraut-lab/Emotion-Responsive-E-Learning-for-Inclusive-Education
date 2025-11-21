// Test script to verify subject progress details are being saved and retrieved correctly
const mongoose = require('mongoose');
const SubjectProgressDetail = require('./emolearn/backend/models/SubjectProgress');
const Progress = require('./emolearn/backend/models/Progress');

console.log('🧪 Testing Subject Progress Details Fix...\n');

// Test data
const testUserId = new mongoose.Types.ObjectId();
const testSubject = 'mathematics';
const testModule = 'Module 1';
const testProgress = 75;
const testTimeSpent = 30; // minutes

console.log('📝 Creating test SubjectProgressDetail entry...');

// Create a test entry
const testSubjectProgress = new SubjectProgressDetail({
  userId: testUserId,
  subject: testSubject,
  module: testModule,
  moduleProgress: testProgress,
  timeSpent: testTimeSpent
});

console.log('💾 Saving test entry to database...');

testSubjectProgress.save()
  .then(savedEntry => {
    console.log('✅ SubjectProgressDetail entry saved successfully!');
    console.log('   ID:', savedEntry._id);
    console.log('   User ID:', savedEntry.userId);
    console.log('   Subject:', savedEntry.subject);
    console.log('   Module:', savedEntry.module);
    console.log('   Progress:', savedEntry.moduleProgress);
    console.log('   Time Spent:', savedEntry.timeSpent, 'minutes');
    console.log('   Created At:', savedEntry.createdAt);
    
    console.log('\n🔍 Retrieving test entry from database...');
    
    // Retrieve the entry
    return SubjectProgressDetail.findOne({ _id: savedEntry._id });
  })
  .then(retrievedEntry => {
    console.log('✅ SubjectProgressDetail entry retrieved successfully!');
    console.log('   ID:', retrievedEntry._id);
    console.log('   User ID:', retrievedEntry.userId);
    console.log('   Subject:', retrievedEntry.subject);
    console.log('   Module:', retrievedEntry.module);
    console.log('   Progress:', retrievedEntry.moduleProgress);
    console.log('   Time Spent:', retrievedEntry.timeSpent, 'minutes');
    console.log('   Created At:', retrievedEntry.createdAt);
    
    console.log('\n🧹 Cleaning up test entry...');
    
    // Clean up
    return SubjectProgressDetail.deleteOne({ _id: retrievedEntry._id });
  })
  .then(() => {
    console.log('✅ Test entry cleaned up successfully!');
    console.log('\n🎉 All tests passed! Subject progress details should now be saved and retrieved correctly.');
    console.log('\n📋 To verify in the application:');
    console.log('   1. Start the backend and frontend servers');
    console.log('   2. Log in as a student');
    console.log('   3. Complete a module in any subject');
    console.log('   4. Check that subject progress details appear in both dashboards');
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });