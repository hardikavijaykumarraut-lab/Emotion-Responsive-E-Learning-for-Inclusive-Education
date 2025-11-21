import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  EmojiEmotions as EmojiIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  Mood as MoodIcon,
  SentimentVerySatisfied as HappyIcon,
  SentimentSatisfied as NeutralIcon,
  SentimentDissatisfied as SadIcon,
  SentimentVeryDissatisfied as AngryIcon
} from '@mui/icons-material';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { formatDistanceToNow } from 'date-fns';
import { getDashboardStats, subscribeToRealtimeUpdates } from '../../../services/adminAnalyticsService';

const emotionIcons = {
  happy: <HappyIcon color="success" />,
  neutral: <NeutralIcon color="info" />,
  sad: <SadIcon color="warning" />,
  angry: <AngryIcon color="error" />,
  fear: <MoodIcon />,
  surprise: <MoodIcon />,
  disgust: <MoodIcon />
};

const emotionColors = {
  happy: '#4caf50',
  neutral: '#2196f3',
  sad: '#ff9800',
  angry: '#f44336',
  fear: '#9c27b0',
  surprise: '#ffeb3b',
  disgust: '#795548'
};

const DashboardSection = () => {
  const [data, setData] = useState({
    students: [],
    stats: {
      totalStudents: 0,
      activeStudents: 0,
      avgProgress: 0,
      emotionDistribution: []
    },
    recentEmotions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const updateStudent = useCallback((updatedStudent) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(student => 
        student._id === updatedStudent._id ? { ...student, ...updatedStudent } : student
      ),
      // Update recent activity if provided
      recentEmotions: updatedStudent.recentActivity 
        ? [...updatedStudent.recentActivity.map(activity => ({
            ...activity,
            student: { name: updatedStudent.name, email: updatedStudent.email },
            emotion: 'activity', // Placeholder emotion for activity
            confidence: 1.0,
            timestamp: activity.timestamp
          })), ...prev.recentEmotions].slice(0, 20)
        : prev.recentEmotions
    }));
  }, []);

  const addEmotion = useCallback((emotionData) => {
    setData(prev => ({
      ...prev,
      recentEmotions: [emotionData, ...prev.recentEmotions].slice(0, 10)
    }));
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const dashboardData = await getDashboardStats();
      setData({
        students: dashboardData.students || [],
        stats: {
          totalStudents: dashboardData.stats?.totalStudents || 0,
          activeStudents: dashboardData.stats?.activeStudents || 0,
          avgProgress: dashboardData.stats?.avgProgress || 0,
          emotionDistribution: dashboardData.stats?.emotionDistribution || []
        },
        recentEmotions: dashboardData.recentEmotions || []
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates
    const unsubscribe = subscribeToRealtimeUpdates((data) => {
      if (data.type === 'INITIAL_DATA') {
        setData({
          students: data.data.students || [],
          stats: {
            totalStudents: data.data.stats?.totalStudents || 0,
            activeStudents: data.data.stats?.activeStudents || 0,
            avgProgress: data.data.stats?.avgProgress || 0,
            emotionDistribution: data.data.stats?.emotionDistribution || []
          },
          recentEmotions: data.data.recentEmotions || []
        });
        setLastUpdated(new Date());
      } else if (data.type === 'STUDENT_UPDATED') {
        updateStudent(data.data);
        // Update the student in the students array and handle recent activity
        setData(prev => {
          const updatedStudents = prev.students.map(student => 
            student._id === data.data._id ? { ...student, ...data.data } : student
          );
          
          // If the student has recent activity, add it to recentEmotions
          let updatedRecentEmotions = prev.recentEmotions;
          if (data.data.recentActivity && data.data.recentActivity.length > 0) {
            // Create activity entries for the recent activity
            const activityEntries = data.data.recentActivity.map(activity => ({
              _id: `${data.data._id}-${activity.timestamp}`,
              student: { name: data.data.name, email: data.data.email },
              emotion: 'activity',
              confidence: 1.0,
              timestamp: activity.timestamp,
              action: activity.action,
              subject: activity.subject
            }));
            
            // Combine with existing recent emotions and sort by timestamp
            updatedRecentEmotions = [...activityEntries, ...prev.recentEmotions]
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, 20);
          }
          
          return {
            ...prev,
            students: updatedStudents,
            recentEmotions: updatedRecentEmotions
          };
        });
      } else if (data.type === 'NEW_EMOTION') {
        addEmotion(data.data);
      } else if (data.type === 'PROGRESS_UPDATE') {
        // Handle progress updates specifically
        if (data.data && data.data.progress) {
          updateStudent({
            _id: data.data.progress.userId,
            progress: data.data.progress.overallProgress,
            subjectProgress: data.data.progress.subjectProgress
          });
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchDashboardData, updateStudent, addEmotion]);

  const getEmotionIcon = (emotion) => {
    // Handle activity entries
    if (emotion === 'activity') {
      return <TimeIcon />;
    }
    return emotionIcons[emotion] || <MoodIcon />;
  };

  const getEmotionColor = (emotion) => {
    // Handle activity entries
    if (emotion === 'activity') {
      return '#2196f3'; // Blue color for activity
    }
    return emotionColors[emotion] || '#9e9e9e';
  };

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  const { stats, recentEmotions } = data;
  
  // Prepare chart data
  const progressChartData = {
    labels: data.students.map(s => s.name || 'Student'),
    datasets: [
      {
        label: 'Progress',
        data: data.students.map(s => s.progress || 0),
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.dark,
        borderWidth: 1,
      },
    ],
  };

  const emotionChartData = {
    labels: stats.emotionDistribution.map(e => e.emotion),
    datasets: [
      {
        data: stats.emotionDistribution.map(e => e.count),
        backgroundColor: stats.emotionDistribution.map(e => getEmotionColor(e.emotion)),
        borderColor: theme.palette.background.paper,
        borderWidth: 2,
      },
    ],
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Box textAlign="center">
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" color="textSecondary" mt={2}>
              Loading dashboard data...
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom={false}>
            Admin Dashboard
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton 
            onClick={refreshData} 
            color="primary"
            disabled={loading}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {/* Total Students Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PersonIcon color="primary" fontSize="large" sx={{ mr: 1 }} />
                <Typography variant="h6" color="textSecondary">
                  Total Students
                </Typography>
              </Box>
              <Typography variant="h4">{stats.totalStudents || 0}</Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2" color="textSecondary">
                  {stats.activeStudents || 0} active
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Average Progress Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon color="primary" fontSize="large" sx={{ mr: 1 }} />
                <Typography variant="h6" color="textSecondary">
                  Avg. Progress
                </Typography>
              </Box>
              <Typography variant="h4">{stats.avgProgress?.toFixed(1) || 0}%</Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.avgProgress || 0} 
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Top Emotion Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <EmojiIcon color="primary" fontSize="large" sx={{ mr: 1 }} />
                <Typography variant="h6" color="textSecondary">
                  Top Emotion
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4">
                    {stats.emotionDistribution[0]?.emotion || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stats.emotionDistribution[0]?.count || 0} detections
                  </Typography>
                </Box>
                <Box>
                  {stats.emotionDistribution[0] ? (
                    getEmotionIcon(stats.emotionDistribution[0].emotion)
                  ) : (
                    <MoodIcon fontSize="large" color="disabled" />
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TimeIcon color="primary" fontSize="large" sx={{ mr: 1 }} />
                <Typography variant="h6" color="textSecondary">
                  Recent Activity
                </Typography>
              </Box>
              {recentEmotions.length > 0 ? (
                <>
                  <Typography variant="h6" noWrap>
                    {recentEmotions[0].student?.name || 'Student'}
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ 
                      bgcolor: getEmotionColor(recentEmotions[0].emotion),
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1
                    }}>
                      {getEmotionIcon(recentEmotions[0].emotion)}
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {recentEmotions[0].emotion === 'activity' 
                        ? `${recentEmotions[0].action} in ${recentEmotions[0].subject}` 
                        : recentEmotions[0].emotion}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {formatTimeAgo(recentEmotions[0].timestamp)}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No recent activity
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={4}>
        {/* Student Progress Chart */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Student Progress
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar
                data={progressChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Progress %'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Students'
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.parsed.y}% progress`
                      }
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Emotion Distribution Chart */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Emotion Distribution
            </Typography>
            <Box sx={{ height: 300, position: 'relative' }}>
              <Pie
                data={emotionChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.label || '';
                          const value = context.raw || 0;
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = Math.round((value / total) * 100);
                          return `${label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Emotions */}
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Emotion Detections
        </Typography>
        {recentEmotions.length > 0 ? (
          <List>
            {recentEmotions.map((emotion, index) => (
              <React.Fragment key={emotion._id || index}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getEmotionColor(emotion.emotion) }}>
                      {getEmotionIcon(emotion.emotion)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={emotion.student?.name || 'Unknown Student'}
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {emotion.emotion === 'activity' 
                            ? `${emotion.action} in ${emotion.subject}` 
                            : `${emotion.emotion} • ${Math.round(emotion.confidence * 100)}% confidence`}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {formatTimeAgo(emotion.timestamp)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < recentEmotions.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body1" color="textSecondary" align="center" py={2}>
            No emotion detections yet
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default DashboardSection;