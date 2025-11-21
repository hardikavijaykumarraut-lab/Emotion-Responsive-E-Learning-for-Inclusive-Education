import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  Button,
  Tabs,
  Tab,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  Quiz as QuizIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  Book as BookIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Face as FaceIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import progressService from '../../services/progressService';
import emotionService from '../../services/emotionService';
import studentRealtimeService from '../../services/studentRealtimeService';

const StudentDashboard = ({ user }) => {
  const navigate = useNavigate();
  const { announceToScreenReader } = useAccessibility();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [emotionData, setEmotionData] = useState([]);
  const [emotionDistribution, setEmotionDistribution] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [detailedSubjectProgress, setDetailedSubjectProgress] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    announceToScreenReader('Student dashboard loaded');
  }, [announceToScreenReader]);

  // Fetch student data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch progress data
        const progressResponse = await progressService.getProgress(user._id);
        if (progressResponse.success) {
          setProgressData(progressResponse.data);
          // Extract recent activity
          if (progressResponse.data.recentActivity) {
            setRecentActivity(progressResponse.data.recentActivity.slice(0, 4));
          }
          // Extract detailed subject progress
          if (progressResponse.data.detailedSubjectProgress) {
            setDetailedSubjectProgress(progressResponse.data.detailedSubjectProgress);
          }
        }
        
        // Fetch emotion history
        const emotionResponse = await emotionService.getEmotionHistory(user._id, 7, 50);
        if (emotionResponse.success) {
          setEmotionData(emotionResponse.data);
          
          // Calculate emotion distribution
          const distribution = calculateEmotionDistribution(emotionResponse.data);
          setEmotionDistribution(distribution);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();
    
    // Set up polling to refresh data every 10 seconds
    const pollInterval = setInterval(() => {
      fetchData();
    }, 10000);
    
    // Set up real-time updates via WebSocket
    if (user?._id && user?.token) {
      studentRealtimeService.connect(user.token);
      
      const unsubscribe = studentRealtimeService.addListener((data) => {
        console.log('Received real-time update:', data);
        
        switch (data.type) {
          case 'INITIAL_STUDENT_DATA':
            if (data.data.progress) {
              setProgressData(data.data.progress);
              if (data.data.progress.recentActivity) {
                setRecentActivity(data.data.progress.recentActivity.slice(0, 4));
              }
              if (data.data.progress.detailedSubjectProgress) {
                setDetailedSubjectProgress(data.data.progress.detailedSubjectProgress);
              }
            }
            if (data.data.emotions) {
              setEmotionData(data.data.emotions);
              const distribution = calculateEmotionDistribution(data.data.emotions);
              setEmotionDistribution(distribution);
            }
            break;
            
          case 'PROGRESS_UPDATE':
            if (data.data.progress) {
              setProgressData(data.data.progress);
              if (data.data.progress.recentActivity) {
                setRecentActivity(data.data.progress.recentActivity.slice(0, 4));
              }
              if (data.data.progress.detailedSubjectProgress) {
                setDetailedSubjectProgress(data.data.progress.detailedSubjectProgress);
              }
            }
            if (data.data.emotions) {
              setEmotionData(data.data.emotions);
              const distribution = calculateEmotionDistribution(data.data.emotions);
              setEmotionDistribution(distribution);
            }
            break;
            
          case 'NEW_EMOTION':
            if (data.data) {
              setEmotionData(prev => [data.data, ...prev.slice(0, 49)]);
              const distribution = calculateEmotionDistribution([data.data, ...emotionData]);
              setEmotionDistribution(distribution);
            }
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      });
      
      return () => {
        clearInterval(pollInterval);
        unsubscribe();
        studentRealtimeService.disconnect();
      };
    } else {
      console.log('Cannot connect to WebSocket: missing user ID or token', { userId: user?._id, token: user?.token });
      return () => clearInterval(pollInterval);
    }
  }, [user]);

  // Calculate emotion distribution from emotion history
  const calculateEmotionDistribution = (emotions) => {
    const emotionCounts = {};
    const emotionColors = {
      'happy': '#4caf50',
      'engagement': '#2196f3',
      'confusion': '#ff9800',
      'boredom': '#9e9e9e',
      'frustration': '#f44336',
      'sad': '#607d8b',
      'angry': '#e91e63',
      'fear': '#9c27b0',
      'surprise': '#ffeb3b',
      'disgust': '#795548',
      'neutral': '#00bcd4'
    };
    
    emotions.forEach(emotion => {
      const emotionName = emotion.emotion;
      emotionCounts[emotionName] = (emotionCounts[emotionName] || 0) + 1;
    });
    
    return Object.entries(emotionCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: emotionColors[name] || '#9e9e9e'
    }));
  };

  // Format emotion data for line chart
  const formatEmotionDataForChart = (emotions) => {
    // Group emotions by date
    const groupedByDate = {};
    emotions.forEach(emotion => {
      const date = new Date(emotion.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(emotion);
    });
    
    // Calculate average confidence per emotion per day
    const chartData = Object.entries(groupedByDate).map(([date, emotionsForDate]) => {
      const emotionSums = {};
      const emotionCounts = {};
      
      emotionsForDate.forEach(emotion => {
        const emotionName = emotion.emotion;
        emotionSums[emotionName] = (emotionSums[emotionName] || 0) + emotion.confidence;
        emotionCounts[emotionName] = (emotionCounts[emotionName] || 0) + 1;
      });
      
      const result = { name: date };
      Object.keys(emotionSums).forEach(emotion => {
        result[emotion] = Math.round((emotionSums[emotion] / emotionCounts[emotion]) * 100);
      });
      
      return result;
    });
    
    return chartData;
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'success';
    if (progress >= 60) return 'primary';
    if (progress >= 40) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  // Format data for charts
  const chartData = formatEmotionDataForChart(emotionData);
  const overallProgress = progressData?.overallProgress || 0;
  const subjectProgress = progressData?.subjectProgress || {};

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.name || 'Student'}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Here's your learning progress and recent activities
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SchoolIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Overall Progress
                </Typography>
              </Box>
              <Typography variant="h4">{Math.round(overallProgress)}%</Typography>
              <LinearProgress 
                variant="determinate" 
                value={overallProgress} 
                color={getProgressColor(overallProgress)}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <FaceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Emotions Tracked
                </Typography>
              </Box>
              <Typography variant="h4">{emotionData.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                In last 7 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrophyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Achievements
                </Typography>
              </Box>
              <Typography variant="h4">
                {progressData?.achievements?.filter(a => a.earned).length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Earned
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TimelineIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Study Streak
                </Typography>
              </Box>
              <Typography variant="h4">{progressData?.currentStreak || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Days in a row
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emotion Trends
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    {Object.keys(chartData[0] || {}).filter(key => key !== 'name').map((emotion, index) => (
                      <Line 
                        key={emotion} 
                        type="monotone" 
                        dataKey={emotion} 
                        stroke={`hsl(${index * 60}, 70%, 50%)`} 
                        name={emotion.charAt(0).toUpperCase() + emotion.slice(1)} 
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <ListItem key={activity.timestamp} divider>
                      <ListItemText
                        primary={activity.action}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {activity.subject}
                            </Typography>
                            {" — "}
                            {activity.score ? `${activity.score}%` : 'Completed'}
                            {" • "}
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No recent activity" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detailed Subject Progress
              </Typography>
              <List>
                {detailedSubjectProgress.length > 0 ? (
                  detailedSubjectProgress.slice(0, 6).map((progress, index) => (
                    <ListItem key={`${progress._id || index}`} divider={index < Math.min(5, detailedSubjectProgress.length - 1)}>
                      <ListItemText
                        primary={`${progress.subject} - ${progress.module}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              Module Progress: {Math.round(progress.moduleProgress || 0)}%
                            </Typography>
                            {progress.timeSpent && (
                              <>
                                {" • "}
                                <Typography component="span" variant="body2" color="text.secondary">
                                  Time Spent: {Math.round(progress.timeSpent)} mins
                                </Typography>
                              </>
                            )}
                            <br />
                            <Typography component="span" variant="caption" color="text.secondary">
                              {new Date(progress.createdAt).toLocaleDateString()} {new Date(progress.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </>
                        }
                      />
                      <Chip
                        label={`${Math.round(progress.moduleProgress || 0)}%`}
                        color={progress.moduleProgress >= 80 ? 'success' : progress.moduleProgress >= 50 ? 'warning' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No detailed progress yet" secondary="Complete modules to see progress details" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Subject Progress
              </Typography>
              {Object.entries(subjectProgress).map(([subject, data]) => (
                <Box key={subject} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2">
                      {subject.charAt(0).toUpperCase() + subject.slice(1)}
                    </Typography>
                    <Typography variant="body2">
                      {Math.round(data.progress || 0)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={data.progress || 0} 
                    color={getProgressColor(data.progress || 0)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emotion Distribution
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emotionDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                    >
                      {emotionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2 }}>
                {emotionDistribution.map((emotion, index) => (
                  <Box key={emotion.name} display="flex" alignItems="center" mb={1}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        backgroundColor: emotion.color, 
                        borderRadius: '50%', 
                        mr: 1 
                      }} 
                    />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {emotion.name}
                    </Typography>
                    <Typography variant="body2">
                      {emotion.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};


const DashboardPage = () => {
  const { user } = useAuth();
  const { announceToScreenReader } = useAccessibility();

  useEffect(() => {
    announceToScreenReader('Dashboard page loaded');
  }, [announceToScreenReader]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect admin users to admin page
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Show student dashboard
  return <StudentDashboard user={user} />;
};

export default DashboardPage;