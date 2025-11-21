import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const EmotionContext = createContext();

export const useEmotion = () => {
  const context = useContext(EmotionContext);
  if (!context) {
    throw new Error('useEmotion must be used within an EmotionProvider');
  }
  return context;
};

const EmotionProvider = ({ children, onEmotionChange }) => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelsActuallyLoaded, setModelsActuallyLoaded] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const [lastEmotionTime, setLastEmotionTime] = useState(null);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [recentDetections, setRecentDetections] = useState([]);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const animationFrameRef = useRef(null);
  const cooldownRef = useRef(null);
  
  // Emotion detection configuration
  const CONFIDENCE_THRESHOLD = 0.6;
  const STABILITY_FRAMES = 3;
  const MIN_FACE_SIZE = 100;
  const DETECTION_INTERVAL = 300;
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';

  // Load face-api.js models on component mount
  useEffect(() => {
    const loadModels = async () => {
      setError('Loading AI models...');
      
      try {
        const faceapi = await import('@vladmandic/face-api');
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        
        // Set the model path
        faceapi.env.monkeyPatch({
          fetch: (url) => fetch(url).catch(error => {
            console.error('Failed to fetch model file');
            throw error;
          })
        });
        
        // Load all required models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL).catch(e => 
            console.error('Failed to load tinyFaceDetector:', e)
          ),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL).catch(e => 
            console.error('Failed to load faceLandmark68Net:', e)
          ),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL).catch(e => 
            console.error('Failed to load faceRecognitionNet:', e)
          ),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL).catch(e => 
            console.error('Failed to load faceExpressionNet:', e)
          )
        ]);
        
        setModelsActuallyLoaded(true);
        setError(null);
      } catch (error) {
        console.error('Error loading models:', error);
        setError('Failed to load face detection models. Please try refreshing the page.');
      } finally {
        setIsModelLoaded(true);
      }
    };

    loadModels();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (cooldownRef.current) {
        clearTimeout(cooldownRef.current);
      }
    };
  }, []);

  // Check if the detected emotion is stable across multiple detections
  const isStableEmotion = (emotion) => {
    if (recentDetections.length < STABILITY_FRAMES) return false;
    
    const lastDetections = recentDetections.slice(-STABILITY_FRAMES);
    const matchCount = lastDetections.filter(det => det === emotion).length;
    
    return matchCount >= Math.ceil(STABILITY_FRAMES * 0.7);
  };

  // Start camera and emotion detection
  const startEmotionDetection = async () => {
    if (isDetecting || !modelsActuallyLoaded) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' 
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              resolve();
            };
          }
        });
        
        setIsDetecting(true);
        startRealTimeDetection();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access the camera. Please check your permissions.');
    }
  };

  // Stop emotion detection and clean up
  const stopEmotionDetection = () => {
    setIsDetecting(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Optimized real-time detection with controlled frame rate
  const startRealTimeDetection = () => {
    if (!isDetecting || !videoRef.current) return;
    
    let lastDetectionTime = 0;
    
    const detectFrame = async () => {
      if (!isDetecting) return;
      
      const now = Date.now();
      if (now - lastDetectionTime >= DETECTION_INTERVAL) {
        lastDetectionTime = now;
        await detectEmotion();
      }
      
      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };
    
    detectFrame();
  };

  // Enhanced face detection and emotion analysis
  const detectEmotion = async () => {
    if (!videoRef.current || !modelsActuallyLoaded || isInCooldown) return;
    
    try {
      const faceapi = await import('@vladmandic/face-api');
      
      // Detect all faces in the video element
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5
        }))
        .withFaceLandmarks()
        .withFaceExpressions();
      
      if (detections && detections.length > 0) {
        // Get the face with highest confidence
        const detection = detections.reduce((prev, current) => 
          (prev.detection.score > current.detection.score) ? prev : current
        );
        
        // Get the dominant emotion
        const expressions = detection.expressions;
        let maxEmotion = 'neutral';
        let maxConfidence = 0;
        
        Object.entries(expressions).forEach(([emotion, confidence]) => {
          if (confidence > maxConfidence) {
            maxConfidence = confidence;
            maxEmotion = emotion;
          }
        });
        
        // Only update if confidence is above threshold
        if (maxConfidence >= CONFIDENCE_THRESHOLD) {
          // Update recent detections
          setRecentDetections(prev => {
            const updated = [...prev, maxEmotion].slice(-STABILITY_FRAMES);
            return updated;
          });
          
          // Check if emotion is stable
          if (isStableEmotion(maxEmotion)) {
            setCurrentEmotion(maxEmotion);
            setLastEmotionTime(Date.now());
            
            // Log the emotion
            logEmotion({
              emotion: maxEmotion,
              confidence: maxConfidence,
              timestamp: new Date().toISOString()
            });
            
            // Start cooldown to prevent too frequent updates
            startCooldown();
            
            // Notify parent component if needed
            if (onEmotionChange) {
              onEmotionChange({
                emotion: maxEmotion,
                confidence: maxConfidence,
                action: getEmotionBasedAction(maxEmotion)
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error in emotion detection:', err);
    }
  };

  // Start cooldown period
  const startCooldown = () => {
    setIsInCooldown(true);
    
    // Clear any existing timeout
    if (cooldownRef.current) {
      clearTimeout(cooldownRef.current);
    }
    
    // Set a new timeout to end the cooldown period
    cooldownRef.current = setTimeout(() => {
      setIsInCooldown(false);
    }, 5000); // 5 seconds cooldown
  };

  // Log emotion to the server
  const logEmotion = async (emotionData) => {
    try {
      const response = await fetch('/api/emotions/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emotionData),
      });

      if (!response.ok) {
        throw new Error('Failed to log emotion');
      }

      return await response.json();
    } catch (err) {
      console.error('Error logging emotion:', err);
      throw err;
    }
  };

  // Get emotion-based content recommendation with detailed responses
  const getEmotionBasedAction = (emotion) => {
    const actions = {
      happy: {
        action: 'positive_reinforcement',
        message: 'You\'re doing great! Your engagement is helping you learn more effectively.',
        suggestion: 'Try tackling a challenging problem while you\'re in this positive state!',
        icon: '😊',
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
  };

  // Context value to be provided to consumers
  const contextValue = {
    isModelLoaded,
    modelsActuallyLoaded,
    currentEmotion,
    emotionHistory,
    isDetecting,
    cameraPermission,
    isInCooldown,
    error,
    videoRef,
    startEmotionDetection,
    stopEmotionDetection,
    getEmotionBasedAction
  };

  return (
    <EmotionContext.Provider value={contextValue}>
      {children}
    </EmotionContext.Provider>
  );
};

export default EmotionProvider;
