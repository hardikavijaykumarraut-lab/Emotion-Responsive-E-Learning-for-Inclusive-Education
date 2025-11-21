import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Box, Button, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import { Videocam, VideocamOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import progressService from '../../services/progressService';

const MODEL_URL = '/models'; // Make sure models are in public/models

const SimpleEmotionDetector = ({ onEmotionDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const streamRef = useRef(null);
  const { user } = useAuth(); // Get user from auth context

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load models with progress feedback
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        
        console.log('Face detection models loaded successfully');
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Failed to load face detection models. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  // Start/stop camera
  const toggleCamera = useCallback(async () => {
    try {
      if (isCameraActive) {
        // Stop the camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
        setIsDetecting(false);
      } else {
        // Start the camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          await videoRef.current.play();
          setIsCameraActive(true);
          
          // Start detection after a short delay to ensure video is playing
          setTimeout(() => {
            setIsDetecting(true);
          }, 500);
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(
        err.name === 'NotAllowedError' 
          ? 'Camera access was denied. Please allow camera permissions.'
          : 'Could not access camera. Please check if your camera is connected.'
      );
    }
  }, [isCameraActive]);

  // Log emotion to database
  const logEmotionToDatabase = useCallback(async (emotionData) => {
    if (user && user._id) {
      try {
        const result = await progressService.logEmotion(user._id, {
          emotion: emotionData.emotion,
          confidence: emotionData.score,
          timestamp: new Date().toISOString(),
          context: {
            source: 'simple-emotion-detector',
            activity: 'learning',
            sessionId: localStorage.getItem('sessionId') || Math.random().toString(36).substr(2, 9)
          }
        });
        
        if (!result.success) {
          console.warn('Failed to log emotion to database:', result.error);
        } else {
          console.log('Emotion logged to database successfully');
        }
      } catch (error) {
        console.error('Error logging emotion to database:', error);
      }
    }
  }, [user]);

  // Face detection loop
  useEffect(() => {
    if (!isDetecting || !isCameraActive) return;
    
    let animationFrameId;
    let lastEmotionLogged = null;
    let emotionStabilityCounter = 0;
    const STABILITY_THRESHOLD = 5; // Number of consecutive frames before logging
    
    const detectFaces = async () => {
      try {
        if (videoRef.current && videoRef.current.readyState === 4) {
          const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();
          
          // Update canvas
          const canvas = canvasRef.current;
          if (canvas) {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            // Set canvas dimensions to match video
            const displaySize = { 
              width: videoRef.current.videoWidth, 
              height: videoRef.current.videoHeight 
            };
            faceapi.matchDimensions(canvas, displaySize);
            
            // Draw detections
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
            
            // Get dominant emotion
            if (detections.length > 0) {
              const expressions = detections[0].expressions;
              const dominantExpression = Object.entries(expressions).reduce((a, b) => 
                a[1] > b[1] ? a : b
              );
              
              if (dominantExpression[1] > 0.5) {
                const emotionData = {
                  emotion: dominantExpression[0],
                  score: dominantExpression[1]
                };
                
                setCurrentEmotion(emotionData);
                
                // Check if this is a stable emotion (same emotion for several frames)
                if (lastEmotionLogged === dominantExpression[0]) {
                  emotionStabilityCounter++;
                } else {
                  emotionStabilityCounter = 0;
                  lastEmotionLogged = dominantExpression[0];
                }
                
                // Only log to database if emotion is stable
                if (emotionStabilityCounter >= STABILITY_THRESHOLD) {
                  // Log to parent component
                  if (onEmotionDetected) {
                    onEmotionDetected({
                      emotion: dominantExpression[0],
                      score: dominantExpression[1],
                      timestamp: Date.now()
                    });
                  }
                  
                  // Log to database
                  await logEmotionToDatabase(emotionData);
                  
                  // Reset counter to avoid continuous logging
                  emotionStabilityCounter = 0;
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error during detection:', err);
      }
      
      animationFrameId = requestAnimationFrame(detectFaces);
    };
    
    detectFaces();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDetecting, isCameraActive, onEmotionDetected, logEmotionToDatabase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Emotion Detection
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ 
        position: 'relative', 
        width: '100%',
        backgroundColor: '#000',
        borderRadius: 1,
        overflow: 'hidden',
        aspectRatio: '16/9',
        mb: 2
      }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)' // Mirror the video
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: 'scaleX(-1)' // Mirror the canvas to match video
          }}
        />
        
        {!isCameraActive && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              color: '#666'
            }}
          >
            <Typography>Camera is off</Typography>
          </Box>
        )}
        
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white'
            }}
          >
            <CircularProgress color="inherit" />
          </Box>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant={isCameraActive ? 'outlined' : 'contained'}
          color="primary"
          onClick={toggleCamera}
          startIcon={isCameraActive ? <VideocamOff /> : <Videocam />}
          disabled={isLoading}
        >
          {isCameraActive ? 'Stop Camera' : 'Start Camera'}
        </Button>
      </Box>
      
      {currentEmotion && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body1">
            Detected: <strong>{currentEmotion.emotion}</strong> 
            ({(currentEmotion.score * 100).toFixed(1)}% confidence)
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SimpleEmotionDetector;