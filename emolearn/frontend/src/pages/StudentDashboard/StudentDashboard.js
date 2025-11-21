import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  School as SchoolIcon, 
  EmojiEmotions as EmojiIcon,
  BarChart as ProgressIcon,
  Book as SubjectIcon,
  CheckCircle as CompletedIcon,
  EmojiEvents as AchievementsIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentProgress } from '../../services/progressService';
import realtimeService from '../../services/realtimeService';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [progress, setProgress] = useState({});
  const [emotionLogs, setEmotionLogs] = useState([]);
  const [detailedSubjectProgress, setDetailedSubjectProgress] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]); // Add recent activity state
  
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      if (user && user._id) {
        const progressData = await getStudentProgress(user._id);
        
        // Process subjects data - use the actual subject names from subjectProgress
        const subjectList = Object.entries(progressData.subjectProgress || {}).map(([key, value]) => ({
          id: key,
          name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(), // Format camelCase to spaced words
          progress: value.progress || 0,
          modulesCompleted: value.modulesCompleted || 0,
          totalModules: value.totalModules || 3,
          timeSpent: value.timeSpent || 0,
          lastAccessed: value.lastAccessed
        }));
        
        setSubjects(subjectList);
        setProgress({
          overallProgress: progressData.overallProgress || 0,
          totalPoints: progressData.totalPoints || 0,
          currentStreak: progressData.currentStreak || 0,
          longestStreak: progressData.longestStreak || 0,
          lastActive: progressData.lastActive,
          achievements: progressData.achievements || [], // Make sure achievements are included
          recentActivity: progressData.recentActivity || [] // Add recent activity to progress state
        });
        
        // Process emotion logs
        setEmotionLogs(progressData.emotionHistory || []);
        
        // Set detailed subject progress
        setDetailedSubjectProgress(progressData.detailedSubjectProgress || []);
        
        // Set recent activity
        setRecentActivity(progressData.recentActivity || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    
    // Set up real-time updates
    if (user && user._id && token) {
      console.log('Setting up WebSocket connection for student:', user._id);
      realtimeService.connectAsStudent(token, user._id, () => {
        console.log('Connected to student WebSocket');
      }, (error) => {
        console.error('WebSocket connection error:', error);
      });
      
      // Listen for progress updates
      const unsubscribeProgress = realtimeService.onProgressUpdate((data) => {
        console.log('Received PROGRESS_UPDATE message:', data);
        if (data && data.data && data.data.progress) {
          // Update subjects data
          const subjectList = Object.entries(data.data.progress.subjectProgress || {}).map(([key, value]) => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
            progress: value.progress || 0,
            modulesCompleted: value.modulesCompleted || 0,
            totalModules: value.totalModules || 3,
            timeSpent: value.timeSpent || 0,
            lastAccessed: value.lastAccessed
          }));
          
          setSubjects(subjectList);
          setProgress(prev => ({
            ...prev,
            overallProgress: data.data.progress.overallProgress || 0,
            totalPoints: data.data.progress.totalPoints || 0,
            currentStreak: data.data.progress.currentStreak || 0,
            longestStreak: data.data.progress.longestStreak || 0,
            lastActive: data.data.progress.lastActive,
            achievements: data.data.progress.achievements || [],
            recentActivity: data.data.recentActivity || prev.recentActivity || [] // Update recent activity
          }));
          
          // Update emotion logs if provided
          if (data.data.emotions) {
            setEmotionLogs(data.data.emotions); // Show all emotions, not limited
          }
          
          // Update detailed subject progress if provided
          if (data.data.detailedProgress) {
            setDetailedSubjectProgress(data.data.detailedProgress);
          }
          
          // Update recent activity if provided
          if (data.data.recentActivity) {
            setRecentActivity(data.data.recentActivity);
          }
        }
      });
      
      // Listen for initial student data
      const unsubscribeInitialData = realtimeService.onInitialStudentData((data) => {
        console.log('Received INITIAL_STUDENT_DATA message:', data);
        if (data && data.data && data.data.progress) {
          // Update subjects data
          const subjectList = Object.entries(data.data.progress.subjectProgress || {}).map(([key, value]) => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
            progress: value.progress || 0,
            modulesCompleted: value.modulesCompleted || 0,
            totalModules: value.totalModules || 3,
            timeSpent: value.timeSpent || 0,
            lastAccessed: value.lastAccessed
          }));
          
          setSubjects(subjectList);
          setProgress({
            overallProgress: data.data.progress.overallProgress || 0,
            totalPoints: data.data.progress.totalPoints || 0,
            currentStreak: data.data.progress.currentStreak || 0,
            longestStreak: data.data.progress.longestStreak || 0,
            lastActive: data.data.progress.lastActive,
            achievements: data.data.progress.achievements || [],
            recentActivity: data.data.recentActivity || [] // Add recent activity to progress state
          });
          
          // Update emotion logs if provided
          if (data.data.emotions) {
            setEmotionLogs(data.data.emotions); // Show all emotions, not limited
          }
          
          // Update detailed subject progress if provided
          if (data.data.detailedProgress) {
            setDetailedSubjectProgress(data.data.detailedProgress || []);
          }
          
          // Update recent activity if provided
          if (data.data.recentActivity) {
            setRecentActivity(data.data.recentActivity);
          }
        }
      });
      
      // Cleanup function
      return () => {
        console.log('Cleaning up WebSocket connections');
        unsubscribeProgress();
        unsubscribeInitialData();
        realtimeService.disconnectStudent();
      };
    }
  }, [user, token, fetchData]);

  const handleSubjectClick = (subjectId) => {
    navigate(`/learn/${subjectId}`);
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: 'success',
      neutral: 'default',
      surprise: 'info',
      sad: 'warning',
      angry: 'error',
      fear: 'warning',
      disgust: 'error'
    };
    return colors[emotion] || 'default';
  };

  const getEmotionIcon = (emotion) => {
    const icons = {
      happy: '😊',
      neutral: '😐',
      surprise: '😲',
      sad: '😢',
      angry: '😠',
      fear: '😨',
      disgust: '🤢'
    };
    return icons[emotion] || '😐';
  };

  const renderSubjects = () => (
    <Grid container spacing={3}>
      {subjects.length > 0 ? (
        subjects.map((subject) => (
          <Grid item xs={12} sm={6} md={4} key={subject.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <CardActionArea 
                onClick={() => handleSubjectClick(subject.id)}
                sx={{ flexGrow: 1, p: 2 }}
              >
                <Box display="flex" alignItems="center" mb={2}>
                  <SubjectIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h6" component="div">
                      {subject.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {subject.modulesCompleted}/{subject.totalModules} modules completed
                    </Typography>
                  </Box>
                </Box>
                <Box width="100%" mb={1}>
                  <LinearProgress 
                    variant="determinate" 
                    value={subject.progress} 
                    color={subject.progress > 70 ? 'success' : subject.progress > 30 ? 'primary' : 'warning'}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  {subject.progress}% Complete
                </Typography>
                {subject.lastAccessed && (
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    Last accessed: {new Date(subject.lastAccessed).toLocaleDateString()}
                  </Typography>
                )}
              </CardActionArea>
            </Card>
          </Grid>
        ))
      ) : (
        <Grid item xs={12}>
          <Typography variant="body1" color="text.secondary" align="center" py={4}>
            No subjects available. Start learning to see your progress here.
          </Typography>
        </Grid>
      )}
    </Grid>
  );

  const renderProgress = () => (
    <Box>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {progress.overallProgress || 0}%
            </Typography>
            <Typography variant="subtitle1">Overall Progress</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {progress.totalPoints || 0}
            </Typography>
            <Typography variant="subtitle1">Total Points</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {progress.currentStreak || 0}
            </Typography>
            <Typography variant="subtitle1">Current Streak</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {progress.longestStreak || 0}
            </Typography>
            <Typography variant="subtitle1">Longest Streak</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Typography variant="h6" gutterBottom>
        Detailed Subject Progress
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        {detailedSubjectProgress.length > 0 ? (
          <List>
            {detailedSubjectProgress.map((item, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={`${item.subject} - ${item.module}`}
                    secondary={`Progress: ${item.moduleProgress}% | Time Spent: ${item.timeSpent} minutes`}
                  />
                  <Chip 
                    icon={<CompletedIcon />} 
                    label="Completed" 
                    color="success" 
                    variant="outlined" 
                  />
                </ListItem>
                {index < detailedSubjectProgress.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No detailed progress data available yet. Your progress will appear here as you complete modules.
          </Typography>
        )}
      </Paper>
      
      <Typography variant="h6" gutterBottom>
        Recent Activity
      </Typography>
      <Paper sx={{ p: 2 }}>
        {recentActivity.length > 0 ? (
          <List>
            {recentActivity.map((activity, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <HistoryIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${activity.action} in ${activity.subject}`}
                    secondary={new Date(activity.timestamp).toLocaleString()}
                  />
                  {activity.score !== undefined && activity.score !== null && (
                    <Chip 
                      label={`Score: ${activity.score}%`} 
                      color={activity.score >= 70 ? 'success' : activity.score >= 50 ? 'warning' : 'error'} 
                      size="small"
                    />
                  )}
                </ListItem>
                {index < recentActivity.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No recent activity yet. Your activity will appear here as you use the application.
          </Typography>
        )}
      </Paper>
    </Box>
  );

  const renderAchievements = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Achievements
      </Typography>
      <Grid container spacing={2}>
        {progress.achievements && progress.achievements.length > 0 ? (
          progress.achievements.map((achievement) => (
            <Grid item xs={12} sm={6} md={4} key={achievement.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: achievement.earned ? 2 : 1,
                  borderColor: achievement.earned ? 'success.main' : 'grey.300',
                  backgroundColor: achievement.earned ? 'success.light' : 'background.paper'
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography variant="h4" sx={{ mr: 2 }}>
                      {achievement.icon}
                    </Typography>
                    <Box>
                      <Typography variant="h6" component="div">
                        {achievement.title}
                      </Typography>
                      {achievement.earned && (
                        <Typography variant="caption" color="success.main">
                          Earned on {new Date(achievement.earnedDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {achievement.description}
                  </Typography>
                  <Chip 
                    label={achievement.earned ? 'Achieved' : 'Not yet earned'}
                    color={achievement.earned ? 'success' : 'default'}
                    size="small"
                    icon={achievement.earned ? <CompletedIcon /> : null}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary" align="center" py={4}>
              No achievements available yet. Complete quizzes and learning modules to earn achievements!
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const renderEmotionLogs = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Recent Emotion Logs
      </Typography>
      <Paper sx={{ p: 2 }}>
        <List>
          {emotionLogs.length > 0 ? (
            emotionLogs.map((log, index) => (
              <React.Fragment key={index}>
                <ListItem 
                  secondaryAction={
                    <Chip 
                      label={log.emotion} 
                      color={getEmotionColor(log.emotion)} 
                      size="small"
                    />
                  }
                >
                  <ListItemAvatar>
                    <Avatar>
                      {getEmotionIcon(log.emotion)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`Confidence: ${(log.confidence * 100).toFixed(1)}%`}
                    secondary={new Date(log.timestamp).toLocaleString()}
                  />
                </ListItem>
                {index < emotionLogs.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No emotion logs available. Your emotion tracking data will appear here as you use the emotion detection feature.
            </Typography>
          )}
        </List>
      </Paper>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.name || 'Student'}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Track your learning progress and continue where you left off.
        </Typography>
      </Box>
      
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<SubjectIcon />} label="My Subjects" />
          <Tab icon={<ProgressIcon />} label="Progress" />
          <Tab icon={<AchievementsIcon />} label="Achievements" />
          <Tab icon={<EmojiIcon />} label="Emotion Logs" />
        </Tabs>
        
        <Box p={3}>
          {activeTab === 0 && renderSubjects()}
          {activeTab === 1 && renderProgress()}
          {activeTab === 2 && renderAchievements()}
          {activeTab === 3 && renderEmotionLogs()}
        </Box>
      </Paper>
    </Container>
  );
};

export default StudentDashboard;