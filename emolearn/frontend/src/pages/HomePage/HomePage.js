import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Paper
} from '@mui/material';
import {
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  Accessibility as AccessibilityIcon,
  Dashboard as DashboardIcon,
  Quiz as QuizIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const subjects = [
  { id: 'mathematics', name: 'Mathematics', icon: '📊', color: '#2196f3' },
  { id: 'science', name: 'Science', icon: '🔬', color: '#4caf50' },
  { id: 'history', name: 'History', icon: '🏛️', color: '#ff9800' },
  { id: 'geography', name: 'Geography', icon: '🌍', color: '#00bcd4' },
  { id: 'english', name: 'English Literature', icon: '📚', color: '#9c27b0' },
  { id: 'computer-science', name: 'Computer Science', icon: '💻', color: '#607d8b' },
  { id: 'environmental', name: 'Environmental Studies', icon: '🌱', color: '#8bc34a' },
  { id: 'art', name: 'Art & Design', icon: '🎨', color: '#e91e63' },
  { id: 'physical-ed', name: 'Physical Education', icon: '⚽', color: '#ff5722' },
  { id: 'social-studies', name: 'Social Studies', icon: '👥', color: '#795548' }
];

const features = [
  {
    icon: <PsychologyIcon sx={{ fontSize: 40 }} />,
    title: 'Emotion Detection',
    description: 'Real-time webcam-based emotion recognition adapts content to your learning state'
  },
  {
    icon: <AccessibilityIcon sx={{ fontSize: 40 }} />,
    title: 'Inclusive Design',
    description: 'WCAG-compliant interface with screen reader support and customizable accessibility options'
  },
  {
    icon: <QuizIcon sx={{ fontSize: 40 }} />,
    title: 'Interactive Learning',
    description: 'Engaging quizzes and activities triggered by your emotional state'
  },
  {
    icon: <LightbulbIcon sx={{ fontSize: 40 }} />,
    title: 'Fun Facts',
    description: 'Interesting facts appear when confusion is detected to clarify concepts'
  }
];

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubjectClick = (subjectId) => {
    navigate(`/learn/${subjectId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom
          sx={{ fontWeight: 700, color: 'primary.main' }}
        >
          Welcome to EmoLearn
        </Typography>
        <Typography 
          variant="h5" 
          component="h2" 
          color="text.secondary" 
          paragraph
          sx={{ maxWidth: 800, mx: 'auto' }}
        >
          An emotion-adaptive learning platform that personalizes education based on your feelings and engagement level
        </Typography>
        {user && (
          <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
            Hello, {user.name}! Ready to learn today?
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<SchoolIcon />}
            onClick={() => navigate('/learn/mathematics')}
            sx={{ px: 4, py: 1.5 }}
          >
            Start Learning
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ px: 4, py: 1.5 }}
          >
            View Progress
          </Button>
        </Box>
      </Box>

      {/* Features Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
          How EmoLearn Works
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Subjects Section */}
      <Box>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
          Choose Your Subject
        </Typography>
        <Typography variant="body1" textAlign="center" color="text.secondary" paragraph>
          Select from 10 comprehensive subjects, each with adaptive content that responds to your emotions
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {subjects.map((subject) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={subject.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleSubjectClick(subject.id)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSubjectClick(subject.id);
                  }
                }}
                aria-label={`Learn ${subject.name}`}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography 
                    variant="h3" 
                    component="div" 
                    sx={{ mb: 2, fontSize: '3rem' }}
                    role="img"
                    aria-label={subject.name}
                  >
                    {subject.icon}
                  </Typography>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {subject.name}
                  </Typography>
                  <Chip 
                    label="Adaptive Content" 
                    size="small" 
                    sx={{ 
                      backgroundColor: subject.color,
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button size="small" sx={{ color: subject.color }}>
                    Start Learning
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Accessibility Notice */}
      <Paper 
        sx={{ 
          mt: 6, 
          p: 3, 
          backgroundColor: 'primary.main', 
          color: 'primary.contrastText',
          textAlign: 'center'
        }}
      >
        <AccessibilityIcon sx={{ fontSize: 40, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Designed for Everyone
        </Typography>
        <Typography variant="body1">
          EmoLearn is built with accessibility in mind, featuring screen reader support, 
          keyboard navigation, adjustable font sizes, and high contrast modes.
        </Typography>
      </Paper>
    </Container>
  );
};

export default HomePage;
