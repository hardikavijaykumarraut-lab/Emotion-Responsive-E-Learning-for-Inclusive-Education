import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Snackbar,
  Fade,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Videocam as VideocamIcon, 
  VideocamOff as VideocamOffIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import PythonFaceDetection from '../../components/FaceDetection/PythonFaceDetection';
import LearningContent from '../../components/LearningContent/LearningContent';
import FunFactModal from '../../components/FunFactModal/FunFactModal';
import QuizModal from '../../components/QuizModal/QuizModal';
import MotivationModal from '../../components/MotivationModal/MotivationModal';
import { useEmotion } from '../../contexts/EmotionContext';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useAuth } from '../../contexts/AuthContext';
import progressService from '../../services/progressService';
import useActivityTracking from '../../hooks/useActivityTracking';
import { ACTIVITY_TYPES, ACTIVITY_DEFAULTS } from '../../constants/activityConstants';

const LearningPage = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const { 
    isModelLoaded, 
    currentEmotion, 
    isDetecting, 
    startEmotionDetection, 
    stopEmotionDetection,
    videoRef,
    error
  } = useEmotion();
  
  const { user } = useAuth(); // Get user from auth context
  const { announceToScreenReader } = useAccessibility();
  
  // Initialize activity tracking
  const { trackActivity, flush } = useActivityTracking();
  
  // Set default subject if none provided
  const currentSubject = subject || 'mathematics';
  
  // Update the page title when subject changes
  useEffect(() => {
    const subjectName = currentSubject.charAt(0).toUpperCase() + currentSubject.slice(1);
    document.title = `Learning ${subjectName} | EmoLearn`;
    announceToScreenReader(`Loading ${subjectName} content`);
  }, [subject, announceToScreenReader]);
  
  const [currentModule, setCurrentModule] = useState(0);
  const [emotionFeedback, setEmotionFeedback] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [showFunFact, setShowFunFact] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [lastEmotionTrigger, setLastEmotionTrigger] = useState(0);
  const [triggeredEmotions, setTriggeredEmotions] = useState(new Set());
  const [confusionDialogOpen, setConfusionDialogOpen] = useState(false);
  const [confusionExplanation, setConfusionExplanation] = useState('');
  const [isLoadingLastModule, setIsLoadingLastModule] = useState(true);

  // Load the last module the student was on
  useEffect(() => {
    const loadLastModule = async () => {
      if (user && user._id) {
        try {
          setIsLoadingLastModule(true);
          // Get the last module the user was on for this subject
          const response = await fetch(`/api/progress/${user._id}/last-module/${currentSubject}`, {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          
          const data = await response.json();
          
          if (data.success && data.data) {
            setCurrentModule(data.data.moduleIndex);
            console.log('Loaded last module:', data.data);
          }
        } catch (error) {
          console.error('Error loading last module:', error);
        } finally {
          setIsLoadingLastModule(false);
        }
      } else {
        setIsLoadingLastModule(false);
      }
    };
    
    loadLastModule();
  }, [user, currentSubject]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup function
      if (isDetecting) {
        stopEmotionDetection();
      }
    };
  }, [isDetecting, stopEmotionDetection]);

  // Handle emotion changes and trigger modals
  useEffect(() => {
    if (detectedEmotion && detectedEmotion.emotion) {
      const now = Date.now();
      const emotion = detectedEmotion.emotion;
      
      // Only trigger once per emotion type and with cooldown
      if (!triggeredEmotions.has(emotion) && (now - lastEmotionTrigger > 30000)) { // 30 second cooldown
        setLastEmotionTrigger(now);
        setTriggeredEmotions(prev => new Set([...prev, emotion]));
        
        // Trigger appropriate modal based on emotion
        switch (emotion) {
          case 'happy':
          case 'surprised':
          case 'fearful': // Show fun fact for fear as well
            // Show fun fact for positive emotions and fear
            setShowFunFact(true);
            break;
          case 'neutral':
            // Show quiz for neutral emotions
            setShowQuiz(true);
            break;
          case 'sad':
          case 'angry':
          case 'disgusted':
            // Show motivation for negative emotions (excluding fear)
            setShowMotivation(true);
            break;
          case 'confused':
            // Show confusion explanation popup
            setConfusionExplanation(getConfusionExplanation(currentSubject, currentModule));
            setConfusionDialogOpen(true);
            break;
          default:
            break;
        }
      }
      
      const feedback = getEmotionFeedback({ emotion });
      setEmotionFeedback(feedback);
      announceToScreenReader(`Detected emotion: ${emotion}`);
    }
  }, [detectedEmotion, lastEmotionTrigger, triggeredEmotions, announceToScreenReader, currentSubject, currentModule]);

  // Progress simulation with real-time tracking
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev >= 100 ? 100 : prev + 2;
          
          // Track progress in real-time (every 10% increment)
          if (newProgress % 10 === 0 && prev !== newProgress && user && user._id) {
            progressService.trackContentView(user._id, currentSubject, 10) // 10 seconds
              .then(response => {
                console.log('Progress tracked:', response);
              })
              .catch(error => {
                console.error('Error tracking progress:', error);
              });
          }
          
          if (newProgress >= 100) {
            setIsPlaying(false);
          }
          
          return newProgress;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, user, currentSubject]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextModule = async () => {
    if (currentModule < 2) { // Assuming 3 modules (0, 1, 2)
      // Track module completion
      if (user && user._id && !user.isGuest) {
        trackActivity({
          type: ACTIVITY_TYPES.MODULE_COMPLETED,
          subject: currentSubject,
          module: currentModule,
          duration: ACTIVITY_DEFAULTS.MODULE_DURATION,
          emotionData: detectedEmotion
        });
      }
      
      setCurrentModule(prev => prev + 1);
      setProgress(0);
      setIsPlaying(false);
    } else {
      // All modules completed - track final module completion
      if (user && user._id && !user.isGuest) {
        trackActivity({
          type: ACTIVITY_TYPES.MODULE_COMPLETED,
          subject: currentSubject,
          module: currentModule,
          duration: ACTIVITY_DEFAULTS.MODULE_DURATION,
          emotionData: detectedEmotion
        });
      }
    }
  };

  const handlePreviousModule = () => {
    if (currentModule > 0) {
      setCurrentModule(prev => prev - 1);
      setProgress(0);
      setIsPlaying(false);
    }
  };

  const handleEmotionDetected = async (emotionData) => {
    setDetectedEmotion(emotionData);
    if (emotionData.emotion && emotionData.confidence > 0.5) {
      const feedback = getEmotionFeedback({ emotion: emotionData.emotion });
      setEmotionFeedback(feedback);
      announceToScreenReader(`Detected emotion: ${emotionData.emotion}`);
      
      // Log emotion to progress service for real-time tracking
      if (user && user._id) {
        try {
          await progressService.logEmotion(user._id, {
            emotion: emotionData.emotion,
            confidence: emotionData.confidence,
            timestamp: new Date().toISOString(),
            context: {
              subject: currentSubject,
              moduleId: `module-${currentModule}`,
              activity: isPlaying ? 'learning' : 'idle',
              sessionId: localStorage.getItem('sessionId') || Math.random().toString(36).substr(2, 9)
            }
          });
          console.log('Emotion logged to progress service:', emotionData.emotion);
        } catch (error) {
          console.error('Error logging emotion to progress service:', error);
        }
      }
    }
  };

  const getEmotionFeedback = (emotionData) => {
    const feedbackMap = {
      happy: 'Great job! You seem to be enjoying the content!',
      sad: 'Is something challenging? Let me know how I can help!',
      angry: 'Take a deep breath. You can do this!',
      surprised: 'I see you found something interesting!',
      fearful: 'Here\'s an interesting fact to help you feel more confident!', // Updated feedback for fear
      disgusted: 'Is there something you\'d like to change?',
      neutral: 'Stay focused! You\'re making good progress.',
      confused: 'I notice you might be confused. Let me help explain this better.'
    };
    return feedbackMap[emotionData.emotion] || 'Keep up the good work!';
  };

  const getConfusionExplanation = (subject, moduleIndex) => {
    const explanations = {
      mathematics: [
        "It looks like you're finding algebra challenging. Let's break it down: Variables are just placeholders for numbers we don't know yet. Think of them like empty boxes waiting to be filled.",
        "Linear equations can be tricky at first. Remember, whatever you do to one side of the equation, you must do to the other to keep it balanced.",
        "Quadratic equations have two solutions because they form a parabola that crosses the x-axis at two points. Try visualizing the graph!"
      ],
      science: [
        "The scientific method is all about asking questions and testing answers. Think of it like solving a mystery - you gather clues (data) and form theories (hypotheses).",
        "States of matter change based on energy. Add heat, particles move faster. Remove heat, they slow down. It's like a dance floor with different music speeds!",
        "Photosynthesis is how plants make their food. They combine sunlight, water, and carbon dioxide - kind of like a recipe with three main ingredients."
      ],
      history: [
        "Ancient civilizations laid the groundwork for modern society. Think of them as the first draft of human civilization - they tried things out and we improved on their ideas.",
        "The Renaissance was a 'rebirth' of learning. People rediscovered old knowledge and combined it with new ideas, like remixing songs to create something fresh.",
        "The Industrial Revolution changed everything by moving work from homes to factories. Imagine if all your cooking suddenly moved to one big kitchen everyone shared."
      ]
    };
    
    const subjectExplanations = explanations[subject] || [
      "This concept can be challenging. Try breaking it down into smaller parts and tackling each piece one at a time.",
      "Sometimes stepping back and reviewing the basics can help clarify more complex ideas.",
      "Don't hesitate to ask questions. Learning is a process, and confusion is a natural part of that process."
    ];
    
    return subjectExplanations[moduleIndex] || subjectExplanations[0];
  };

  const handleFunFactClose = () => {
    setShowFunFact(false);
    setTriggeredEmotions(prev => {
      const newSet = new Set(prev);
      newSet.delete('happy');
      newSet.delete('surprised');
      return newSet;
    });
  };

  const handleQuizClose = () => {
    setShowQuiz(false);
    setTriggeredEmotions(prev => {
      const newSet = new Set(prev);
      newSet.delete('neutral');
      return newSet;
    });
  };

  const handleMotivationClose = () => {
    setShowMotivation(false);
    setTriggeredEmotions(prev => {
      const newSet = new Set(prev);
      newSet.delete('sad');
      newSet.delete('angry');
      newSet.delete('fearful');
      newSet.delete('disgusted');
      return newSet;
    });
  };

  const handleConfusionDialogClose = () => {
    setConfusionDialogOpen(false);
    setTriggeredEmotions(prev => {
      const newSet = new Set(prev);
      newSet.delete('confused');
      return newSet;
    });
  };

  if (isLoadingLastModule) {
    return (
      <Container maxWidth="xl" sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading your progress...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Modals */}
      <FunFactModal 
        open={showFunFact} 
        onClose={handleFunFactClose}
        subject={detectedEmotion?.emotion === 'fearful' ? 'fear' : currentSubject}
      />
      <QuizModal 
        open={showQuiz} 
        onClose={handleQuizClose}
        subject={currentSubject}
      />
      <MotivationModal 
        open={showMotivation} 
        onClose={handleMotivationClose}
      />
      
      {/* Confusion Explanation Dialog */}
      <Dialog open={confusionDialogOpen} onClose={handleConfusionDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <InfoIcon sx={{ mr: 1, color: '#607D8B' }} />
            Help with Confusion
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            {confusionExplanation}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Remember, it's completely normal to feel confused when learning something new. 
            Take your time, and don't hesitate to review previous materials or ask for help.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfusionDialogClose} variant="contained" color="primary">
            Got it
          </Button>
        </DialogActions>
      </Dialog>
      
      <Grid container spacing={3}>
        {/* Left Column: Emotion Detection */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Emotion Detection</Typography>
              </Box>
              
              <Box sx={{ position: 'relative', width: '100%', height: 'auto', minHeight: 300, mb: 2 }}>
                <PythonFaceDetection 
                  onEmotionDetected={handleEmotionDetected}
                  onFaceDetected={(hasFace) => console.log('Face detected:', hasFace)}
                />
              </Box>
              
              {detectedEmotion && detectedEmotion.emotion && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Detected Emotion: {detectedEmotion.emotion} ({(detectedEmotion.confidence * 100).toFixed(1)}% confidence)
                </Alert>
              )}
              
              {emotionFeedback && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {emotionFeedback}
                </Alert>
              )}
            </CardContent>
          </Card>
          
        </Grid>
        
        {/* Right Column: Learning Content */}
        <Grid item xs={12} md={8}>
          <LearningContent 
            subject={currentSubject}
            currentModule={currentModule}
            onModuleChange={setCurrentModule}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default LearningPage;