const mongoose = require('mongoose');

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/emolearn';

console.log('Attempting to connect to MongoDB at:', mongoUri);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

db.on('connected', () => {
  console.log('✅ Successfully connected to MongoDB');
  
  // Test creating a simple document
  const testSchema = new mongoose.Schema({
    name: String,
    timestamp: { type: Date, default: Date.now }
  });
  
  const TestModel = mongoose.model('Test', testSchema);
  
  const testDoc = new TestModel({ name: 'Connection Test' });
  
  testDoc.save()
    .then(doc => {
      console.log('✅ Successfully saved test document:', doc._id);
      return TestModel.findByIdAndDelete(doc._id);
    })
    .then(() => {
      console.log('✅ Successfully deleted test document');
      console.log('🎉 Database connection and operations are working correctly');
      mongoose.connection.close();
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error with database operations:', error);
      mongoose.connection.close();
      process.exit(1);
    });
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
}, 10000);