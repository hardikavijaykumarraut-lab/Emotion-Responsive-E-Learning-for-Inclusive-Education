import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Box,
  LinearProgress,
  Alert,
  Chip,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Quiz as QuizIcon,
  CheckCircle as CheckIcon,
  Cancel as WrongIcon
} from '@mui/icons-material';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useAuth } from '../../contexts/AuthContext';
import { trackQuizCompletion, unlockAchievement } from '../../services/progressService';

const quizData = {
  mathematics: [
    {
      question: "What is 15 × 8?",
      options: ["120", "125", "115", "130"],
      correct: 0,
      explanation: "15 × 8 = 120. You can think of it as (10 × 8) + (5 × 8) = 80 + 40 = 120"
    },
    {
      question: "What is the square root of 144?",
      options: ["11", "12", "13", "14"],
      correct: 1,
      explanation: "√144 = 12 because 12 × 12 = 144"
    },
    {
      question: "If a triangle has angles of 60°, 60°, and 60°, what type of triangle is it?",
      options: ["Right triangle", "Equilateral triangle", "Isosceles triangle", "Scalene triangle"],
      correct: 1,
      explanation: "An equilateral triangle has all three angles equal to 60°"
    }
  ],
  science: [
    {
      question: "What is the chemical symbol for gold?",
      options: ["Go", "Gd", "Au", "Ag"],
      correct: 2,
      explanation: "Au comes from the Latin word 'aurum' meaning gold"
    },
    {
      question: "How many bones are in an adult human body?",
      options: ["196", "206", "216", "226"],
      correct: 1,
      explanation: "An adult human has 206 bones, while babies are born with about 270 bones"
    },
    {
      question: "What gas do plants absorb from the atmosphere during photosynthesis?",
      options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
      correct: 2,
      explanation: "Plants absorb CO₂ and release oxygen during photosynthesis"
    }
  ],
  history: [
    {
      question: "In which year did World War II end?",
      options: ["1944", "1945", "1946", "1947"],
      correct: 1,
      explanation: "World War II ended in 1945 with the surrender of Japan in September"
    },
    {
      question: "Who was the first person to walk on the moon?",
      options: ["Buzz Aldrin", "Neil Armstrong", "John Glenn", "Alan Shepard"],
      correct: 1,
      explanation: "Neil Armstrong was the first person to walk on the moon on July 20, 1969"
    }
  ],
  geography: [
    {
      question: "What is the capital of Australia?",
      options: ["Sydney", "Melbourne", "Canberra", "Perth"],
      correct: 2,
      explanation: "Canberra is the capital city of Australia, not Sydney or Melbourne"
    },
    {
      question: "Which is the longest river in the world?",
      options: ["Amazon River", "Nile River", "Mississippi River", "Yangtze River"],
      correct: 1,
      explanation: "The Nile River is approximately 6,650 km long, making it the longest river"
    }
  ]
};

