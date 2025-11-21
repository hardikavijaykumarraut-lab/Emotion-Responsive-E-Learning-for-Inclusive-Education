import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useEmotion } from '../../contexts/EmotionContext';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import FunFactModal from '../FunFactModal/FunFactModal';
import QuizModal from '../QuizModal/QuizModal';
import MotivationModal from '../MotivationModal/MotivationModal';

const EmotionDetector = ({ onEmotionChange }) => {
  const {
    isModelLoaded,
    modelsActuallyLoaded,
    currentEmotion,
    isDetecting: contextIsDetecting,
    cameraPermission,
    videoRef,
    startEmotionDetection,
    stopEmotionDetection,
    error,
    // Modal state from context
    showFunFactModal,
    setShowFunFactModal,
    showQuizModal,
    setShowQuizModal,
    showMotivationModal,
    setShowMotivationModal,
    modalSubject
  } = useEmotion();

  const { announceToScreenReader } = useAccessibility();
  const [showVideo, setShowVideo] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const detectionStarted = useRef(false);

  // Handle error messages
  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setSnackbarOpen(true);
    }
  }, [error]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  // Handle emotion changes
  useEffect(() => {
    if (currentEmotion && onEmotionChange) {
      onEmotionChange(currentEmotion);
      announceToScreenReader(`Emotion detected: ${currentEmotion.emotion}`);
    }
  }, [currentEmotion, onEmotionChange, announceToScreenReader]);

  // Handle start detection
  const handleStartDetection = useCallback(async () => {
    if (isInitializing || isDetecting) return;
    
    setIsInitializing(true);
    try {
      const videoElement = videoRef.current;
      if (!videoElement) {
        throw new Error('Video element not found');
      }
      
      const success = await startEmotionDetection(videoElement);
      if (success) {
        setIsDetecting(true);
        announceToScreenReader('Emotion detection started');
        detectionStarted.current = true;
      } else {
        setSnackbarMessage('Failed to start emotion detection. Please check camera permissions.');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error starting detection:', err);
      setSnackbarMessage(err.message || 'Error starting emotion detection. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, isDetecting, startEmotionDetection, videoRef, announceToScreenReader]);

  // Handle stop detection
  const handleStopDetection = useCallback(() => {
    try {
      stopEmotionDetection();
      setIsDetecting(false);
      detectionStarted.current = false;
      announceToScreenReader('Emotion detection stopped');
    } catch (err) {
      console.error('Error stopping detection:', err);
      setSnackbarMessage('Error stopping emotion detection');
      setSnackbarOpen(true);
    }
  }, [stopEmotionDetection, announceToScreenReader]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isDetecting) {
        handleStopDetection();
      }
    };
  }, [isDetecting, handleStopDetection]);

  // Toggle video visibility
  const toggleVideo = useCallback(() => {
    setShowVideo(prev => !prev);
  }, []);

  // Update local isDetecting state when context changes
  useEffect(() => {
    setIsDetecting(contextIsDetecting);
  }, [contextIsDetecting]);

  // Render loading state
  if (!isModelLoaded) {
    return (
      <Card sx={{ p: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading emotion detection model...</Typography>
      </Card>
    );
  }

  const getEmotionColor = (emotion) => {
    const colors = {
      happiness: 'success',
      engagement: 'primary',
      confusion: 'warning',
      boredom: 'info',
      frustration: 'error'
    };
    return colors[emotion] || 'default';
  };

  const getEmotionDescription = (emotion) => {
    const descriptions = {
      happiness: 'You seem happy! Great job!',
      engagement: 'You appear focused and engaged.',
      confusion: 'You might be confused. Let me help with a fun fact!',
      boredom: 'You seem bored. How about a quick quiz?',
      frustration: 'You appear frustrated. Take a deep breath, you\'ve got this!'
    };
    return descriptions[emotion] || 'Analyzing your emotion...';
  };

  // Show loading state if models are not ready
  if (!isModelLoaded || !modelsActuallyLoaded) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <CircularProgress size={40} thickness={4} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom align="center">
              Initializing Emotion Detection
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Loading AI models. This may take a few moments...
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                {error}
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center">
              <Typography variant="h6" component="div">
                Emotion Detection
              </Typography>
              {isDetecting && (
                <Chip 
                  label="Active" 
                  color="success" 
                  size="small" 
                  sx={{ ml: 1, fontSize: '0.7rem' }} 
                />
              )}
            </Box>
            <Box>
              {isDetecting ? (
                <Button
                  color="secondary"
                  onClick={handleStopDetection}
                  startIcon={<VideocamOffIcon />}
                  size="small"
                  aria-label="Stop camera"
                  disabled={isInitializing || isDetecting}
                >
                  Stop
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleStartDetection}
                  startIcon={isInitializing ? <CircularProgress size={16} color="inherit" /> : <VideocamIcon />}
                  disabled={cameraPermission === 'denied' || isInitializing || isDetecting}
                  size="small"
                  aria-label={cameraPermission === 'denied' 
                    ? 'Camera access denied. Please enable camera permissions in your browser settings.'
                    : 'Start camera for emotion detection'}
                >
                  {isInitializing ? 'Starting...' : 'Start Detection'}
                </Button>
              )}
            </Box>
          </Box>
          {cameraPermission === 'denied' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Camera permission denied. Please allow camera access to use emotion detection.
            </Alert>
          )}

          <Box sx={{ position: 'relative', mb: 2, minHeight: '240px' }}>
            <video
              ref={videoRef}
              width="100%"
              height="auto"
              autoPlay
              playsInline
              muted
              style={{
                display: showVideo ? 'block' : 'none',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
                minHeight: '240px',
                border: isDetecting ? '2px solid #4caf50' : '2px solid #e0e0e0'
              }}
            />
            
            {!showVideo && isDetecting && (
              <Box
                sx={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  height: '240px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #4caf50',
                  p: 2,
                  textAlign: 'center'
                }}
              >
                <VideocamOffIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Camera is active but hidden
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Emotion detection is still running
                </Typography>
              </Box>
            )}

            {!isDetecting && (
              <Box
                sx={{
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  height: '240px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #e0e0e0',
                  p: 3,
                  textAlign: 'center'
                }}
              >
                <VideocamIcon color="disabled" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  {cameraPermission === 'denied' 
                    ? 'Camera access was denied' 
                    : 'Click "Start Detection" to begin'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Your camera feed will be analyzed for emotions
                </Typography>
              </Box>
            )}

            {isDetecting && (
              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                <Tooltip title={showVideo ? 'Hide camera' : 'Show camera'}>
                  <IconButton
                    onClick={() => setShowVideo(!showVideo)}
                    color="primary"
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 1)'
                      }
                    }}
                  >
                    {showVideo ? <VideocamOffIcon /> : <VideocamIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {isDetecting && (
            <Box 
              mb={2} 
              p={2} 
              bgcolor="background.paper"
              borderRadius={1}
              border={1}
              borderColor="divider"
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    {currentEmotion ? 'Current Emotion' : 'Analyzing...'}
                  </Typography>
                  {!currentEmotion && (
                    <Typography variant="caption" color="textSecondary">
                      Please face the camera
                    </Typography>
                  )}
                </Box>
                {currentEmotion ? (
                  <Chip
                    label={currentEmotion.emotion.charAt(0).toUpperCase() + currentEmotion.emotion.slice(1)}
                    color={getEmotionColor(currentEmotion.emotion)}
                    size="small"
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      px: 1,
                      height: '24px'
                    }}
                  />
                ) : (
                  <CircularProgress size={20} thickness={4} />
                )}
              </Box>
              
              {currentEmotion && (
                <Box mt={1}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Box width="100%" mr={1}>
                      <LinearProgress 
                        variant="determinate"
                        value={Math.round(currentEmotion.confidence * 100)}
                        color={getEmotionColor(currentEmotion.emotion)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="textSecondary" minWidth={40}>
                      {Math.round(currentEmotion.confidence * 100)}%
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mt={1}>
                    <Typography variant="caption" color="textSecondary">
                      {getEmotionDescription(currentEmotion.emotion)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {currentEmotion && (
            <Box 
              mt={2} 
              p={2} 
              bgcolor="background.paper"
              borderRadius={1}
              border={1}
              borderColor="divider"
            >
              <Typography variant="subtitle2" color="primary" gutterBottom>
                {getEmotionDescription(currentEmotion.emotion)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {currentEmotion.emotion === 'happiness' && 'Keep up the great work! Your positive energy is contagious.'}
                {currentEmotion.emotion === 'engagement' && 'You\'re doing great! Your focus is helping you learn effectively.'}
                {currentEmotion.emotion === 'confusion' && 'Would you like me to explain this in a different way?'}
                {currentEmotion.emotion === 'boredom' && 'Let\'s try something more engaging!'}
                {currentEmotion.emotion === 'frustration' && 'Take a deep breath. You\'ve got this!'}
              </Typography>
            </Box>
          )}
        </CardContent>
        
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity="error" 
            icon={<ErrorIcon />}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Card>

      {/* Emotion-based Modals */}
      <FunFactModal 
        open={showFunFactModal} 
        onClose={() => setShowFunFactModal(false)}
        subject={modalSubject}
      />
      <QuizModal 
        open={showQuizModal} 
        onClose={() => setShowQuizModal(false)}
        subject={modalSubject}
      />
      <MotivationModal 
        open={showMotivationModal} 
        onClose={() => setShowMotivationModal(false)}
      />
    </>
  );
};

export default EmotionDetector;