const mongoose = require('mongoose');
require('dotenv').config();
const Progress = require('../../models/Progress');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emolearn';

async function migrate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find all progress documents
    const progressDocs = await Progress.find({});
    console.log(`Found ${progressDocs.length} progress documents to update`);

    let updatedCount = 0;

    // Update each document
    for (const doc of progressDocs) {
      // Calculate overall progress as the average of all subject progresses
      const subjects = Object.keys(doc.subjectProgress || {});
      const totalProgress = subjects.reduce((sum, subject) => {
        return sum + (doc.subjectProgress[subject]?.progress || 0);
      }, 0);
      
      const averageProgress = subjects.length > 0 
        ? Math.round(totalProgress / subjects.length)
        : 0;

      // Only update if the calculated progress is different
      if (doc.overallProgress !== averageProgress) {
        doc.overallProgress = averageProgress;
        await doc.save();
        updatedCount++;
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} documents.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
