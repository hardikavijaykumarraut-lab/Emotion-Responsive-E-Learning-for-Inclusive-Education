import { useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import progressService from '../services/progressService';
import { ACTIVITY_TYPES, FLUSH_TIMING } from '../constants/activityConstants';

/**
 * Custom hook to track student learning activities in real-time
 * Batches activities and sends them periodically to avoid excessive API calls
 */
export const useActivityTracking = () => {
  const { user } = useAuth();
  const activityQueueRef = useRef([]);
  const timeoutRef = useRef(null);
  const isFlushingRef = useRef(false);

  /**
   * Flush queued activities to the server
   */
  const flushActivities = useCallback(async () => {
    if (activityQueueRef.current.length === 0 || isFlushingRef.current) {
      return;
    }

    isFlushingRef.current = true;
    const activitiesToSend = [...activityQueueRef.current];
    activityQueueRef.current = [];

    try {
      // Send each activity individually to track module/quiz completion
      for (const activity of activitiesToSend) {
        try {
          if (activity.type === 'quiz_completed') {
            await progressService.trackQuizCompletion(
              user._id,
              activity.subject,
              activity.score,
              activity.duration
            );
          } else if (activity.type === 'module_completed') {
            await progressService.trackModuleCompletion(
              user._id,
              activity.subject,
              activity.duration,
              'module_completed'
            );
          } else if (activity.type === 'content_viewed') {
            await progressService.trackContentView(
              user._id,
              activity.subject,
              activity.duration
            );
          }

          console.log(`Activity tracked: ${activity.type} for ${activity.subject}`);
        } catch (error) {
          console.error(`Error tracking activity ${activity.type}:`, error);
          // Re-queue failed activity
          activityQueueRef.current.push(activity);
        }
      }
    } finally {
      isFlushingRef.current = false;
    }
  }, [user]);

  /**
   * Track a new learning activity
   */
  const trackActivity = useCallback(
    (activityData) => {
      if (!user || user.isGuest) {
        console.log('Skipping activity tracking for guest user');
        return;
      }

      const activity = {
        type: activityData.type, // 'module_completed', 'quiz_completed', 'content_viewed'
        subject: activityData.subject,
        module: activityData.module || null,
        score: activityData.score || null,
        duration: activityData.duration || 0, // in seconds
        emotionData: activityData.emotionData || null,
        timestamp: new Date().toISOString(),
      };

      console.log('Queueing activity:', activity);
      activityQueueRef.current.push(activity);

      // Clear existing timeout and set a new one
      clearTimeout(timeoutRef.current);

      // Flush immediately if it's a quiz or module completion
      if (
        activityData.type === ACTIVITY_TYPES.QUIZ_COMPLETED ||
        activityData.type === ACTIVITY_TYPES.MODULE_COMPLETED
      ) {
        timeoutRef.current = setTimeout(() => {
          flushActivities();
        }, FLUSH_TIMING.IMMEDIATE_ACTIONS);
      } else {
        // For other activities, batch and send every 10 seconds
        timeoutRef.current = setTimeout(() => {
          flushActivities();
        }, FLUSH_TIMING.REGULAR_ACTIVITIES);
      }
    },
    [user, flushActivities]
  );

  /**
   * Manually flush all pending activities
   */
  const flush = useCallback(() => {
    clearTimeout(timeoutRef.current);
    return flushActivities();
  }, [flushActivities]);

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      // Flush remaining activities before unmount
      if (activityQueueRef.current.length > 0) {
        flushActivities();
      }
    };
  }, [flushActivities]);

  return { trackActivity, flush };
};

export default useActivityTracking;
