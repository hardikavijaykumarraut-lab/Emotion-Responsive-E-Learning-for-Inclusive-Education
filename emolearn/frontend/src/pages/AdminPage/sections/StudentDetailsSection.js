import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  EmojiEmotions as EmotionIcon,
  TrendingUp as ProgressIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { getStudentDetails } from '../../../services/adminAnalyticsService';
import { formatDistanceToNow, format } from 'date-fns';
import DetailedProgressSection from './DetailedProgressSection';

const emotionColors = {
  happy: '#4caf50',
  engagement: '#2196f3',
  confusion: '#ff9800',
  boredom: '#9e9e9e',
  frustration: '#f44336',
  neutral: '#607d8b',
  surprise: '#ffeb3b',
  disgust: '#795548',
  fear: '#9c27b0'
};

const emotionLabels = {
  happy: 'Happy',
  engagement: 'Engaged',
  confusion: 'Confused',
  boredom: 'Bored',
  frustration: 'Frustrated',
  neutral: 'Neutral',
  surprise: 'Surprised',
  disgust: 'Disgusted',
  fear: 'Fearful'
};

const StudentDetailsSection = ({ studentId, onBack }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentDetails(studentId);
      setStudent(data.student);
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError('Failed to load student details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
    }
  }, [studentId]);

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
        <Button onClick={fetchStudentDetails} startIcon={<RefreshIcon />} variant="outlined" sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!student) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No student data found.</Typography>
      </Box>
    );
  }

  // Calculate emotion distribution
  const emotionDistribution = student.emotionDistribution || {};
  const totalEmotions = Object.values(emotionDistribution).reduce((sum, count) => sum + count, 0);
  
  // Get recent emotions
  const recentEmotions = student.emotions?.slice(0, 5) || [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Student Details
        </Typography>
        <IconButton onClick={fetchStudentDetails} sx={{ ml: 'auto' }}>
          <RefreshIcon />
        </IconButton>
      </Box>
      
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Overview" />
        <Tab label="Detailed Progress" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Student Info Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      margin: '0 auto 16px',
                      bgcolor: 'primary.main'
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h6">{student.name}</Typography>
                  <Typography variant="body2" color="textSecondary">{student.email}</Typography>
                  <Chip 
                    label="Student" 
                    size="small" 
                    color="primary" 
                    sx={{ mt: 1 }}
                  />
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    Last Active
                  </Typography>
                  <Typography variant="body1">
                    {student.lastActive ? formatTimeAgo(student.lastActive) : 'Never'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Overall Progress Card */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ProgressIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Overall Progress</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h3" sx={{ mr: 2 }}>
                    {Math.round(student.progress || 0)}%
                  </Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={student.progress || 0} 
                      sx={{ height: 12, borderRadius: 6 }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Weekly Progress
                    </Typography>
                    <Typography variant="h6">
                      {student.weeklyProgress || 0} pts
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body1">
                      {student.lastActive ? formatDate(student.lastActive) : 'Never'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Subject Progress */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Subject Progress</Typography>
              </Box>
              
              <Grid container spacing={2}>
                {Object.entries(student.subjectProgress || {}).map(([subject, progressData]) => (
                  <Grid item xs={12} sm={6} md={4} key={subject}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          {subject.charAt(0).toUpperCase() + subject.slice(1)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {Math.round(progressData.progress || 0)}%
                          </Typography>
                          <Box sx={{ flexGrow: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={progressData.progress || 0} 
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          {progressData.modulesCompleted || 0}/{progressData.totalModules || 3} modules
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Emotion Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmotionIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Emotion Distribution</Typography>
              </Box>
              
              {totalEmotions > 0 ? (
                <Box>
                  {Object.entries(emotionDistribution)
                    .sort(([,a], [,b]) => b - a) // Sort by count descending
                    .map(([emotion, count]) => {
                      const percentage = Math.round((count / totalEmotions) * 100);
                      return (
                        <Box key={emotion} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">
                              {emotionLabels[emotion] || emotion}
                            </Typography>
                            <Typography variant="body2">
                              {percentage}% ({count})
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={percentage}
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              bgcolor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: emotionColors[emotion] || 'primary.main'
                              }
                            }}
                          />
                        </Box>
                      );
                    })}
                </Box>
              ) : (
                <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                  No emotion data available
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Recent Emotions */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimeIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Recent Emotions</Typography>
              </Box>
              
              {recentEmotions.length > 0 ? (
                <List>
                  {recentEmotions.map((emotion, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar 
                            sx={{ 
                              bgcolor: emotionColors[emotion.emotion] || 'primary.main',
                              width: 40,
                              height: 40
                            }}
                          >
                            <EmotionIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={emotionLabels[emotion.emotion] || emotion.emotion}
                          secondary={
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {Math.round(emotion.confidence * 100)}% confidence
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
                <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                  No recent emotion detections
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {activeTab === 1 && (
        <Grid item xs={12}>
          <Paper>
            <DetailedProgressSection studentId={studentId} />
          </Paper>
        </Grid>
      )}
    </Box>
  );
};

export default StudentDetailsSection;