const mongoose = require('mongoose');

const emotionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emotion: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral', 'confused'],
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  context: {
    subject: { type: String },
    activity: { type: String },
    moduleId: { type: String },
    sessionId: { type: String }
  },
  detectionData: {
    faceDetected: { type: Boolean, default: true },
    expressions: {
      neutral: { type: Number, default: 0 },
      happy: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
      angry: { type: Number, default: 0 },
      fearful: { type: Number, default: 0 },
      disgusted: { type: Number, default: 0 },
      surprised: { type: Number, default: 0 },
      confused: { type: Number, default: 0 }
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
emotionLogSchema.index({ userId: 1, timestamp: -1 });
emotionLogSchema.index({ userId: 1, emotion: 1 });

// Static method to get emotion summary for a user
emotionLogSchema.statics.getEmotionSummary = async function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          emotion: '$emotion',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          }
        },
        avgConfidence: { $avg: '$confidence' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        emotions: {
          $push: {
            emotion: '$_id.emotion',
            confidence: '$avgConfidence',
            count: '$count'
          }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ];
  
  return await this.aggregate(pipeline);
};

// Static method to get real-time emotion trends
emotionLogSchema.statics.getRealtimeTrends = async function(userId, minutes = 30) {
  const startTime = new Date();
  startTime.setMinutes(startTime.getMinutes() - minutes);
  
  return await this.find({
    userId: new mongoose.Types.ObjectId(userId),
    timestamp: { $gte: startTime }
  }).sort({ timestamp: -1 }).limit(50);
};

module.exports = mongoose.model('Emotion', emotionLogSchema);