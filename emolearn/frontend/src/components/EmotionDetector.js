import React, { useEffect, useRef, useState } from 'react';
import { useEmotion } from '../contexts/EmotionContext';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Button, 
  Paper, 
  Grid, 
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Face, Mood, MoodBad, SentimentSatisfied, SentimentVeryDissatisfied } from '@mui/icons-material';

const EmotionDetector = () => {
  const {
    videoRef,
    isDetecting,
    currentEmotion,
    error,
    startEmotionDetection,
    stopEmotionDetection,
    modelsActuallyLoaded
  } = useEmotion();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoContainerRef = useRef(null);

  // Handle starting/stopping detection
  const toggleDetection = async () => {
    if (isDetecting) {
      stopEmotionDetection();
    } else {
      await startEmotionDetection();
    }
  };

  // Set up video element and canvas
  useEffect(() => {
    if (videoRef.current && videoContainerRef.current) {
      // Clear container
      videoContainerRef.current.innerHTML = '';
      
      // Create video element if it doesn't exist
      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.transform = 'scaleX(-1)';
      video.style.borderRadius = '8px';
      
      // Create canvas for drawing detections
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.zIndex = '10';
      
      // Add elements to container
      videoContainerRef.current.appendChild(video);
      videoContainerRef.current.appendChild(canvas);
      
      // Set refs
      videoRef.current = video;
      
      const handleCanPlay = () => {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        setIsCameraReady(true);
      };
      
      video.addEventListener('canplay', handleCanPlay);
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [videoRef]);

  // Initialize detection when component mounts
  useEffect(() => {
    const initialize = async () => {
      if (modelsActuallyLoaded && !isInitialized) {
        await startEmotionDetection();
        setIsInitialized(true);
      }
    };
    
    initialize();
    
    return () => {
      stopEmotionDetection();
    };
  }, [modelsActuallyLoaded, isInitialized]);

  // Get emotion icon
  const getEmotionIcon = () => {
    if (!currentEmotion) return <Face sx={{ fontSize: 60 }} color="disabled" />;
    
    switch(currentEmotion.emotion) {
      case 'happiness':
        return <Mood sx={{ fontSize: 60, color: '#4CAF50' }} />;
      case 'surprise':
        return <SentimentSatisfied sx={{ fontSize: 60, color: '#FFC107' }} />;
      case 'boredom':
      case 'frustration':
      case 'confusion':
        return <SentimentVeryDissatisfied sx={{ fontSize: 60, color: '#F44336' }} />;
      default:
        return <MoodBad sx={{ fontSize: 60, color: '#9E9E9E' }} />;
    }
  };

  // Get emotion text with confidence
  const getEmotionText = () => {
    if (!currentEmotion) return 'No emotion detected';
    
    const emotionMap = {
      'happiness': { text: 'Happy', emoji: '😊', color: '#4CAF50' },
      'focus': { text: 'Focused', emoji: '🎯', color: '#2196F3' },
      'boredom': { text: 'Bored', emoji: '😴', color: '#9C27B0' },
      'frustration': { text: 'Frustrated', emoji: '😤', color: '#F44336' },
      'confusion': { text: 'Confused', emoji: '🤔', color: '#FF9800' },
      'surprise': { text: 'Surprised', emoji: '😲', color: '#FFC107' },
      'no_face': { text: 'No face detected', emoji: '👤', color: '#9E9E9E' }
    };
    
    const emotionInfo = emotionMap[currentEmotion.emotion] || { 
      text: currentEmotion.emotion || 'Unknown', 
      emoji: '❓',
      color: '#9E9E9E'
    };
    
    return {
      ...emotionInfo,
      fullText: `${emotionInfo.text} ${emotionInfo.emoji}`,
      confidence: currentEmotion.confidence ? Math.round(currentEmotion.confidence * 100) : 0
    };
  };
  
  const emotionInfo = getEmotionText();
  const { getEmotionBasedAction } = useEmotion();
  const emotionAction = getEmotionBasedAction(currentEmotion?.emotion || '');

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4, gap: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Emotion Detection
        </Typography>
        <Tooltip title="This tool analyzes your facial expressions to understand your emotional state while learning. It helps provide personalized feedback and learning suggestions." arrow>
          <IconButton size="small">
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      {error && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: 'error.light' }}>
          <Typography color="error.dark">{error}</Typography>
        </Paper>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Video Feed */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <Paper 
            elevation={3} 
            ref={videoContainerRef}
            sx={{
              width: '100%',
              height: '480px',
              bgcolor: 'black',
              borderRadius: 2,
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            {!isCameraReady && (
              <Box sx={{ position: 'absolute', textAlign: 'center', color: 'white' }}>
                <CircularProgress color="inherit" />
                <Typography>Initializing camera...</Typography>
              </Box>
            )}
            {/* Video and canvas are added dynamically */}
          </Paper>
          
          <Button
            variant="contained"
            color={isDetecting ? 'error' : 'primary'}
            onClick={toggleDetection}
            fullWidth
            sx={{ mt: 2 }}
            startIcon={isDetecting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isDetecting ? 'Stop Detection' : 'Start Detection'}
          </Button>
        </Box>
        
        {/* Emotion Display */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Paper elevation={3} sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ mb: 3 }}>
              {getEmotionIcon()}
            </Box>
            
            <Typography 
              variant="h4" 
              component="div" 
              gutterBottom 
              align="center"
              sx={{ color: emotionInfo.color, fontWeight: 'bold' }}
            >
              {emotionInfo.fullText}
            </Typography>
            {currentEmotion?.confidence > 0 && (
              <Typography variant="subtitle1" color="text.secondary" align="center">
                Confidence: {emotionInfo.confidence}%
              </Typography>
            )}
            
            {currentEmotion && currentEmotion.confidence > 0 && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                  Confidence: {Math.round(currentEmotion.confidence * 100)}%
                </Typography>
                <Box sx={{ width: '100%', height: 10, bgcolor: 'grey.200', borderRadius: 5, overflow: 'hidden' }}>
                  <Box 
                    sx={{
                      height: '100%',
                      width: `${currentEmotion.confidence * 100}%`,
                      bgcolor: 'primary.main',
                      transition: 'width 0.3s ease-in-out'
                    }} 
                  />
                </Box>
              </Box>
            )}
            
            <Paper 
              elevation={0} 
              sx={{ 
                mt: 3, 
                p: 3, 
                bgcolor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 2,
                borderLeft: `4px solid ${emotionAction.color || '#9E9E9E'}`
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h6" component="div" sx={{ color: emotionAction.color, fontWeight: 'bold' }}>
                    {emotionAction.icon} {emotionAction.message}
                  </Typography>
                  {emotionAction.action === 'positive_reinforcement' && (
                    <Tooltip title="Great job! Your positive engagement helps with learning retention." arrow>
                      <HelpOutlineIcon fontSize="small" color="action" />
                    </Tooltip>
                  )}
                  {emotionAction.action === 'offer_help' && (
                    <Tooltip title="It's okay to find things challenging. Let's find a way to make this easier for you." arrow>
                      <HelpOutlineIcon fontSize="small" color="action" />
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="body1" color="text.secondary">
                  {emotionAction.suggestion}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Suggested Actions:
                  </Typography>
                  <Tooltip title="These actions are tailored to your current emotional state to enhance your learning experience." arrow>
                    <HelpOutlineIcon fontSize="small" color="action" />
                  </Tooltip>
                </Box>
                <Grid container spacing={1}>
                  {emotionAction.actions.map((action, index) => (
                    <Grid item xs={12} sm={4} key={index}>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{
                          textTransform: 'none',
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          fontSize: '0.8rem',
                          py: 1,
                          borderColor: 'divider',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        {action}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
              
              {currentEmotion?.rawEmotion && (
                <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary">
                    Detected: {currentEmotion.rawEmotion} ({Math.round((currentEmotion.confidence || 0) * 100)}% confidence)
                  </Typography>
                </Box>
              )}
            </Paper>
          </Paper>
          
          <Paper elevation={3} sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Status: {isDetecting ? 'Detecting emotions...' : 'Paused'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {modelsActuallyLoaded 
                ? 'Models loaded successfully' 
                : 'Loading AI models...'}
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default EmotionDetector;
