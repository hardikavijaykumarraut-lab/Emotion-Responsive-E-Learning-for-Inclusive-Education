import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon
} from '@mui/icons-material';
import { learningContent } from '../../data/learningContent';
import { useAuth } from '../../contexts/AuthContext';
import { trackContentView } from '../../services/progressService';

const LearningContent = ({ subject, currentModule, onModuleChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const { user } = useAuth();
  
  // Log the subject and available keys for debugging
  console.log('Current subject:', subject);
  console.log('Available subjects:', Object.keys(learningContent));
  
  const subjectData = learningContent[subject] || learningContent['mathematics'];
  console.log('Loaded subject data:', subjectData);
  
  const module = subjectData.modules[currentModule] || subjectData.modules[0];
  const totalModules = subjectData.modules.length;
  
  console.log('Current module:', module);

  useEffect(() => {
    let interval;
    let contentTimeSpent = 0;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev >= 100 ? 100 : prev + 2;
          contentTimeSpent += 1;
          
          // Track progress in real-time (every 10 seconds)
          if (contentTimeSpent % 10 === 0 && user && user._id) {
            trackContentView(user._id, subject, 10) // 10 seconds
              .then(response => {
                console.log('Content view time tracked:', response);
              })
              .catch(error => {
                console.error('Error tracking content view time:', error);
              });
          }
          
          if (newProgress >= 100) {
            setIsPlaying(false);
          }
          
          return newProgress;
        });
      }, 1000);
    }
    
    return () => {
      clearInterval(interval);
      // Track any remaining time when stopping
      if (contentTimeSpent % 10 !== 0 && user && user._id) {
        trackContentView(user._id, subject, contentTimeSpent % 10)
          .then(response => {
            console.log('Final content view time tracked:', response);
          })
          .catch(error => {
            console.error('Error tracking final content view time:', error);
          });
      }
      setTimeSpent(prev => prev + contentTimeSpent);
    };
  }, [isPlaying, subject, user]);

  const handleNext = async () => {
    // Track module completion when moving to next module
    if (currentModule < totalModules - 1 && user && user._id) {
      try {
        // Track content view before moving to next module
        if (timeSpent > 0) {
          await trackContentView(user._id, subject, timeSpent);
        }
      } catch (error) {
        console.error('Error tracking content view:', error);
      }
    }
    
    if (currentModule < totalModules - 1) {
      onModuleChange(currentModule + 1);
      setProgress(0);
      setIsPlaying(false);
      setTimeSpent(0);
    }
  };

  const handlePrevious = async () => {
    // Track content view before moving to previous module
    if (user && user._id) {
      try {
        if (timeSpent > 0) {
          await trackContentView(user._id, subject, timeSpent);
        }
      } catch (error) {
        console.error('Error tracking content view:', error);
      }
    }
    
    if (currentModule > 0) {
      onModuleChange(currentModule - 1);
      setProgress(0);
      setIsPlaying(false);
      setTimeSpent(0);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <Card sx={{ height: 'fit-content' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            {subjectData.name}
          </Typography>
          <Chip 
            label={`Module ${currentModule + 1} of ${totalModules}`}
            color="primary"
            variant="outlined"
          />
        </Box>

        <Typography variant="h6" component="h3" gutterBottom>
          {module.title}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Progress: {Math.round(progress)}%
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            {module.content}
          </Typography>
          
          {module.keyPoints && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Key Points:
              </Typography>
              <ul style={{ paddingLeft: '20px' }}>
                {module.keyPoints.map((point, index) => (
                  <li key={index}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {point}
                    </Typography>
                  </li>
                ))}
              </ul>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Previous module">
              <span>
                <IconButton 
                  onClick={handlePrevious}
                  disabled={currentModule === 0}
                  aria-label="Previous module"
                >
                  <PrevIcon />
                </IconButton>
              </span>
            </Tooltip>
            
            <Tooltip title={isPlaying ? "Pause reading" : "Start reading"}>
              <IconButton 
                onClick={togglePlayPause}
                color="primary"
                aria-label={isPlaying ? "Pause reading" : "Start reading"}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Next module">
              <span>
                <IconButton 
                  onClick={handleNext}
                  disabled={currentModule === totalModules - 1}
                  aria-label="Next module"
                >
                  <NextIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          <Button
            variant="contained"
            onClick={handleNext}
            disabled={currentModule === totalModules - 1 || progress < 80}
            endIcon={<NextIcon />}
          >
            {currentModule === totalModules - 1 ? 'Complete' : 'Next Module'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LearningContent;