const QuizModal = ({ open, onClose, subject = 'mathematics' }) => {
  const { announceToScreenReader } = useAccessibility();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  const questions = quizData[subject] || quizData.mathematics;

  useEffect(() => {
    let interval;
    if (open && !quizComplete) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [open, quizComplete]);

  useEffect(() => {
    if (open) {
      setCurrentQuestion(0);
      setSelectedAnswer('');
      setShowResult(false);
      setScore(0);
      setAnswers([]);
      setQuizComplete(false);
      setTimeSpent(0);
      announceToScreenReader('Quiz started');
    }
  }, [open, announceToScreenReader]);

  const handleAnswerChange = (event) => {
    setSelectedAnswer(event.target.value);
  };

  const handleSubmitAnswer = () => {
    const isCorrect = parseInt(selectedAnswer) === questions[currentQuestion].correct;
    const newAnswers = [...answers, {
      question: currentQuestion,
      selected: parseInt(selectedAnswer),
      correct: questions[currentQuestion].correct,
      isCorrect
    }];
    
    setAnswers(newAnswers);
    setShowResult(true);
    
    if (isCorrect) {
      setScore(score + 1);
      announceToScreenReader('Correct answer!');
    } else {
      announceToScreenReader('Incorrect answer. The correct answer is shown.');
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
      setShowResult(false);
      announceToScreenReader(`Question ${currentQuestion + 2} of ${questions.length}`);
    } else {
      // Quiz is complete
      setQuizComplete(true);
      const finalScore = Math.round((score / questions.length) * 100);
      announceToScreenReader(`Quiz completed! Your score is ${finalScore}%`);
      
      // Track quiz completion and unlock achievements
      if (user && user._id) {
        try {
          // Track quiz completion in progress system
          await trackQuizCompletion(user._id, subject, finalScore, timeSpent);
          
          // Check for achievements
          if (finalScore === 100) {
            // Perfect score achievement
            await unlockAchievement(user._id, 5); // Perfect Score achievement
          }
          
          // Track number of quizzes completed for other achievements
          // This would require additional logic to count total quizzes
        } catch (error) {
          console.error('Error tracking quiz completion:', error);
        }
      }
    }
  };

  const handleClose = () => {
    onClose();
    announceToScreenReader('Quiz closed');
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="quiz-dialog-title"
    >
      <DialogTitle id="quiz-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <QuizIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              {subject.charAt(0).toUpperCase() + subject.slice(1)} Quiz
            </Typography>
          </Box>
          <IconButton onClick={handleClose} aria-label="Close quiz">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!quizComplete ? (
          <>
            {/* Progress Bar */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  Question {currentQuestion + 1} of {questions.length}
                </Typography>
                <Typography variant="body2">
                  Score: {score}/{currentQuestion + (showResult ? 1 : 0)}
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress} />
            </Box>

            {/* Question */}
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              {currentQ.question}
            </Typography>

            {/* Answer Options */}
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={selectedAnswer}
                onChange={handleAnswerChange}
                disabled={showResult}
              >
                {currentQ.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={index.toString()}
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Typography>{option}</Typography>
                        {showResult && (
                          <Box sx={{ ml: 'auto' }}>
                            {index === currentQ.correct ? (
                              <CheckIcon color="success" />
                            ) : index === parseInt(selectedAnswer) ? (
                              <WrongIcon color="error" />
                            ) : null}
                          </Box>
                        )}
                      </Box>
                    }
                    sx={{
                      mb: 1,
                      p: 1,
                      border: '1px solid',
                      borderColor: showResult ? 
                        (index === currentQ.correct ? 'success.main' : 
                         index === parseInt(selectedAnswer) ? 'error.main' : 'grey.300') : 
                        'grey.300',
                      borderRadius: 1,
                      backgroundColor: showResult ?
                        (index === currentQ.correct ? 'success.light' :
                         index === parseInt(selectedAnswer) ? 'error.light' : 'transparent') :
                        'transparent'
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            {/* Explanation */}
            {showResult && (
              <Alert 
                severity={answers[answers.length - 1]?.isCorrect ? 'success' : 'info'}
                sx={{ mt: 2 }}
              >
                <Typography variant="body2">
                  {currentQ.explanation}
                </Typography>
              </Alert>
            )}
          </>
        ) : (
          /* Quiz Complete */
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h4" gutterBottom>
              Quiz Complete! 🎉
            </Typography>
            <Typography variant="h6" gutterBottom>
              Your Score
            </Typography>
            <Chip
              label={`${score}/${questions.length} (${Math.round((score / questions.length) * 100)}%)`}
              color={getScoreColor(Math.round((score / questions.length) * 100))}
              size="large"
              sx={{ fontSize: '1.2rem', py: 3, px: 2, mb: 3 }}
            />
            <Typography variant="body1" color="text.secondary">
              {score === questions.length ? 'Perfect score! Excellent work!' :
               score >= questions.length * 0.8 ? 'Great job! You\'re doing well!' :
               score >= questions.length * 0.6 ? 'Good effort! Keep practicing!' :
               'Keep learning! You\'ll improve with practice!'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Time spent: {Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, '0')}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {!quizComplete ? (
          <>
            <Button onClick={handleClose}>
              Exit Quiz
            </Button>
            {!showResult ? (
              <Button
                variant="contained"
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
              >
                Submit Answer
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNextQuestion}
              >
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </Button>
            )}
          </>
        ) : (
          <Button variant="contained" onClick={handleClose}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QuizModal;