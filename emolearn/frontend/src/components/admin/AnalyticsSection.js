import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Avatar
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEmotions as EmojiIcon
} from '@mui/icons-material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

const AnalyticsSection = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [analytics, setAnalytics] = useState({
    stats: {},
    students: [],
    recentEmotions: []
  });
  const { api } = useAuth();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics/dashboard-stats');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: '#4caf50',
      neutral: '#9e9e9e',
      surprise: '#2196f3',
      sad: '#ff9800',
      angry: '#f44336',
      fear: '#673ab7',
      disgust: '#795548'
    };
    return colors[emotion] || '#9e9e9e';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const {
    stats,
    students,
    recentEmotions
  } = analytics;

  // Prepare data for charts
  const emotionDistributionData = stats.emotionDistribution ? 
    stats.emotionDistribution.map(item => ({
      name: item.emotion,
      value: item.count
    })) : [];

  // Prepare progress data for line chart (mock data for now)
  const progressData = [
    { date: 'Mon', completedLessons: 12, averageScore: 78 },
    { date: 'Tue', completedLessons: 19, averageScore: 82 },
    { date: 'Wed', completedLessons: 15, averageScore: 75 },
    { date: 'Thu', completedLessons: 22, averageScore: 85 },
    { date: 'Fri', completedLessons: 18, averageScore: 80 },
    { date: 'Sat', completedLessons: 25, averageScore: 88 },
    { date: 'Sun', completedLessons: 20, averageScore: 83 }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Analytics Dashboard</Typography>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            label="Time Range"
          >
            <MenuItem value="day">Last 24 Hours</MenuItem>
            <MenuItem value="week">Last 7 Days</MenuItem>
            <MenuItem value="month">Last 30 Days</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Students</Typography>
              </Box>
              <Typography variant="h4">{stats.totalStudents || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.activeStudents ? `${stats.activeStudents} currently active` : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SchoolIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Avg. Progress</Typography>
              </Box>
              <Typography variant="h4">{Math.round(stats.avgProgress || 0)}%</Typography>
              <Typography variant="body2" color="text.secondary">
                Overall student progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <EmojiIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Emotions Tracked</Typography>
              </Box>
              <Typography variant="h4">{emotionDistributionData.reduce((sum, item) => sum + item.value, 0) || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total emotion detections
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Students</Typography>
              </Box>
              <Typography variant="h4">{stats.activeStudents || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.totalStudents ? `${Math.round((stats.activeStudents / stats.totalStudents) * 100)}% of total` : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>User Progress</Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completedLessons" name="Completed Lessons" stroke="#8884d8" />
                  <Line type="monotone" dataKey="averageScore" name="Average Score" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Emotion Distribution</Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emotionDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {emotionDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Student Progress Overview</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Overall Progress</TableCell>
                    <TableCell>Recent Emotions</TableCell>
                    <TableCell>Subject Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students && students.length > 0 ? (
                    students.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2, width: 32, height: 32, fontSize: 14 }}>
                              {student.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2">{student.name}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {student.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Box width="100%">
                              <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography variant="caption">{student.progress || 0}%</Typography>
                              </Box>
                              <Box height={8} bgcolor="#e0e0e0" borderRadius={1}>
                                <Box 
                                  height="100%" 
                                  bgcolor={student.progress > 70 ? '#4caf50' : student.progress > 30 ? '#2196f3' : '#ff9800'}
                                  width={`${student.progress || 0}%`}
                                  borderRadius={1}
                                />
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {student.recentEmotions && student.recentEmotions.length > 0 ? (
                            <Box>
                              {student.recentEmotions.slice(0, 3).map((emotionLog, index) => (
                                <Chip
                                  key={index}
                                  label={`${emotionLog.emotion} (${(emotionLog.confidence * 100).toFixed(0)}%)`}
                                  size="small"
                                  sx={{ 
                                    mr: 0.5, 
                                    mb: 0.5,
                                    backgroundColor: getEmotionColor(emotionLog.emotion),
                                    color: 'white'
                                  }}
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              No emotion data
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {student.subjectProgress ? (
                            <Box>
                              {Object.entries(student.subjectProgress).slice(0, 2).map(([subject, progress]) => (
                                <Chip
                                  key={subject}
                                  label={`${subject}: ${progress.progress}%`}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                              {Object.keys(student.subjectProgress).length > 2 && (
                                <Chip
                                  label={`+${Object.keys(student.subjectProgress).length - 2} more`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              No subject data
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No student data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Emotion Detections</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Emotion</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentEmotions && recentEmotions.length > 0 ? (
                    recentEmotions.map((emotion, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2, width: 32, height: 32, fontSize: 14 }}>
                              {emotion.student?.name?.charAt(0) || '?'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2">{emotion.student?.name || 'Unknown'}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {emotion.student?.email || 'No email'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={emotion.emotion}
                            size="small"
                            sx={{ 
                              backgroundColor: getEmotionColor(emotion.emotion),
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {(emotion.confidence * 100).toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(emotion.timestamp).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No recent emotion detections
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsSection;