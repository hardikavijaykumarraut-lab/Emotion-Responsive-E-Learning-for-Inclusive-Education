import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import { Videocam, VideocamOff, Error as ErrorIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import './FaceDetection.css';

const PYTHON_SERVICE_WS = 'ws://localhost:8000/ws/emotion-detection';

const PythonFaceDetection = ({ onEmotionDetected, onFaceDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionInterval = useRef(null);
  const ws = useRef(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectionActive, setDetectionActive] = useState(false);
  const [fps, setFps] = useState(0);
  const lastFpsUpdate = useRef(0);
  const frameCount = useRef(0);
  const lastFaceDetected = useRef(null);
  const frameQueue = useRef([]);
  const isProcessing = useRef(false);
  const { user } = useAuth(); // Get user from auth context

  // Initialize WebSocket connection
  const initWebSocket = useCallback(() => {
    try {
      console.log('Attempting to connect to WebSocket at:', PYTHON_SERVICE_WS);
      ws.current = new WebSocket(PYTHON_SERVICE_WS);
      
      ws.current.onopen = () => {
        console.log('Successfully connected to Python emotion detection service');
        setError(null);
        
        // Send user ID to Python service
        if (user && user._id) {
          const userIdMessage = JSON.stringify({ userId: user._id });
          ws.current.send(userIdMessage);
          console.log('Sent user ID to Python service:', user._id);
        }
        
        // Start detection immediately after connection
        if (cameraActive && !detectionActive) {
          toggleDetection();
        }
      };
      
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.error) {
            console.error('Error from emotion detection service:', data.error);
            return;
          }
          
          // Call the callback with emotion data
          if (onEmotionDetected) {
            onEmotionDetected(data);
          }
          
          // Call the face detected callback if a face is detected
          if (onFaceDetected) {
            onFaceDetected(data.face_detected || false);
          }
          
        } catch (err) {
          console.error('Error processing message from WebSocket:', err);
        } finally {
          isProcessing.current = false;
        }
      };
      
      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        const errorMsg = 'Failed to connect to emotion detection service. ';
        console.error(errorMsg, 'Please make sure the Python service is running at ' + PYTHON_SERVICE_WS);
        setError(errorMsg + 'Check console for details.');
        setIsLoading(false);
      };
      
      ws.current.onclose = () => {
        console.log('Disconnected from emotion detection service');
        setDetectionActive(false);
      };
      
      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    } catch (err) {
      console.error('Error initializing WebSocket:', err);
      setError('Failed to initialize WebSocket connection');
    }
  }, [cameraActive, detectionActive, onEmotionDetected, onFaceDetected, user]);

  // Start/stop video stream
  const toggleVideo = useCallback(async () => {
    if (cameraActive) {
      // Stop the camera if it's already active
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
      setDetectionActive(false);
      return;
    }

    // Start the camera
    console.log('Attempting to access camera...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      
      console.log('Camera access granted, got stream:', stream);
      
      if (!videoRef.current) {
        console.error('Video ref not available');
        setIsLoading(false);
        return;
      }
      
      const videoElement = videoRef.current;
      videoElement.srcObject = stream;
      
      // Add event listeners for the video element
      const onLoadedMetadata = () => {
        console.log('Video metadata loaded');
      };
      
      const onPlay = () => {
        console.log('Video started playing');
        setCameraActive(true);
        initWebSocket();
        setIsLoading(false);
      };
      
      const onError = (e) => {
        console.error('Video playback error:', e);
        setError('Failed to start video playback');
        setIsLoading(false);
      };
      
      videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
      videoElement.addEventListener('play', onPlay);
      videoElement.addEventListener('error', onError);
      
      // Start playing the video
      console.log('Attempting to play video...');
      try {
        await videoElement.play();
      } catch (playError) {
        console.error('Error playing video:', playError);
        setError('Error playing video: ' + playError.message);
        setIsLoading(false);
        return;
      }
      
      // Return cleanup function
      return () => {
        videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        videoElement.removeEventListener('play', onPlay);
        videoElement.removeEventListener('error', onError);
      };
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(
        err.name === 'NotAllowedError' 
          ? 'Camera access was denied. Please allow camera permissions and try again.'
          : 'Could not access camera. Please ensure your camera is connected and not in use by another application.'
      );
      setCameraActive(false);
      setIsLoading(false);
    }
  }, [cameraActive, initWebSocket]);

  // Process video frames
  const processFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState !== 4 || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
      detectionInterval.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (canvas && video) {
        const context = canvas.getContext('2d');
        
        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // FPS calculation
        const now = performance.now();
        frameCount.current++;
        
        if (now - lastFpsUpdate.current > 1000) {
          setFps(Math.round((frameCount.current * 1000) / (now - lastFpsUpdate.current)));
          frameCount.current = 0;
          lastFpsUpdate.current = now;
        }
        
        // Only process a new frame if we're not currently processing one
        if (!isProcessing.current) {
          // Get the image data as base64
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          
          // Send to Python service via WebSocket
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            isProcessing.current = true;
            ws.current.send(imageData);
          }
        }
      }
      
      detectionInterval.current = requestAnimationFrame(processFrame);
    } catch (err) {
      console.error('Error in processFrame:', err);
      detectionInterval.current = requestAnimationFrame(processFrame);
    }
  }, []);

  // Start/stop detection
  const toggleDetection = useCallback(() => {
    if (detectionActive) {
      if (detectionInterval.current) {
        cancelAnimationFrame(detectionInterval.current);
        detectionInterval.current = null;
      }
      setDetectionActive(false);
    } else {
      if (cameraActive && !detectionInterval.current) {
        detectionInterval.current = requestAnimationFrame(processFrame);
        setDetectionActive(true);
      }
    }
  }, [cameraActive, detectionActive, processFrame]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (detectionInterval.current) {
        cancelAnimationFrame(detectionInterval.current);
      }
      if (ws.current) {
        ws.current.close();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <Box className="face-detection-container" sx={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <Box className="video-container" sx={{ position: 'relative', margin: '20px 0', width: '100%', maxWidth: '640px' }}>
        <video
          ref={videoRef}
          className="video-element"
          playsInline
          muted
          autoPlay
          style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={canvasRef}
          className="canvas-overlay"
          width={640}
          height={480}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }}
        />
      </Box>
      
      <Box className="controls" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          color={cameraActive ? 'secondary' : 'primary'}
          onClick={toggleVideo}
          startIcon={cameraActive ? <VideocamOff /> : <Videocam />}
          disabled={isLoading}
          sx={{ minWidth: '150px' }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              Loading...
            </Box>
          ) : cameraActive ? (
            'Stop Camera'
          ) : (
            'Start Camera'
          )}
        </Button>
        
        <Button
          variant="contained"
          color={detectionActive ? 'secondary' : 'primary'}
          onClick={toggleDetection}
          disabled={!cameraActive || isLoading}
          sx={{ minWidth: '150px' }}
        >
          {detectionActive ? 'Stop Detection' : 'Start Detection'}
        </Button>
        
        {fps > 0 && (
          <Typography variant="body2" color="textSecondary" sx={{ display: 'inline' }}>
            {fps} FPS
          </Typography>
        )}
      </Box>
      
      {isLoading && (
        <Box className="loading-overlay" sx={{ textAlign: 'center', mt: 2 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading emotion detection...
          </Typography>
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Box display="flex" alignItems="center">
            <ErrorIcon sx={{ mr: 1 }} />
            {error}
          </Box>
        </Alert>
      )}
      
      <Box className="instructions" sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          {!cameraActive 
            ? 'Click "Start Camera" to begin emotion detection.'
            : !detectionActive 
              ? 'Click "Start Detection" to begin analyzing your emotions.'
              : 'Look at the camera to detect emotions.'}
        </Typography>
      </Box>
    </Box>
  );
};

export default PythonFaceDetection;