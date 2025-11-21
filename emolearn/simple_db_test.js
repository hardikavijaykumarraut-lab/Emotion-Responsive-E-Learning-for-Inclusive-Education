const mongoose = require('mongoose');

// Simple test to verify MongoDB connectivity
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/emolearn';
console.log('Connecting to MongoDB at:', mongoUri);

mongoose.connect(mongoUri, {
  // Remove deprecated options
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('✅ Connected to MongoDB successfully');
  
  // Create a simple schema and model
  const testSchema = new mongoose.Schema({
    name: String,
    timestamp: { type: Date, default: Date.now }
  });
  
  const TestModel = mongoose.model('SimpleTest', testSchema);
  
  try {
    // Test creating a document
    const testDoc = new TestModel({ name: 'Connection Test' });
    const savedDoc = await testDoc.save();
    console.log('✅ Successfully saved test document:', savedDoc._id);
    
    // Test retrieving the document
    const retrievedDoc = await TestModel.findById(savedDoc._id);
    console.log('✅ Successfully retrieved test document:', retrievedDoc.name);
    
    // Test deleting the document
    await TestModel.findByIdAndDelete(savedDoc._id);
    console.log('✅ Successfully deleted test document');
    
    console.log('🎉 All database operations completed successfully');
    
  } catch (error) {
    console.error('❌ Database operation failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
});

// Timeout handling
setTimeout(() => {
  console.log('❌ Connection timeout - could not connect to MongoDB');
  process.exit(1);
}, 15000);