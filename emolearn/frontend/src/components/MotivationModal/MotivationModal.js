import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Fade
} from '@mui/material';
import {
  Close as CloseIcon,
  Favorite as HeartIcon,
  EmojiEvents as TrophyIcon,
  Psychology as MindIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const motivationalMessages = [
  {
    title: "You're Doing Great!",
    message: "Learning can be challenging, but every challenge you face makes you stronger. Take a deep breath and remember that it's okay to feel frustrated sometimes.",
    icon: "💪",
    color: "success.main",
    tip: "Try breaking the problem into smaller steps."
  },
  {
    title: "Progress, Not Perfection",
    message: "Remember, you don't have to be perfect. Every mistake is a learning opportunity, and every small step forward is progress worth celebrating.",
    icon: "🌟",
    color: "primary.main",
    tip: "Focus on what you've learned so far today."
  },
  {
    title: "Take Your Time",
    message: "There's no rush! Learning happens at your own pace. It's better to understand deeply than to rush through without comprehension.",
    icon: "🐢",
    color: "info.main",
    tip: "Consider taking a short break and coming back refreshed."
  },
  {
    title: "You've Got This!",
    message: "Believe in yourself! You've overcome challenges before, and you can do it again. Your persistence and effort will pay off.",
    icon: "🚀",
    color: "warning.main",
    tip: "Think about a time when you successfully learned something difficult."
  },
  {
    title: "Growth Mindset",
    message: "Your brain is like a muscle - the more you exercise it, the stronger it gets. Challenges are just opportunities for your brain to grow!",
    icon: "🧠",
    color: "secondary.main",
    tip: "Say to yourself: 'I can't do this YET, but I'm learning.'"
  },
  {
    title: "Every Expert Was Once a Beginner",
    message: "Remember that everyone who is now an expert was once exactly where you are. They didn't give up, and neither should you!",
    icon: "🎯",
    color: "success.main",
    tip: "Think of someone you admire and remember they started as a beginner too."
  },
  {
    title: "Celebrate Small Wins",
    message: "Acknowledge every small victory along the way. Understanding one concept, solving one problem, or asking one good question - they all matter!",
    icon: "🎉",
    color: "primary.main",
    tip: "Write down one thing you learned today, no matter how small."
  }
];

const breathingExercise = {
  title: "Quick Breathing Exercise",
  steps: [
    "Breathe in slowly for 4 counts",
    "Hold your breath for 4 counts", 
    "Breathe out slowly for 6 counts",
    "Repeat 3 times"
  ],
  icon: "🫁"
};

const MotivationModal = ({ open, onClose }) => {
  const { announceToScreenReader } = useAccessibility();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);
  const [breathingStep, setBreathingStep] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);

  const currentMessage = motivationalMessages[currentMessageIndex];

  useEffect(() => {
    if (open) {
      setCurrentMessageIndex(Math.floor(Math.random() * motivationalMessages.length));
      setShowBreathingExercise(false);
      setBreathingStep(0);
      setIsBreathing(false);
      announceToScreenReader('Motivational message opened to help with frustration');
    }
  }, [open, announceToScreenReader]);

  const handleNextMessage = () => {
    const nextIndex = (currentMessageIndex + 1) % motivationalMessages.length;
    setCurrentMessageIndex(nextIndex);
    announceToScreenReader('Showing next motivational message');
  };

  const handleStartBreathing = () => {
    setShowBreathingExercise(true);
    setBreathingStep(0);
    setIsBreathing(true);
    announceToScreenReader('Starting breathing exercise');
    
    // Auto-advance through breathing steps
    const breathingInterval = setInterval(() => {
      setBreathingStep(prev => {
        if (prev >= breathingExercise.steps.length - 1) {
          clearInterval(breathingInterval);
          setIsBreathing(false);
          announceToScreenReader('Breathing exercise completed');
          return prev;
        }
        return prev + 1;
      });
    }, 4000); // 4 seconds per step
  };

  const handleClose = () => {
    onClose();
    announceToScreenReader('Motivational modal closed');
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="motivation-dialog-title"
    >
      <DialogTitle id="motivation-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HeartIcon sx={{ mr: 1, color: 'error.main' }} />
            <Typography variant="h6">
              Take a Moment
            </Typography>
          </Box>
          <IconButton onClick={handleClose} aria-label="Close motivation message">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!showBreathingExercise ? (
          <Fade in={!showBreathingExercise}>
            <Box>
              <Card 
                elevation={0} 
                sx={{ 
                  bgcolor: 'background.default', 
                  border: '2px solid', 
                  borderColor: currentMessage.color,
                  mb: 3
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: currentMessage.color, 
                        mr: 2, 
                        width: 56, 
                        height: 56,
                        fontSize: '1.5rem'
                      }}
                    >
                      {currentMessage.icon}
                    </Avatar>
                    <Typography variant="h5" color={currentMessage.color}>
                      {currentMessage.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 2 }}>
                    {currentMessage.message}
                  </Typography>

                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'action.hover', 
                      borderRadius: 1,
                      borderLeft: '4px solid',
                      borderLeftColor: currentMessage.color
                    }}
                  >
                    <Typography variant="body2" fontWeight="medium" color="text.secondary">
                      💡 Helpful Tip: {currentMessage.tip}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={handleNextMessage}
                  variant="outlined"
                  size="small"
                >
                  Another Message
                </Button>
                <Button
                  startIcon={<MindIcon />}
                  onClick={handleStartBreathing}
                  variant="outlined"
                  size="small"
                  color="secondary"
                >
                  Breathing Exercise
                </Button>
              </Box>
            </Box>
          </Fade>
        ) : (
          <Fade in={showBreathingExercise}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ mb: 2 }}>
                {breathingExercise.icon}
              </Typography>
              <Typography variant="h6" gutterBottom>
                {breathingExercise.title}
              </Typography>
              
              <Card sx={{ mt: 3, p: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="h5" gutterBottom>
                  Step {breathingStep + 1} of {breathingExercise.steps.length}
                </Typography>
                <Typography variant="h6">
                  {breathingExercise.steps[breathingStep]}
                </Typography>
                
                {isBreathing && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Follow along...
                    </Typography>
                  </Box>
                )}
              </Card>

              {!isBreathing && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Great job! You should feel more relaxed now. 🌟
                </Typography>
              )}
            </Box>
          </Fade>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Close
        </Button>
        <Button variant="contained" onClick={handleClose}>
          I'm Ready to Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MotivationModal;
