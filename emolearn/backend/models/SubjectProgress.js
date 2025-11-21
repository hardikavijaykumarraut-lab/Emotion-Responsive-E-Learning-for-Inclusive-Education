const mongoose = require('mongoose');

// New schema for tracking individual subject progress with the exact structure you requested
const subjectProgressDetailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    enum: ['mathematics', 'science', 'history', 'programming', 'art', 'music', 
           'physicalEducation', 'languages', 'lifeSkills', 'computer-science', 
           'physics', 'chemistry', 'biology']
  },
  module: {
    type: String,
    required: true
  },
  moduleProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This will automatically add createdAt and updatedAt fields
});

// Create indexes for efficient queries
subjectProgressDetailSchema.index({ userId: 1, subject: 1, module: 1 });
subjectProgressDetailSchema.index({ userId: 1, createdAt: -1 });

// Add a pre-save hook to update the lastUpdated field
subjectProgressDetailSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('SubjectProgressDetail', subjectProgressDetailSchema);