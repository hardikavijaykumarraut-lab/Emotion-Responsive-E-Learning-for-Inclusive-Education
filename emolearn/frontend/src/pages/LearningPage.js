import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Paper, Container, Button, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Videocam as VideocamIcon, School as SchoolIcon, CheckCircle as CheckCircleIcon, EmojiEvents as EmojiEventsIcon } from '@mui/icons-material';
import EmotionDetector from '../components/EmotionDetector/EmotionDetector';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const VideoContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  backgroundColor: theme.palette.grey[100],
  height: '100%',
  minHeight: '400px',
  display: 'flex',
  flexDirection: 'column',
}));

const LearningPage = () => {
  const [currentLesson, setCurrentLesson] = useState(1);
  const [completedLessons, setCompletedLessons] = useState([1]);
  const [emotionData, setEmotionData] = useState(null);

  const lessons = [
    { id: 1, title: 'Introduction to Algebra', duration: '15 min', completed: true },
    { id: 2, title: 'Linear Equations', duration: '20 min', completed: false },
    { id: 3, title: 'Quadratic Equations', duration: '25 min', completed: false },
    { id: 4, title: 'Polynomials', duration: '20 min', completed: false },
    { id: 5, title: 'Final Quiz', duration: '30 min', completed: false },
  ];

  const handleEmotionDetected = (emotion) => {
    setEmotionData(emotion);
    // You can add logic here to adapt the learning content based on emotion
  };

  const handleLessonComplete = () => {
    if (!completedLessons.includes(currentLesson + 1)) {
      setCompletedLessons([...completedLessons, currentLesson + 1]);
    }
    if (currentLesson < lessons.length) {
      setCurrentLesson(currentLesson + 1);
    }
  };

  const getLearningTip = () => {
    if (!emotionData) return 'Your emotions will help personalize your learning experience.';
    
    switch(emotionData.emotion) {
      case 'happiness':
        return 'Great! Your positive mood is perfect for learning new concepts.';
      case 'engagement':
        return 'You\'re focused! This is a great time to tackle challenging material.';
      case 'confusion':
        return 'It looks like you might be confused. Would you like to review the last section?';
      case 'boredom':
        return 'Let\'s try a different approach to make this more engaging.';
      case 'frustration':
        return 'Take a short break and come back refreshed.';
      default:
        return 'Keep going! Your progress is being tracked.';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Left Column - Video Feed */}
        <Grid item xs={12} md={6}>
          <VideoContainer elevation={3}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                <VideocamIcon sx={{ mr: 1 }} />
                Live Emotion Detection
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
              <EmotionDetector onEmotionChange={handleEmotionDetected} />
              
              {emotionData && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Learning Tip
                  </Typography>
                  <Typography variant="body2">
                    {getLearningTip()}
                  </Typography>
                </Box>
              )}
            </Box>
          </VideoContainer>
        </Grid>

        {/* Right Column - Learning Content */}
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={3}>
            <Typography variant="h5" gutterBottom>
              {lessons[currentLesson - 1]?.title || 'Course Complete!'}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {currentLesson <= lessons.length ? (
                `This is the content for ${lessons[currentLesson - 1]?.title}. ` +
                'Here you would see the actual learning material, which could include text, ' +
                'videos, interactive elements, and more.'
              ) : (
                'Congratulations! You have completed all the lessons in this course.'
              )}
            </Typography>

            <Box sx={{ mt: 'auto', pt: 2 }}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button 
                  variant="outlined" 
                  disabled={currentLesson <= 1}
                  onClick={() => setCurrentLesson(prev => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                
                {currentLesson <= lessons.length ? (
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleLessonComplete}
                    endIcon={currentLesson < lessons.length ? <SchoolIcon /> : <EmojiEventsIcon />}
                  >
                    {currentLesson < lessons.length ? 'Complete Lesson' : 'Complete Course'}
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    color="success"
                    startIcon={<EmojiEventsIcon />}
                  >
                    Course Completed!
                  </Button>
                )}
              </Box>
            </Box>
          </StyledPaper>

          {/* Lesson Progress */}
          <StyledPaper elevation={3} sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Course Progress
            </Typography>
            <List>
              {lessons.map((lesson) => (
                <ListItem 
                  key={lesson.id}
                  button 
                  selected={currentLesson === lesson.id}
                  onClick={() => setCurrentLesson(lesson.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected',
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    {completedLessons.includes(lesson.id) ? (
                      <CheckCircleIcon color="primary" />
                    ) : (
                      <SchoolIcon color={currentLesson === lesson.id ? 'primary' : 'action'} />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={lesson.title} 
                    secondary={lesson.duration} 
                    primaryTypographyProps={{
                      color: currentLesson === lesson.id ? 'primary' : 'textPrimary',
                      fontWeight: currentLesson === lesson.id ? 'bold' : 'normal',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </StyledPaper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LearningPage;
