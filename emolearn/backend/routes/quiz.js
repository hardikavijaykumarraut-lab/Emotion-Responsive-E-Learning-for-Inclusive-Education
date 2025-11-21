const express = require('express');
const router = express.Router();
const { learningContent } = require('../data/learningContent');

// In-memory storage for quiz results (replace with Firebase in production)
let quizResults = [];

// Get random quiz for subject
router.get('/subjects/:subjectId/random', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject = learningContent[subjectId];
    
    if (!subject || !subject.quizzes || subject.quizzes.length === 0) {
      return res.status(404).json({ error: 'No quizzes found for this subject' });
    }
    
    const randomIndex = Math.floor(Math.random() * subject.quizzes.length);
    const quiz = subject.quizzes[randomIndex];
    
    // Don't send the correct answer to the client
    const { correct, explanation, ...quizData } = quiz;
    
    res.json({
      success: true,
      data: {
        ...quizData,
        quizId: `${subjectId}_${randomIndex}`,
        subject: subject.name,
        subjectId
      }
    });
  } catch (error) {
    console.error('Error fetching random quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Get all quizzes for subject
router.get('/subjects/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject = learningContent[subjectId];
    
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    // Remove correct answers and explanations from response
    const quizzes = subject.quizzes.map((quiz, index) => {
      const { correct, explanation, ...quizData } = quiz;
      return {
        ...quizData,
        quizId: `${subjectId}_${index}`
      };
    });
    
    res.json({
      success: true,
      data: {
        quizzes,
        subject: subject.name,
        subjectId,
        total: quizzes.length
      }
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Submit quiz answer
router.post('/submit', async (req, res) => {
  try {
    const { quizId, selectedAnswer, userId, timeSpent } = req.body;
    
    if (!quizId || selectedAnswer === undefined) {
      return res.status(400).json({ error: 'Quiz ID and selected answer are required' });
    }
    
    // Parse quiz ID to get subject and quiz index
    const [subjectId, quizIndex] = quizId.split('_');
    const subject = learningContent[subjectId];
    
    if (!subject || !subject.quizzes[parseInt(quizIndex)]) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    const quiz = subject.quizzes[parseInt(quizIndex)];
    const isCorrect = parseInt(selectedAnswer) === quiz.correct;
    
    // Store quiz result
    const result = {
      id: Date.now().toString(),
      quizId,
      subjectId,
      userId: userId || 'demo-user',
      selectedAnswer: parseInt(selectedAnswer),
      correctAnswer: quiz.correct,
      isCorrect,
      timeSpent: timeSpent || 0,
      timestamp: new Date().toISOString()
    };
    
    quizResults.push(result);
    
    // Keep only last 1000 results to prevent memory issues
    if (quizResults.length > 1000) {
      quizResults = quizResults.slice(-1000);
    }
    
    res.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: quiz.correct,
        explanation: quiz.explanation,
        selectedAnswer: parseInt(selectedAnswer)
      }
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get quiz results for user
router.get('/results/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || 'demo-user';
    const { subject, limit = 50 } = req.query;
    
    let filteredResults = quizResults.filter(result => result.userId === userId);
    
    if (subject) {
      filteredResults = filteredResults.filter(result => result.subjectId === subject);
    }
    
    // Sort by timestamp (newest first) and limit results
    const sortedResults = filteredResults
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: sortedResults,
      total: filteredResults.length
    });
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({ error: 'Failed to fetch quiz results' });
  }
});

// Get quiz analytics
router.get('/analytics/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || 'demo-user';
    const { subject, timeframe = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '1d':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }
    
    let filteredResults = quizResults.filter(result => 
      result.userId === userId && 
      new Date(result.timestamp) >= startDate
    );
    
    if (subject) {
      filteredResults = filteredResults.filter(result => result.subjectId === subject);
    }
    
    // Calculate statistics
    const totalQuizzes = filteredResults.length;
    const correctAnswers = filteredResults.filter(result => result.isCorrect).length;
    const accuracy = totalQuizzes > 0 ? (correctAnswers / totalQuizzes * 100).toFixed(1) : 0;
    
    // Subject breakdown
    const subjectStats = {};
    filteredResults.forEach(result => {
      if (!subjectStats[result.subjectId]) {
        subjectStats[result.subjectId] = {
          total: 0,
          correct: 0,
          accuracy: 0
        };
      }
      subjectStats[result.subjectId].total++;
      if (result.isCorrect) {
        subjectStats[result.subjectId].correct++;
      }
    });
    
    // Calculate accuracy for each subject
    Object.keys(subjectStats).forEach(subjectId => {
      const stats = subjectStats[subjectId];
      stats.accuracy = stats.total > 0 ? (stats.correct / stats.total * 100).toFixed(1) : 0;
      stats.subjectName = learningContent[subjectId]?.name || subjectId;
    });
    
    // Recent performance trend (last 10 quizzes)
    const recentQuizzes = filteredResults
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-10);
    
    const performanceTrend = recentQuizzes.map((result, index) => ({
      quiz: index + 1,
      correct: result.isCorrect ? 1 : 0,
      timestamp: result.timestamp
    }));
    
    res.json({
      success: true,
      data: {
        timeframe,
        totalQuizzes,
        correctAnswers,
        accuracy: parseFloat(accuracy),
        subjectBreakdown: subjectStats,
        performanceTrend
      }
    });
  } catch (error) {
    console.error('Error generating quiz analytics:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

module.exports = router;
