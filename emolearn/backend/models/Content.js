const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  }
});

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  videoUrl: { type: String },
  duration: { type: Number }, // in minutes
  difficulty: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'], 
    default: 'beginner' 
  },
  prerequisites: [{ type: String }],
  learningObjectives: [{ type: String }],
  quiz: [quizQuestionSchema],
  funFacts: [{ type: String }],
  motivationalTips: [{ type: String }]
});

const contentSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    enum: [
      'mathematics', 'science', 'history', 'geography', 'english',
      'computer-science', 'physics', 'chemistry', 'biology', 'literature'
    ]
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  modules: [moduleSchema],
  isActive: { type: Boolean, default: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient subject queries
contentSchema.index({ subject: 1, isActive: 1 });

// Static method to get all subjects
contentSchema.statics.getAllSubjects = async function() {
  return await this.find({ isActive: true }).select('subject title description icon color');
};

// Static method to get subject with modules
contentSchema.statics.getSubjectContent = async function(subject) {
  return await this.findOne({ subject, isActive: true });
};

// Method to get adaptive content based on emotion
contentSchema.methods.getAdaptiveContent = function(emotion, moduleIndex = 0) {
  const module = this.modules[moduleIndex];
  if (!module) return null;

  let adaptiveContent = {
    module: module,
    adaptations: []
  };

  switch (emotion) {
    case 'confusion':
      adaptiveContent.adaptations = [
        { type: 'funFact', content: module.funFacts },
        { type: 'simplification', message: 'Let me break this down into simpler steps' }
      ];
      break;
    case 'boredom':
      adaptiveContent.adaptations = [
        { type: 'quiz', content: module.quiz },
        { type: 'gamification', message: 'Ready for a quick challenge?' }
      ];
      break;
    case 'frustration':
      adaptiveContent.adaptations = [
        { type: 'motivation', content: module.motivationalTips },
        { type: 'encouragement', message: 'You\'re doing great! Let\'s take it step by step.' }
      ];
      break;
    default:
      adaptiveContent.adaptations = [
        { type: 'standard', message: 'Continue with the regular content flow' }
      ];
  }

  return adaptiveContent;
};

module.exports = mongoose.model('Content', contentSchema);
