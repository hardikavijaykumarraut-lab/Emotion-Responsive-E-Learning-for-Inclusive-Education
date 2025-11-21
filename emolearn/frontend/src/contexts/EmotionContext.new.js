import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const EmotionContext = createContext();

const useEmotion = () => {
  const context = useContext(EmotionContext);
  if (!context) {
    throw new Error('useEmotion must be used within an EmotionProvider');
  }
  return context;
};

const EmotionProvider = ({ children, onEmotionChange }) => {
  // State declarations
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelsActuallyLoaded, setModelsActuallyLoaded] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [currentEmotionScore, setCurrentEmotionScore] = useState(0);
  const [stableEmotion, setStableEmotion] = useState(null);
  const [stableEmotionScore, setStableEmotionScore] = useState(0);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const [lastEmotionTime, setLastEmotionTime] = useState(null);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [recentDetections, setRecentDetections] = useState([]);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs
  const lastStableEmotion = useRef(null);
  const stabilityCounter = useRef(0);
  const onEmotionAction = useRef(onEmotionChange || (() => {}));
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const animationFrameRef = useRef(null);
  const cooldownRef = useRef(null);
  
  // Constants
  const CONFIDENCE_THRESHOLD = 0.6;
  const STABILITY_FRAMES = 3;
  const DETECTION_INTERVAL = 300;
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
  
  // Start with utility functions that don't depend on other functions
  const startCooldown = useCallback(() => {
    setIsInCooldown(true);
    if (cooldownRef.current) clearTimeout(cooldownRef.current);
    cooldownRef.current = setTimeout(() => {
      console.log('Cooldown period ended');
      setIsInCooldown(false);
    }, 5000); // 5 seconds cooldown
  }, []);
  
  const getEmotionBasedAction = useCallback((emotion) => {
    const actions = {
      happy: {
        action: 'positive_reinforcement',
        message: 'You look happy! 😊',
        suggestion: 'Keep up the positive energy!',
        content: 'motivational-content',
        cooldown: 10000,
        color: '#4CAF50',
        actions: [
          'Continue with current content',
          'Try a more challenging exercise',
          'Teach what you\'ve learned to someone else'
        ]
      },
      neutral: {
        action: 'encouragement',
        message: 'You\'re doing well! Let\'s keep the momentum going.',
        suggestion: 'Try to engage more with the material to enhance your learning experience.',
        icon: '😐',
        color: '#2196F3',
        actions: [
          'Ask a question',
          'Take notes',
          'Try a practice exercise'
        ]
      },
      sad: {
        action: 'support',
        message: 'It seems like you might be feeling a bit down. Learning can be challenging, but you\'ve got this!',
        suggestion: 'Take a short break and come back refreshed.',
        icon: '😔',
        color: '#9C27B0',
        actions: [
          'Take a 5-minute break',
          'Try a different learning style',
          'Reach out for help'
        ]
      },
      angry: {
        action: 'calming',
        message: 'I can see you might be feeling frustrated. It\'s okay to take a step back.',
        suggestion: 'Try some deep breathing exercises before continuing.',
        icon: '😠',
        color: '#F44336',
        actions: [
          'Take a short break',
          'Try a different approach',
          'Ask for assistance'
        ]
      },
      fearful: {
        action: 'reassurance',
        message: 'It looks like you might be feeling uncertain. Remember, it\'s okay to make mistakes while learning.',
        suggestion: 'Start with something you\'re comfortable with to build confidence.',
        icon: '😨',
        color: '#FF9800',
        actions: [
          'Review previous material',
          'Break it down into smaller steps',
          'Ask for clarification'
        ]
      },
      disgusted: {
        action: 'redirection',
        message: 'I notice you might not be enjoying this. Let\'s try something different.',
        suggestion: 'Switch to a different topic or activity for now.',
        icon: '🤢',
        color: '#795548',
        actions: [
          'Try a different subject',
          'Take a short break',
          'Change your environment'
        ]
      },
      surprised: {
        action: 'engagement',
        message: 'I see you\'re surprised! That\'s a great opportunity for learning.',
        suggestion: 'Explore this new information further to deepen your understanding.',
        icon: '😲',
        color: '#FFC107',
        actions: [
          'Research more about this topic',
          'Ask questions',
          'Try a related exercise'
        ]
      }
    };
    
    return actions[emotion] || {
      action: 'continue',
      message: 'Keep learning!',
      suggestion: 'Your progress is being tracked. Let me know if you need any help!',
      icon: '📚',
      color: '#607D8B',
      actions: [
        'Continue learning',
        'Review progress',
        'Ask for help'
      ]
    };
  }, []);
  
  // Emotion detection functions
  const detectEmotion = useCallback(async () => {
    if (!videoRef.current || !videoRef.current.readyState || videoRef.current.readyState < 2) {
      console.log('Video not ready, skipping detection');
      return;
    }
    
    if (!modelsActuallyLoaded) {
      console.log('Models not loaded, skipping detection');
      return;
    }
    
    if (isInCooldown) {
      console.log('In cooldown, skipping detection');
      return;
    }
    
    try {
      const faceapi = window.faceapi || (await import('@vladmandic/face-api'));
      
      if (!faceapi?.nets?.tinyFaceDetector) {
        console.error('Face-API not properly initialized');
        return;
      }
      
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('Video dimensions not available yet');
        return;
      }
      
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.4,
          minFaceSize: 50
        }))
        .withFaceLandmarks()
        .withFaceExpressions();
        
      if (detections?.length > 0) {
        const expressions = detections[0].expressions;
        let maxEmotion = 'neutral';
        let maxScore = 0;
        
        for (const [emotion, score] of Object.entries(expressions)) {
          if (score > maxScore) {
            maxScore = score;
            maxEmotion = emotion;
          }
        }
        
        if (maxScore >= CONFIDENCE_THRESHOLD) {
          setCurrentEmotion(maxEmotion);
          setCurrentEmotionScore(maxScore);
          
          setEmotionHistory(prev => [...prev.slice(-9), { 
            emotion: maxEmotion, 
            score: maxScore, 
            timestamp: new Date() 
          }]);
          
          if (maxEmotion === lastStableEmotion.current) {
            stabilityCounter.current++;
            
            if (stabilityCounter.current >= STABILITY_FRAMES) {
              setStableEmotion(maxEmotion);
              setStableEmotionScore(maxScore);
              
              const action = getEmotionBasedAction(maxEmotion);
              if (action) {
                onEmotionAction.current?.(maxEmotion, action);
              }
              
              if (cooldownRef.current === null) {
                startCooldown();
              }
            }
          } else {
            lastStableEmotion.current = maxEmotion;
            stabilityCounter.current = 0;
          }
          
          return maxEmotion;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error in detectEmotion:', error);
      setError('Error detecting emotions. Please try again.');
      return null;
    }
  }, [isModelLoaded, isDetecting, isInCooldown, modelsActuallyLoaded, getEmotionBasedAction, startCooldown]);
  
  const startRealTimeDetection = useCallback(() => {
    if (!isDetecting || !videoRef.current) {
      console.log('Detection not started: isDetecting=', isDetecting, 'videoRef=', !!videoRef.current);
      return;
    }
    
    console.log('Starting real-time detection');
    
    let lastDetectionTime = 0;
    let isProcessing = false;
    
    const detectFrame = async () => {
      if (!isDetecting) {
        console.log('Detection stopped, exiting detection loop');
        return;
      }
      
      const now = Date.now();
      
      if (isProcessing || now - lastDetectionTime < DETECTION_INTERVAL) {
        animationFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }
      
      lastDetectionTime = now;
      isProcessing = true;
      
      try {
        await detectEmotion();
      } catch (error) {
        console.error('Error in detection frame:', error);
      } finally {
        isProcessing = false;
        animationFrameRef.current = requestAnimationFrame(detectFrame);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(detectFrame);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isDetecting, detectEmotion]);
  
  // Model loading
  const loadModels = useCallback(async () => {
    if (isInitialized) return true;
    
    setError(null);
    setModelsActuallyLoaded(false);
    setIsModelLoaded(false);
    
    try {
      // Set the model path to use CDN
      const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
      
      // Load models with error handling and retry logic
      const loadWithRetry = async (loader, retries = 3, delay = 1000) => {
        for (let i = 0; i < retries; i++) {
          try {
            await loader();
            return true;
          } catch (err) {
            console.warn(`Attempt ${i + 1} failed:`, err);
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        return false;
      };
      
      // Load models with retry logic
      await loadWithRetry(() => faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL));
      await loadWithRetry(() => faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL));
      await loadWithRetry(() => faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL));
      await loadWithRetry(() => faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL));
      
      setModelsActuallyLoaded(true);
      setIsModelLoaded(true);
      setIsInitialized(true);
      
      console.log('Face detection models loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading face detection models:', error);
      setError('Failed to load face detection models. Please try refreshing the page.');
      setModelsActuallyLoaded(false);
      setIsModelLoaded(false);
      return false;
    }
  }, [isInitialized]);
  
  // Start/stop detection
  const startEmotionDetection = useCallback(async (videoElement) => {
    if (isDetecting) return false;
    
    setError(null);
    
    // Store the video element reference
    if (videoElement) {
      videoRef.current = videoElement;
    }
    
    // If we still don't have a video element, throw an error
    if (!videoRef.current) {
      setError('Video element not found');
      return false;
    }
    
    try {
      // Load models if not already loaded
      const modelsLoaded = await loadModels();
      if (!modelsLoaded) {
        setError('Failed to load face detection models');
        return false;
      }
      
      // Request camera access
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          // Stop any existing stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
          
          // Request camera access
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
              frameRate: { ideal: 30, min: 15 }
            },
            audio: false
          });
          
          // Store the stream reference
          streamRef.current = stream;
          
          // Set the video source
          videoRef.current.srcObject = stream;
          
          // Wait for the video to be ready
          await new Promise((resolve) => {
            const onLoaded = () => {
              videoRef.current.removeEventListener('loadedmetadata', onLoaded);
              videoRef.current.play().then(() => {
                console.log('Video started playing');
                resolve();
              }).catch(err => {
                console.error('Error playing video:', err);
                setError('Error accessing camera. Please ensure you have granted camera permissions.');
                resolve();
              });
            };
            
            videoRef.current.addEventListener('loadedmetadata', onLoaded, { once: true });
            
            // Set a timeout in case the video never loads
            setTimeout(() => {
              videoRef.current.removeEventListener('loadedmetadata', onLoaded);
              console.warn('Video loading timed out');
              resolve();
            }, 5000);
          });
          
          // Start detection
          setIsDetecting(true);
          startRealTimeDetection();
          
          return true;
          
        } catch (err) {
          console.error('Error accessing camera:', err);
          
          // Handle specific error cases
          if (err.name === 'NotAllowedError') {
            setError('Camera access was denied. Please allow camera access to use this feature.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError('No camera found. Please connect a camera and try again.');
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            setError('Camera is already in use by another application. Please close other applications using the camera.');
          } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
            setError('The requested camera constraints could not be satisfied. Please try a different camera.');
          } else if (err.name === 'NotSupportedError') {
            setError('This browser does not support camera access. Please try using a modern browser like Chrome or Firefox.');
          } else if (err.name === 'InsecureContextError') {
            setError('Camera access is only available in secure contexts (HTTPS or localhost).');
          } else {
            setError(`Error accessing camera: ${err.message}`);
          }
          
          return false;
        }
      } else {
        setError('getUserMedia is not supported in this browser');
        return false;
      }
    } catch (error) {
      console.error('Error starting emotion detection:', error);
      setError('Failed to start emotion detection. Please try again.');
      return false;
    }
  }, [isDetecting, loadModels, startRealTimeDetection]);
  
  // Stop emotion detection and clean up
  const stopEmotionDetection = useCallback(() => {
    console.log('Stopping emotion detection');
    
    // Stop the detection loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop the video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Clear the video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Clear any active timeouts
    if (cooldownRef.current) {
      clearTimeout(cooldownRef.current);
      cooldownRef.current = null;
    }
    
    // Reset detection state
    setIsDetecting(false);
    setCurrentEmotion(null);
    setRecentDetections([]);
  }, []);
  
  // Log emotion to the server
  const logEmotion = useCallback(async (emotionData) => {
    try {
      // In a real app, you would send this to your backend
      console.log('Logging emotion:', emotionData);
      
      // For now, just update the state
      setEmotionHistory(prev => [...prev, {
        ...emotionData,
        timestamp: new Date().toISOString()
      }]);
      
      return { success: true };
    } catch (error) {
      console.error('Error logging emotion:', error);
      return { success: false, error: error.message };
    }
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopEmotionDetection();
    };
  }, [stopEmotionDetection]);
  
  // Context value
  const contextValue = {
    // State
    isModelLoaded,
    modelsActuallyLoaded,
    currentEmotion,
    currentEmotionScore,
    stableEmotion,
    stableEmotionScore,
    emotionHistory,
    isDetecting,
    cameraPermission,
    error,
    
    // Refs
    videoRef,
    
    // Functions
    startEmotionDetection,
    stopEmotionDetection,
    logEmotion,
    getEmotionBasedAction
  };
  
  return (
    <EmotionContext.Provider value={contextValue}>
      {children}
    </EmotionContext.Provider>
  );
};

export { EmotionProvider, useEmotion };
