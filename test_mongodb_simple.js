const mongoose = require('mongoose');

// Use the same configuration as the backend
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect('mongodb://localhost:27017/emolearn');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Test a simple operation
    const testSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('SimpleTest', testSchema);
    
    // Create and save a test document
    const testDoc = new TestModel({ name: 'MongoDB Test' });
    const savedDoc = await testDoc.save();
    console.log('✅ Test document saved:', savedDoc._id);
    
    // Retrieve the document
    const foundDoc = await TestModel.findById(savedDoc._id);
    console.log('✅ Test document retrieved:', foundDoc.name);
    
    // Clean up
    await TestModel.findByIdAndDelete(savedDoc._id);
    console.log('✅ Test document deleted');
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

// Run the test
connectDB().then(success => {
  if (success) {
    console.log('🎉 MongoDB is working correctly!');
    process.exit(0);
  } else {
    console.log('❌ MongoDB connection failed');
    process.exit(1);
  }
});