import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Box,
  Avatar,
  Divider,
  Empty
} from '@mui/material';
import {
  Book as BookIcon,
  Quiz as QuizIcon,
  PlayCircle as PlayCircleIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import {
  ACTIVITY_TYPES,
  ACTIVITY_ACTIONS,
  ACTIVITY_COLORS,
  formatDuration,
  formatScore,
  getActivityColor
} from '../../constants/activityConstants';

const getActivityIcon = (type) => {
  const iconProps = { fontSize: 'small', sx: { color: getActivityColor(type) } };
  
  switch (type) {
    case ACTIVITY_TYPES.MODULE_COMPLETED:
      return <BookIcon {...iconProps} />;
    case ACTIVITY_TYPES.QUIZ_COMPLETED:
      return <QuizIcon {...iconProps} />;
    case ACTIVITY_TYPES.CONTENT_VIEWED:
      return <PlayCircleIcon {...iconProps} />;
    case ACTIVITY_TYPES.ASSIGNMENT_SUBMITTED:
      return <AssignmentIcon {...iconProps} />;
    case ACTIVITY_TYPES.ACHIEVEMENT_UNLOCKED:
      return <TrophyIcon {...iconProps} />;
    default:
      return <BookIcon {...iconProps} />;
  }
};

const ActivityFeed = ({ 
  activities = [], 
  maxItems = 4,
  showFilters = false,
  filters = []
}) => {
  // Filter activities if filters are provided
  const filteredActivities = useMemo(() => {
    let filtered = activities;
    
    if (filters && filters.length > 0) {
      filtered = activities.filter(activity => 
        filters.includes(activity.type)
      );
    }
    
    return filtered.slice(0, maxItems);
  }, [activities, filters, maxItems]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActivityDetails = (activity) => {
    const details = [];
    
    // Add subject
    if (activity.subject) {
      details.push(`${activity.subject.charAt(0).toUpperCase()}${activity.subject.slice(1)}`);
    }
    
    // Add score if present
    if (activity.score !== null && activity.score !== undefined) {
      details.push(`Score: ${formatScore(activity.score)}`);
    }
    
    // Add duration if present
    if (activity.duration) {
      details.push(`Duration: ${formatDuration(activity.duration)}`);
    }
    
    return details.join(' • ');
  };

  if (filteredActivities.length === 0) {
    return (
      <Card>
        <CardHeader 
          title="Recent Activity" 
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography color="textSecondary">
            No recent activity
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Activities will appear here as you complete modules and quizzes
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="Recent Activity" 
        titleTypographyProps={{ variant: 'h6' }}
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ p: 0 }}>
        <List disablePadding>
          {filteredActivities.map((activity, index) => (
            <React.Fragment key={`${activity.timestamp}-${index}`}>
              <ListItem 
                sx={{ 
                  py: 2, 
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)'
                  },
                  transition: 'background-color 0.2s'
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: getActivityColor(activity.type),
                      color: 'white'
                    }}
                  >
                    {getActivityIcon(activity.type)}
                  </Avatar>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">
                        {ACTIVITY_ACTIONS[activity.type] || activity.action}
                      </Typography>
                      {activity.score !== null && activity.score !== undefined && (
                        <Chip
                          label={formatScore(activity.score)}
                          size="small"
                          sx={{
                            backgroundColor: getActivityColor(activity.type),
                            color: 'white',
                            fontWeight: 600,
                            height: 20
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="textSecondary">
                        {getActivityDetails(activity)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                        {formatTimestamp(activity.timestamp)}
                      </Typography>
                    </Box>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
              
              {index < filteredActivities.length - 1 && (
                <Divider variant="inset" component="li" sx={{ my: 0 }} />
              )}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
