import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Box, Button, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import { Videocam, VideocamOff, Error as ErrorIcon } from '@mui/icons-material';
import './FaceDetection.css';

const MODEL_URL = '/models'; // Make sure to copy face-api.js models to public/models

const FaceDetection = ({ onEmotionDetected, onFaceDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionInterval = useRef(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectionActive, setDetectionActive] = useState(false);
  const [fps, setFps] = useState(0);
  const lastFpsUpdate = useRef(0);
  const frameCount = useRef(0);
  const lastFaceDetected = useRef(null);

  // Load models
  const loadModels = useCallback(async () => {
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
      setError('Failed to load face detection models. Please refresh the page or check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start/stop video stream
  const toggleVideo = useCallback(async () => {
    try {
      if (cameraActive) {
        // Stop the camera
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => {
            track.stop();
          });
          videoRef.current.srcObject = null;
        }
        setCameraActive(false);
        setDetectionActive(false);
        if (detectionInterval.current) {
          cancelAnimationFrame(detectionInterval.current);
          detectionInterval.current = null;
        }
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
          videoRef.current.play();
          setCameraActive(true);
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(
        err.name === 'NotAllowedError' 
          ? 'Camera access was denied. Please allow camera permissions and try again.'
          : 'Could not access camera. Please ensure your camera is connected and not in use by another application.'
      );
      setCameraActive(false);
    }
  }, [cameraActive]);

  // Handle face detection
  const detectFaces = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState !== 4) {
      detectionInterval.current = requestAnimationFrame(detectFaces);
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Update FPS counter
      frameCount.current++;
      const now = performance.now();
      if (now - lastFpsUpdate.current >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / (now - lastFpsUpdate.current)));
        frameCount.current = 0;
        lastFpsUpdate.current = now;
      }

      // Skip if video not ready
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        detectionInterval.current = requestAnimationFrame(detectFaces);
        return;
      }

      // Set canvas dimensions to match video
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      // Detect faces with expressions
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ 
          inputSize: 320, 
          scoreThreshold: 0.5 
        }))
        .withFaceLandmarks()
        .withFaceExpressions();

      // Resize detections to match canvas
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const ctx = canvas.getContext('2d');
      
      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw detections if any faces found
      if (detections.length > 0) {
        // Draw face detection box
        faceapi.draw.drawDetections(canvas, resizedDetections);
        
        // Draw face landmarks (optional)
        // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        
        // Get the first face's expressions
        const expressions = detections[0].expressions;
        const dominantExpression = Object.entries(expressions).reduce((a, b) => 
          a[1] > b[1] ? a : b
        );
        
        // Only update if confidence is above threshold
        if (dominantExpression[1] > 0.5) {
          lastFaceDetected.current = {
            emotion: dominantExpression[0],
            score: dominantExpression[1],
            timestamp: Date.now()
          };
          
          // Notify parent component of emotion
          if (onEmotionDetected) {
            onEmotionDetected({
              emotion: dominantExpression[0],
              score: dominantExpression[1],
              timestamp: Date.now()
            });
          }
          
          // Draw emotion text
          ctx.font = '20px Arial';
          ctx.fillStyle = '#00ff00';
          ctx.fillText(
            `${dominantExpression[0]} (${(dominantExpression[1] * 100).toFixed(1)}%)`,
            resizedDetections[0].detection.box.x,
            resizedDetections[0].detection.box.y > 20 
              ? resizedDetections[0].detection.box.y - 5 
              : resizedDetections[0].detection.box.y + 30
          );
        }
      }
      
      // Notify parent if face detection state changed
      if (onFaceDetected) {
        onFaceDetected(detections.length > 0);
      }
      
    } catch (err) {
      console.error('Error during face detection:', err);
      // Don't show every error to user to avoid spamming
    }
    
    // Continue detection loop
    detectionInterval.current = requestAnimationFrame(detectFaces);
  }, [onEmotionDetected, onFaceDetected]);

  // Toggle face detection
  const toggleDetection = useCallback(() => {
    if (detectionActive) {
      if (detectionInterval.current) {
        cancelAnimationFrame(detectionInterval.current);
        detectionInterval.current = null;
      }
      setDetectionActive(false);
    } else if (cameraActive) {
      detectFaces();
      setDetectionActive(true);
    }
  }, [cameraActive, detectionActive, detectFaces]);

  // Initialize models on mount
  useEffect(() => {
    loadModels();
    
    return () => {
      // Cleanup on unmount
      if (detectionInterval.current) {
        cancelAnimationFrame(detectionInterval.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [loadModels]);

  // Handle video element ready
  const handleVideoPlay = useCallback(() => {
    if (videoRef.current && !detectionActive && cameraActive) {
      detectFaces();
      setDetectionActive(true);
    }
  }, [cameraActive, detectionActive, detectFaces]);

  return (
    <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: '800px', mx: 'auto' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2">
          Face & Emotion Detection
        </Typography>
        {fps > 0 && (
          <Typography variant="caption" color="text.secondary">
            {fps} FPS
          </Typography>
        )}
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          icon={<ErrorIcon />} 
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}
      
      <Box 
        sx={{
          position: 'relative',
          width: '100%',
          backgroundColor: '#000',
          borderRadius: 1,
          overflow: 'hidden',
          aspectRatio: '16/9',
          mb: 2
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onPlay={handleVideoPlay}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: cameraActive ? 'block' : 'none',
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
        
        {!cameraActive && (
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
              color: '#666',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <VideocamOff sx={{ fontSize: 48 }} />
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
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress color="inherit" size={40} thickness={4} />
              <Typography sx={{ mt: 2 }}>Loading face detection models...</Typography>
            </Box>
          </Box>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant={cameraActive ? 'outlined' : 'contained'}
          color="primary"
          onClick={toggleVideo}
          startIcon={cameraActive ? <VideocamOff /> : <Videocam />}
          disabled={isLoading}
        >
          {cameraActive ? 'Stop Camera' : 'Start Camera'}
        </Button>
        
        <Button
          variant={detectionActive ? 'outlined' : 'contained'}
          color="secondary"
          onClick={toggleDetection}
          disabled={!cameraActive || isLoading}
        >
          {detectionActive ? 'Stop Detection' : 'Start Detection'}
        </Button>
      </Box>
      
      {lastFaceDetected.current && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Detected: <strong>{lastFaceDetected.current.emotion}</strong> 
            ({(lastFaceDetected.current.score * 100).toFixed(1)}% confidence)
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default FaceDetection;
