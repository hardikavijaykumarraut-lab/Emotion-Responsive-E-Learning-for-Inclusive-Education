import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import progressService from '../services/progressService';

const EmotionContext = createContext();

const useEmotion = () => {
  const context = useContext(EmotionContext);
  if (!context) {
    throw new Error('useEmotion must be used within an EmotionProvider');
  }
  return context;
};

const EmotionProvider = ({ children, onEmotionChange, userId }) => {
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
  const [currentUserId, setCurrentUserId] = useState(userId);
  
  // Modal state for emotion-based content delivery
  const [showFunFactModal, setShowFunFactModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showMotivationModal, setShowMotivationModal] = useState(false);
  const [modalSubject, setModalSubject] = useState('mathematics');
  
  // Refs
  const lastStableEmotion = useRef(null);
  const stabilityCounter = useRef(0);
  const onEmotionAction = useRef(onEmotionChange || (() => {}));
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const animationFrameRef = useRef(null);
  const cooldownRef = useRef(null);
  const lastModalTrigger = useRef(null);
  
  // Constants
  const CONFIDENCE_THRESHOLD = 0.6;
  const STABILITY_FRAMES = 3;
  const DETECTION_INTERVAL = 300;
  const LOCAL_MODEL_URL = '/models'; // Use local models instead of CDN
  const MODAL_COOLDOWN = 30000; // 30 seconds between modal triggers
  
  // Utility functions
  const startCooldown = useCallback(() => {
    setIsInCooldown(true);
    if (cooldownRef.current) clearTimeout(cooldownRef.current);
    cooldownRef.current = setTimeout(() => {
      console.log('Cooldown period ended');
      setIsInCooldown(false);
    }, 5000); // 5 seconds cooldown
  }, []);
  
  // Check if enough time has passed since last modal trigger
  const canTriggerModal = useCallback(() => {
    if (!lastModalTrigger.current) return true;
    const now = Date.now();
    return (now - lastModalTrigger.current) > MODAL_COOLDOWN;
  }, []);
  
  // Trigger appropriate modal based on emotion
  const triggerEmotionModal = useCallback((emotion) => {
    // Only trigger modals for specific emotions and if cooldown period has passed
    if (!canTriggerModal()) {
      console.log('Modal trigger skipped due to cooldown');
      return;
    }
    
    // Select a random subject for the modal content
    const subjects = ['mathematics', 'science', 'history', 'geography', 'english', 'computer-science'];
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    setModalSubject(randomSubject);
    
    switch (emotion) {
      case 'angry':
        console.log('Triggering Fun Fact Modal for angry emotion');
        setShowFunFactModal(true);
        lastModalTrigger.current = Date.now();
        break;
      case 'disgusted':
      case 'sad':
        console.log(`Triggering Quiz Modal for ${emotion} emotion`);
        setShowQuizModal(true);
        lastModalTrigger.current = Date.now();
        break;
      case 'fearful':
        console.log('Triggering Motivation Modal for fearful emotion');
        setShowMotivationModal(true);
        lastModalTrigger.current = Date.now();
        break;
      default:
        console.log(`No modal configured for emotion: ${emotion}`);
    }
  }, [canTriggerModal]);
  
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
      },
      confused: {
        action: 'clarification',
        message: 'I notice you might be feeling confused. Let me help clarify this concept.',
        suggestion: 'Let\'s break this down into simpler parts to make it easier to understand.',
        icon: '🤔',
        color: '#607D8B',
        actions: [
          'Review the basics',
          'Ask for a simpler explanation',
          'Try a different example'
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
        
        // Add confused emotion handling
        // In real implementation, this would come from the model
        // For now, we'll simulate it based on certain conditions
        const confusedScore = (expressions.surprised || 0) * 0.7 + (expressions.neutral || 0) * 0.3;
        
        for (const [emotion, score] of Object.entries(expressions)) {
          if (score > maxScore) {
            maxScore = score;
            maxEmotion = emotion;
          }
        }
        
        // Check if confused emotion should be triggered
        if (confusedScore > maxScore && confusedScore > 0.4) {
          maxEmotion = 'confused';
          maxScore = confusedScore;
        }
        
        if (maxScore >= CONFIDENCE_THRESHOLD) {
          setCurrentEmotion(maxEmotion);
          setCurrentEmotionScore(maxScore);
          
          const emotionData = { 
            emotion: maxEmotion, 
            score: maxScore, 
            timestamp: new Date() 
          };
          
          setEmotionHistory(prev => [...prev.slice(-9), emotionData]);
          
          if (maxEmotion === lastStableEmotion.current) {
            stabilityCounter.current++;
            
            if (stabilityCounter.current >= STABILITY_FRAMES) {
              setStableEmotion(maxEmotion);
              setStableEmotionScore(maxScore);
              
              const action = getEmotionBasedAction(maxEmotion);
              if (action) {
                onEmotionAction.current?.(maxEmotion, action);
              }
              
              // Trigger emotion-based modal
              triggerEmotionModal(maxEmotion);
              
              // Log emotion to database (async, don't wait)
              logEmotion({ emotion: maxEmotion, confidence: maxScore });
              
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
  }, [isModelLoaded, isDetecting, isInCooldown, modelsActuallyLoaded, getEmotionBasedAction, startCooldown, triggerEmotionModal]);
  
  const startRealTimeDetection = useCallback(() => {
    if (!isDetecting) {
      console.log('Detection not started: isDetecting is false');
      return () => {}; // Return empty cleanup function
    }
    
    if (!videoRef.current) {
      console.error('Video ref not available');
      return () => {};
    }
    
    console.log('Starting real-time detection');
    
    let lastDetectionTime = 0;
    let isProcessing = false;
    let isMounted = true;
    
    const detectFrame = async () => {
      if (!isMounted || !isDetecting) {
        console.log('Stopping detection loop: isMounted=', isMounted, 'isDetecting=', isDetecting);
        return;
      }
      
      const now = Date.now();
      const timeSinceLastDetection = now - lastDetectionTime;
      
      if (isProcessing) {
        console.log('Skipping frame: already processing');
        scheduleNextFrame();
        return;
      }
      
      if (timeSinceLastDetection < DETECTION_INTERVAL) {
        // Schedule next frame if not enough time has passed
        const timeToNextFrame = DETECTION_INTERVAL - timeSinceLastDetection;
        setTimeout(scheduleNextFrame, timeToNextFrame);
        return;
      }
      
      lastDetectionTime = now;
      isProcessing = true;
      
      try {
        if (isMounted && isDetecting) {
          await detectEmotion();
        }
      } catch (error) {
        console.error('Error in detection frame:', error);
      } finally {
        isProcessing = false;
        if (isMounted && isDetecting) {
          scheduleNextFrame();
        }
      }
    };
    
    const scheduleNextFrame = () => {
      if (isMounted && isDetecting) {
        animationFrameRef.current = requestAnimationFrame(detectFrame);
      }
    };
    
    // Start the detection loop
    scheduleNextFrame();
    
    // Cleanup function
    return () => {
      console.log('Cleaning up detection loop');
      isMounted = false;
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
      // Use local models from public/models directory
      const MODEL_PATH = '/models';
      
      console.log('Starting to load face detection models from', MODEL_PATH);
      
      // Load models with error handling and retry logic
      const loadWithRetry = async (loader, modelName, retries = 3, delay = 1000) => {
        for (let i = 0; i < retries; i++) {
          try {
            console.log(`Loading ${modelName} (attempt ${i + 1}/${retries})...`);
            await loader();
            console.log(`${modelName} loaded successfully`);
            return true;
          } catch (err) {
            console.error(`Attempt ${i + 1} failed for ${modelName}:`, err);
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          }
        }
        return false;
      };
      
      // Load models with retry logic and better error reporting
      await loadWithRetry(
        () => faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
        'TinyFaceDetector'
      );
      
      await loadWithRetry(
        () => faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
        'FaceLandmark68Net'
      );
      
      await loadWithRetry(
        () => faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
        'FaceRecognitionNet'
      );
      
      await loadWithRetry(
        () => faceapi.nets.faceExpressionNet.loadFromUri(MODEL_PATH),
        'FaceExpressionNet'
      );
      
      console.log('All face detection models loaded successfully');
      setModelsActuallyLoaded(true);
      setIsModelLoaded(true);
      setIsInitialized(true);
      
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
          
          // Request camera access with simplified constraints
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,  // Use simple constraint to maximize compatibility
            audio: false
          });
          
          // Store the stream reference
          streamRef.current = stream;
          
          // Set the video source
          videoRef.current.srcObject = stream;
          
          // Wait for the video to be ready with a timeout
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
          
          // Start detection after a small delay to ensure video is fully ready
          console.log('Video ready, starting detection...');
          setIsDetecting(true);
          setCameraPermission('granted');
          return true;
          
        } catch (err) {
          console.error('Error accessing camera:', err);
          
          // Handle specific error cases with more user-friendly messages
          if (err.name === 'NotAllowedError') {
            setCameraPermission('denied');
            setError('Camera access was denied. Please allow camera access in your browser settings and reload the page.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError('No camera found. Please connect a camera and reload the page.');
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            setError('Camera is already in use. Please close other applications using the camera and reload the page.');
          } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
            setError('The requested camera constraints could not be satisfied. Please try a different camera.');
          } else if (err.name === 'NotSupportedError') {
            setError('This browser does not support camera access. Please try using a modern browser like Chrome or Firefox.');
          } else if (err.name === 'InsecureContextError') {
            setError('Camera access is only available in secure contexts (HTTPS or localhost).');
          } else {
            setError(`Camera error: Please check your camera permissions and reload the page.`);
          }
          
          return false;
        }
      } else {
        setError('Your browser does not support camera access. Please try a modern browser like Chrome or Firefox.');
        return false;
      }
    } catch (error) {
      console.error('Error starting emotion detection:', error);
      setError('Failed to start emotion detection. Please reload the page and try again.');
      return false;
    }
  }, [isDetecting, loadModels, startRealTimeDetection]);
  
  // Stop emotion detection and clean up
  const stopEmotionDetection = useCallback(() => {
    console.log('Stopping emotion detection');
    
    // Set isDetecting to false first to stop any new detections
    setIsDetecting(false);
    
    // Stop the detection loop
    if (animationFrameRef.current) {
      console.log('Cancelling animation frame');
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop the video stream
    if (streamRef.current) {
      console.log('Stopping video tracks');
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Clear the video element
    if (videoRef.current) {
      console.log('Clearing video source');
      videoRef.current.srcObject = null;
    }
    
    // Clear any active timeouts
    if (cooldownRef.current) {
      console.log('Clearing cooldown timeout');
      clearTimeout(cooldownRef.current);
      cooldownRef.current = null;
    }
    
    // Reset detection state
    setCurrentEmotion(null);
    setRecentDetections([]);
    console.log('Emotion detection stopped and cleaned up');
  }, []);
  
  // Update userId when it changes
  useEffect(() => {
    setCurrentUserId(userId);
  }, [userId]);
  
  // Start/stop real-time detection when isDetecting changes
  useEffect(() => {
    let mounted = true;

    const handleDetection = async () => {
      if (isDetecting && modelsActuallyLoaded) {
        // Start emotion detection
        const started = await startEmotionDetection();
        if (!started && mounted) {
          setIsDetecting(false);
        }
      } else if (!isDetecting) {
        // Stop emotion detection
        await stopEmotionDetection();
      }
    };

    if (mounted) {
      handleDetection().catch(error => {
        console.error('Error in emotion detection:', error);
        if (mounted) {
          setIsDetecting(false);
        }
      });
    }

    // Cleanup function
    return () => {
      mounted = false;
      return stopEmotionDetection();
    };
  }, [isDetecting, modelsActuallyLoaded, startEmotionDetection, stopEmotionDetection]);

  // Log emotion to the server
  const logEmotion = useCallback(async (emotionData) => {
    try {
      // Log to local state
      setEmotionHistory(prev => [...prev, {
        ...emotionData,
        timestamp: new Date().toISOString()
      }]);
      
      // Log to database if user is logged in
      if (currentUserId && !emotionData.isGuest) {
        const result = await progressService.logEmotion(currentUserId, {
          emotion: emotionData.emotion,
          confidence: emotionData.confidence,
          timestamp: new Date().toISOString(),
          context: {
            source: 'face-api',
            activity: 'learning',
            sessionId: localStorage.getItem('sessionId') || Math.random().toString(36).substr(2, 9)
          }
        });
        
        if (!result.success) {
          console.warn('Failed to log emotion to database:', result.error);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error logging emotion:', error);
      return { success: false, error: error.message };
    }
  }, [currentUserId]);
  
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
    
    // Modal state
    showFunFactModal,
    setShowFunFactModal,
    showQuizModal,
    setShowQuizModal,
    showMotivationModal,
    setShowMotivationModal,
    modalSubject,
    
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