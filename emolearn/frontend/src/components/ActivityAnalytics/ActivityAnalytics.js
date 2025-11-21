import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Paper
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  ACTIVITY_TYPES,
  ACTIVITY_COLORS,
  formatDuration
} from '../../constants/activityConstants';

const ActivityAnalytics = ({ activities = [] }) => {
  // Calculate activity statistics
  const stats = useMemo(() => {
    const stats = {
      totalActivities: activities.length,
      moduleCompletions: 0,
      quizCompletions: 0,
      contentViews: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      bySubject: {},
      byType: {},
      trend: []
    };

    let totalScore = 0;
    let scoreCount = 0;

    activities.forEach(activity => {
      // Count by type
      if (activity.type === ACTIVITY_TYPES.MODULE_COMPLETED) {
        stats.moduleCompletions++;
      } else if (activity.type === ACTIVITY_TYPES.QUIZ_COMPLETED) {
        stats.quizCompletions++;
      } else if (activity.type === ACTIVITY_TYPES.CONTENT_VIEWED) {
        stats.contentViews++;
      }

      // Count by subject
      if (activity.subject) {
        if (!stats.bySubject[activity.subject]) {
          stats.bySubject[activity.subject] = 0;
        }
        stats.bySubject[activity.subject]++;
      }

      // Count by type
      if (!stats.byType[activity.type]) {
        stats.byType[activity.type] = 0;
      }
      stats.byType[activity.type]++;

      // Calculate average score
      if (activity.score !== null && activity.score !== undefined) {
        totalScore += activity.score;
        scoreCount++;
      }

      // Calculate total time spent
      if (activity.duration) {
        stats.totalTimeSpent += activity.duration;
      }
    });

    if (scoreCount > 0) {
      stats.averageScore = Math.round(totalScore / scoreCount);
    }

    // Build trend data (activities per day)
    const trendMap = {};
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      if (!trendMap[date]) {
        trendMap[date] = { date, count: 0 };
      }
      trendMap[date].count++;
    });

    stats.trend = Object.values(trendMap).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });

    return stats;
  }, [activities]);

  // Convert subject stats to chart data
  const subjectData = useMemo(() => {
    return Object.entries(stats.bySubject).map(([subject, count]) => ({
      name: subject.charAt(0).toUpperCase() + subject.slice(1),
      value: count,
      color: ACTIVITY_COLORS.MODULE_COMPLETED
    }));
  }, [stats]);

  // Convert activity type stats to chart data
  const typeData = useMemo(() => {
    return Object.entries(stats.byType).map(([type, count]) => ({
      name: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      value: count,
      color: ACTIVITY_COLORS[type] || '#999999'
    }));
  }, [stats]);

  const StatCard = ({ label, value, color = '#2196F3', unit = '' }) => (
    <Paper sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {label}
      </Typography>
      <Typography 
        variant="h6" 
        sx={{ 
          color: color, 
          fontWeight: 'bold',
          fontSize: '1.5rem'
        }}
      >
        {value}{unit}
      </Typography>
    </Paper>
  );

  return (
    <Box sx={{ mt: 3 }}>
      {/* Key Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Activity Summary" 
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <StatCard 
                label="Total Activities" 
                value={stats.totalActivities}
                color="#2196F3"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard 
                label="Modules Completed" 
                value={stats.moduleCompletions}
                color="#4CAF50"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard 
                label="Quizzes Completed" 
                value={stats.quizCompletions}
                color="#2196F3"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard 
                label="Avg Quiz Score" 
                value={stats.averageScore}
                unit="%"
                color={
                  stats.averageScore >= 80 ? '#4CAF50' :
                  stats.averageScore >= 60 ? '#FF9800' :
                  '#F44336'
                }
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Total Time Spent: {formatDuration(stats.totalTimeSpent)}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(100, (stats.totalTimeSpent / 3600) * 100)}
              sx={{ mt: 1, height: 8, borderRadius: 4 }}
            />
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Activity Trend */}
        {stats.trend.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title="Activity Trend" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#2196F3"
                      strokeWidth={2}
                      dot={{ fill: '#2196F3', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Activities"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Activities by Type */}
        {typeData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title="Activities by Type" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Activities by Subject */}
        {subjectData.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Subject Breakdown" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="value" 
                      fill="#4CAF50"
                      name="Activities"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Subject Stats */}
        {Object.entries(stats.bySubject).length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Subject Statistics" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(stats.bySubject).map(([subject, count]) => (
                    <Chip
                      key={subject}
                      label={`${subject.charAt(0).toUpperCase()}${subject.slice(1)}: ${count} activities`}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ActivityAnalytics;
