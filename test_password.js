const mongoose = require('mongoose');
const User = require('./emolearn/backend/models/User');

// Test the comparePassword method
async function testPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/emolearn', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Find the admin user
    const user = await User.findOne({ email: 'admin@emolearn.com' });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', user.email, 'Role:', user.role);
    
    // Test password comparison
    console.log('Testing password comparison...');
    const isMatch = await user.comparePassword('admin123');
    console.log('Password match result:', isMatch);
    
    // Test with wrong password
    const isMatchWrong = await user.comparePassword('wrongpassword');
    console.log('Wrong password match result:', isMatchWrong);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testPassword();