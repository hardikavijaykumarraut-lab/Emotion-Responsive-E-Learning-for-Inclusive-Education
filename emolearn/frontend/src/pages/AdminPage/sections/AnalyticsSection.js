import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getDashboardStats } from '../../../api/adminApi';
import { subscribeToRealtimeUpdates } from '../../../services/adminAnalyticsService';
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
  Button,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  AlertTitle
} from '@mui/material';
import { Refresh as RefreshIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

// Function to generate engagement trends based on student data
const generateEngagementTrends = (students) => {
  if (!students || students.length === 0) {
    return [
      { day: 'Mon', engagement: 0 },
      { day: 'Tue', engagement: 0 },
      { day: 'Wed', engagement: 0 },
      { day: 'Thu', engagement: 0 },
      { day: 'Fri', engagement: 0 },
      { day: 'Sat', engagement: 0 },
      { day: 'Sun', engagement: 0 }
    ];
  }

  // For demo purposes, we'll create a trend based on student progress
  // In a real application, this would come from actual engagement data
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Calculate average progress per day (simplified approach)
  return days.map((day, index) => {
    // Base engagement on student progress with some variation
    const baseEngagement = students.reduce((sum, student) => sum + student.progress, 0) / students.length;
    // Add some daily variation
    const variation = Math.sin(index) * 10; // Creates a wave pattern
    const engagement = Math.max(0, Math.min(100, Math.round(baseEngagement + variation)));
    
    return {
      day,
      engagement
    };
  });
};

const AnalyticsSection = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [data, setData] = useState({
    totalStudents: 0,
    activeStudents: 0,
    engagementRate: 0,
    studentsWithProgress: [],
    emotionDistribution: [],
    avgProgress: 0,
    insights: [],
    recommendations: [],
    recentEmotions: [],
    engagementTrends: []
  });
  
  const unsubscribeRef = useRef(null);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('Fetching analytics data...');
      
      // Fetch dashboard stats which include comprehensive student data
      const response = await getDashboardStats();
      
      console.log('Received analytics data:', response.data);
      
      const stats = response.data.stats;
      const students = response.data.students;
      const recentEmotions = response.data.recentEmotions;

      // Calculate engagement metrics
      const engagementRate = stats.totalStudents > 0 ? 
        Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0;
      
      // Calculate engagement trends based on actual student data
      const engagementTrends = generateEngagementTrends(students);

      // Generate insights and recommendations
      const { insights, recommendations } = generateInsightsAndRecommendations(
        students, 
        stats.emotionDistribution, 
        stats.avgProgress,
        engagementRate
      );

      const newData = {
        totalStudents: stats.totalStudents,
        activeStudents: stats.activeStudents,
        engagementRate,
        studentsWithProgress: students.map(s => ({
          id: s._id,
          name: s.name,
          email: s.email,
          progress: s.progress,
          lastActive: s.lastActive,
          emotionDistribution: s.emotionDistribution || {},
          recentEmotions: s.recentEmotions || []
        })),
        emotionDistribution: stats.emotionDistribution.map(e => ({
          name: e.emotion,
          value: e.count,
          count: e.count
        })),
        avgProgress: stats.avgProgress,
        insights,
        recommendations,
        recentEmotions: recentEmotions || [],
        engagementTrends
      };

      console.log('Setting analytics data:', newData);
      
      setData(newData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to fetch analytics data. Please try again.');
      // Set default data on error
      setData({
        totalStudents: 0,
        activeStudents: 0,
        engagementRate: 0,
        studentsWithProgress: [],
        emotionDistribution: [],
        avgProgress: 0,
        insights: ['Unable to fetch analytics data'],
        recommendations: ['Check system connectivity and try again'],
        recentEmotions: [],
        engagementTrends: [
          { day: 'Mon', engagement: 0 },
          { day: 'Tue', engagement: 0 },
          { day: 'Wed', engagement: 0 },
          { day: 'Thu', engagement: 0 },
          { day: 'Fri', engagement: 0 },
          { day: 'Sat', engagement: 0 },
          { day: 'Sun', engagement: 0 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInsightsAndRecommendations = (students, emotions, avgProgress, engagementRate) => {
    const insights = [];
    const recommendations = [];
    
    if (students.length > 0) {
      insights.push(`📊 Currently tracking ${students.length} student${students.length !== 1 ? 's' : ''}`);
    } else {
      insights.push('📊 No students found in the system');
    }
    
    // Progress insights
    const avgProgressRounded = Math.round(avgProgress);
    if (avgProgressRounded > 70) {
      insights.push(`🚀 Excellent overall progress (${avgProgressRounded}%) - Students are excelling!`);
    } else if (avgProgressRounded > 50) {
      insights.push(`📈 Good overall progress (${avgProgressRounded}%) - Keep up the good work!`);
    } else if (avgProgressRounded > 30) {
      insights.push(`⚠️ Moderate overall progress (${avgProgressRounded}%) - Consider additional support for struggling students`);
    } else {
      insights.push(`❗ Low overall progress (${avgProgressRounded}%) - Immediate intervention may be needed`);
    }
    
    // Engagement insights
    if (engagementRate > 80) {
      insights.push(`🎯 High engagement rate (${engagementRate}%) - Students are actively participating!`);
    } else if (engagementRate > 60) {
      insights.push(`👍 Good engagement rate (${engagementRate}%) - Maintaining student interest`);
    } else if (engagementRate > 40) {
      insights.push(`⚠️ Moderate engagement rate (${engagementRate}%) - Consider ways to increase participation`);
    } else {
      insights.push(`❗ Low engagement rate (${engagementRate}%) - Urgent need to re-engage students`);
    }
    
    // Analyze emotion distribution
    const totalEmotions = emotions.reduce((sum, e) => sum + (e.count || 0), 0);
    if (totalEmotions > 0) {
      const confusedCount = emotions.find(e => e._id === 'confused')?.count || 0;
      const confusedPercentage = (confusedCount / totalEmotions) * 100;
      
      if (confusedPercentage > 15) {
        insights.push(`⚠️ High confusion rate (${Math.round(confusedPercentage)}%) - Consider simplifying content or adding more examples`);
        recommendations.push("Review content complexity and add clarifying examples");
      }
      
      const frustratedCount = emotions.find(e => e._id === 'angry' || e._id === 'fearful' || e._id === 'disgusted')?.count || 0;
      const frustratedPercentage = (frustratedCount / totalEmotions) * 100;
      
      if (frustratedPercentage > 10) {
        insights.push(`❗ ${Math.round(frustratedPercentage)}% frustration detected - Review difficult topics and provide additional support`);
        recommendations.push("Provide additional support resources for challenging topics");
      }
      
      const happyCount = emotions.find(e => e._id === 'happy' || e._id === 'surprised')?.count || 0;
      const happyPercentage = (happyCount / totalEmotions) * 100;
      
      if (happyPercentage > 30) {
        insights.push(`✨ ${Math.round(happyPercentage)}% positive engagement - Students are enjoying the learning experience!`);
      }
    }
    
    // Identify students needing attention
    const lowProgressStudents = students.filter(s => s.progress < 30);
    if (lowProgressStudents.length > 0) {
      insights.push(`🆘 ${lowProgressStudents.length} student${lowProgressStudents.length !== 1 ? 's' : ''} with critical progress levels - Immediate support recommended`);
      recommendations.push(`Provide personalized support to ${lowProgressStudents.length} struggling student(s)`);
    }
    
    const highProgressStudents = students.filter(s => s.progress > 80);
    if (highProgressStudents.length > 0) {
      insights.push(`🏆 ${highProgressStudents.length} student${highProgressStudents.length !== 1 ? 's' : ''} excelling - Consider advanced materials`);
      recommendations.push(`Offer advanced challenges to ${highProgressStudents.length} high-performing student(s)`);
    }
    
    // Additional recommendations based on engagement
    if (engagementRate < 50) {
      recommendations.push("Implement interactive activities to boost engagement");
      recommendations.push("Send reminder notifications to inactive students");
    }
    
    if (engagementRate < 30) {
      recommendations.push("Conduct surveys to understand disengagement reasons");
      recommendations.push("Consider revising content delivery methods");
    }
    
    return { insights, recommendations };
  };

  // Update student data in real-time
  const updateStudent = useCallback((updatedStudent) => {
    setData(prev => ({
      ...prev,
      studentsWithProgress: prev.studentsWithProgress.map(student => 
        student.id === updatedStudent._id ? { ...student, ...updatedStudent } : student
      )
    }));
  }, []);

  // Add new emotion in real-time
  const addEmotion = useCallback((emotionData) => {
    setData(prev => ({
      ...prev,
      recentEmotions: [emotionData, ...prev.recentEmotions].slice(0, 10)
    }));
  }, []);

  useEffect(() => {
    fetchAnalytics();
    
    // Set up real-time updates
    const unsubscribe = subscribeToRealtimeUpdates((data) => {
      console.log('Received real-time update:', data);
      if (data.type === 'INITIAL_DATA') {
        const stats = data.data.stats;
        const students = data.data.students;
        const recentEmotions = data.data.recentEmotions;

        // Calculate engagement metrics
        const engagementRate = stats.totalStudents > 0 ? 
          Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0;

        // Calculate engagement trends based on actual student data
        const engagementTrends = generateEngagementTrends(students);

        // Generate insights and recommendations
        const { insights, recommendations } = generateInsightsAndRecommendations(
          students, 
          stats.emotionDistribution, 
          stats.avgProgress,
          engagementRate
        );

        setData({
          totalStudents: stats.totalStudents,
          activeStudents: stats.activeStudents,
          engagementRate,
          studentsWithProgress: students.map(s => ({
            id: s._id,
            name: s.name,
            email: s.email,
            progress: s.progress,
            lastActive: s.lastActive,
            emotionDistribution: s.emotionDistribution || {},
            recentEmotions: s.recentEmotions || []
          })),
          emotionDistribution: stats.emotionDistribution.map(e => ({
            name: e.emotion,
            value: e.count,
            count: e.count
          })),
          avgProgress: stats.avgProgress,
          insights,
          recommendations,
          recentEmotions: recentEmotions || [],
          engagementTrends
        });
      } else if (data.type === 'STUDENT_UPDATED') {
        console.log('Updating student data:', data.data);
        updateStudent(data.data);
        // Update engagement trends when student data changes
        setData(prev => ({
          ...prev,
          engagementTrends: generateEngagementTrends(prev.studentsWithProgress.map(s => 
            s.id === data.data._id ? { ...s, ...data.data } : s
          ))
        }));
      } else if (data.type === 'NEW_EMOTION') {
        console.log('Adding new emotion:', data.data);
        addEmotion(data.data);
      }
    });
    
    // Store unsubscribe function in ref
    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [timeRange, updateStudent, addEmotion]);

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const getEmotionColor = (emotion) => {
    const colorMap = {
      'happy': '#4CAF50',
      'sad': '#2196F3',
      'angry': '#F44336',
      'fearful': '#9C27B0',
      'disgusted': '#FF9800',
      'surprised': '#FFEB3B',
      'neutral': '#9E9E9E',
      'confused': '#607D8B',
      'engaged': '#00BCD4'
    };
    return colorMap[emotion] || '#9E9E9E';
  };

  const renderStudentAnalytics = () => (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Students
            </Typography>
            <Typography variant="h4">
              {data.totalStudents}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Students
            </Typography>
            <Typography variant="h4" color="primary">
              {data.activeStudents}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Average Progress
            </Typography>
            <Typography variant="h4">
              {Math.round(data.avgProgress)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Engagement Rate
            </Typography>
            <Typography variant="h4" color="success.main">
              {data.engagementRate}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Engagement Trends Chart */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Engagement Trends
          </Typography>
          <Box sx={{ height: 300 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : data.engagementTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.engagementTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Engagement']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                    name="Engagement Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary">No trend data available</Typography>
            )}
          </Box>
        </Paper>
      </Grid>

      {/* Emotion Distribution */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Emotion Distribution
          </Typography>
          <Box sx={{ height: 300 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : data.emotionDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.emotionDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {data.emotionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary">No emotion data available</Typography>
            )}
          </Box>
        </Paper>
      </Grid>

      {/* Student Progress Table */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Student Progress Overview
          </Typography>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
              </Box>
            ) : data.studentsWithProgress.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell align="right">Progress</TableCell>
                      <TableCell align="right">Last Active</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.studentsWithProgress.map((student) => (
                      <TableRow key={student.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component="th" scope="row">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 1, fontSize: '0.75rem' }}>
                              {student.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {student.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {student.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                            <Typography variant="body2" fontWeight="medium">
                              {Math.round(student.progress)}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={student.progress}
                              sx={{ width: '100%', height: 6, borderRadius: 3, mt: 0.5 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'Never'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {student.progress > 70 ? (
                            <Chip label="Excellent" size="small" color="success" variant="outlined" />
                          ) : student.progress > 50 ? (
                            <Chip label="Good" size="small" color="primary" variant="outlined" />
                          ) : student.progress > 30 ? (
                            <Chip label="Needs Support" size="small" color="warning" variant="outlined" />
                          ) : (
                            <Chip label="Critical" size="small" color="error" variant="outlined" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">No student data available</Typography>
            )}
          </Box>
        </Paper>
      </Grid>

      {/* Recent Emotions */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Emotion Logs
          </Typography>
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
              </Box>
            ) : data.recentEmotions.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Emotion</TableCell>
                      <TableCell align="right">Confidence</TableCell>
                      <TableCell align="right">Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recentEmotions.map((emotion, index) => (
                      <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Typography variant="body2">
                            {emotion.student?.name || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={emotion.emotion} 
                            size="small" 
                            sx={{ 
                              backgroundColor: getEmotionColor(emotion.emotion),
                              color: 'white',
                              fontWeight: 'bold'
                            }} 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {(emotion.confidence * 100).toFixed(0)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {new Date(emotion.timestamp).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">No recent emotion data available</Typography>
            )}
          </Box>
        </Paper>
      </Grid>

      {/* Insights & Recommendations */}
      <Grid item xs={12} md={6}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Insights & Recommendations</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Key Insights:
              </Typography>
              {data.insights.map((insight, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    bgcolor: 'action.hover', 
                    borderRadius: 2,
                    borderLeft: 4,
                    borderColor: 'primary.main'
                  }}
                >
                  <Typography variant="body1">
                    {insight}
                  </Typography>
                </Box>
              ))}
              
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'secondary.main', mt: 2 }}>
                Recommendations:
              </Typography>
              {data.recommendations.map((recommendation, index) => (
                <Box 
                  key={`rec-${index}`} 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    bgcolor: 'secondary.light', 
                    borderRadius: 2,
                    borderLeft: 4,
                    borderColor: 'secondary.main'
                  }}
                >
                  <Typography variant="body1">
                    {recommendation}
                  </Typography>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5">Analytics Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              label="Time Range"
              disabled={loading}
            >
              <MenuItem value="day">Last 24 Hours</MenuItem>
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAnalytics}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2, alignSelf: 'center' }}>
            Loading analytics data...
          </Typography>
        </Box>
      ) : (
        renderStudentAnalytics()
      )}
    </Box>
  );
};

export default AnalyticsSection;