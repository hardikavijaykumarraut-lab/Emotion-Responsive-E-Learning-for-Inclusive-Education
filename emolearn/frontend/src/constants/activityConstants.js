/**
 * Activity tracking constants
 * Centralized definitions to prevent typos and ensure consistency across the app
 */

// Activity Types - represent what action the student performed
export const ACTIVITY_TYPES = {
  MODULE_COMPLETED: 'module_completed',
  QUIZ_COMPLETED: 'quiz_completed',
  CONTENT_VIEWED: 'content_viewed',
  ASSIGNMENT_SUBMITTED: 'assignment_submitted',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked'
};

// Activity Actions - human-readable descriptions
export const ACTIVITY_ACTIONS = {
  MODULE_COMPLETED: 'Completed Module',
  QUIZ_COMPLETED: 'Completed Quiz',
  CONTENT_VIEWED: 'Viewed Content',
  ASSIGNMENT_SUBMITTED: 'Submitted Assignment',
  ACHIEVEMENT_UNLOCKED: 'Unlocked Achievement'
};

// Activity Icons - for UI display
export const ACTIVITY_ICONS = {
  MODULE_COMPLETED: 'BookIcon',
  QUIZ_COMPLETED: 'QuizIcon',
  CONTENT_VIEWED: 'PlayCircleIcon',
  ASSIGNMENT_SUBMITTED: 'AssignmentIcon',
  ACHIEVEMENT_UNLOCKED: 'EmojiEventsIcon'
};

// Activity Colors - for UI styling
export const ACTIVITY_COLORS = {
  MODULE_COMPLETED: '#4CAF50',    // Green
  QUIZ_COMPLETED: '#2196F3',      // Blue
  CONTENT_VIEWED: '#FF9800',      // Orange
  ASSIGNMENT_SUBMITTED: '#9C27B0', // Purple
  ACHIEVEMENT_UNLOCKED: '#FFD700'  // Gold
};

// Duration defaults (in seconds)
export const ACTIVITY_DEFAULTS = {
  MODULE_DURATION: 300,      // 5 minutes
  QUIZ_DURATION: 600,        // 10 minutes
  CONTENT_VIEW_DURATION: 120  // 2 minutes
};

// Polling intervals (in milliseconds)
export const POLLING_INTERVALS = {
  DASHBOARD: 10000,           // 10 seconds
  PROGRESS_CHECK: 30000,      // 30 seconds
  EMOTION_UPDATE: 5000        // 5 seconds
};

// Batch flush timing (in milliseconds)
export const FLUSH_TIMING = {
  IMMEDIATE_ACTIONS: 500,     // Module/Quiz completion
  REGULAR_ACTIVITIES: 10000   // Content view, etc.
};

// Emotion states for context
export const EMOTION_STATES = {
  HAPPY: 'happy',
  SAD: 'sad',
  ANGRY: 'angry',
  SURPRISED: 'surprised',
  FEARFUL: 'fearful',
  DISGUSTED: 'disgusted',
  NEUTRAL: 'neutral',
  CONFUSED: 'confused'
};

/**
 * Get activity display name
 * @param {string} type - Activity type from ACTIVITY_TYPES
 * @returns {string} Human-readable activity name
 */
export const getActivityDisplayName = (type) => {
  return ACTIVITY_ACTIONS[type] || 'Unknown Activity';
};

/**
 * Get activity color
 * @param {string} type - Activity type from ACTIVITY_TYPES
 * @returns {string} Hex color code
 */
export const getActivityColor = (type) => {
  return ACTIVITY_COLORS[type] || '#999999';
};

/**
 * Format duration to human-readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "5 min", "2 h 30 min")
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0 min';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Format score as percentage
 * @param {number} score - Score value
 * @returns {string} Formatted score with %
 */
export const formatScore = (score) => {
  if (score === null || score === undefined) return 'N/A';
  return `${Math.round(score)}%`;
};

/**
 * Get score color based on percentage
 * @param {number} score - Score percentage
 * @returns {string} Color code
 */
export const getScoreColor = (score) => {
  if (score >= 80) return '#4CAF50';   // Green
  if (score >= 60) return '#FF9800';   // Orange
  return '#F44336';                     // Red
};

export default {
  ACTIVITY_TYPES,
  ACTIVITY_ACTIONS,
  ACTIVITY_ICONS,
  ACTIVITY_COLORS,
  ACTIVITY_DEFAULTS,
  POLLING_INTERVALS,
  FLUSH_TIMING,
  EMOTION_STATES,
  getActivityDisplayName,
  getActivityColor,
  formatDuration,
  formatScore,
  getScoreColor
};
