import { useState, useCallback, useMemo } from 'react';
import { ACTIVITY_TYPES } from '../constants/activityConstants';

/**
 * Custom hook for filtering and searching activities
 * Provides filtering by type, subject, date range, and search query
 */
export const useActivityFilter = (activities = []) => {
  const [filters, setFilters] = useState({
    types: Object.values(ACTIVITY_TYPES),
    subjects: [],
    dateRange: {
      start: null,
      end: null
    },
    searchQuery: '',
    sortBy: 'timestamp', // 'timestamp', 'score', 'duration'
    sortOrder: 'desc'
  });

  // Filter activities based on current filters
  const filteredActivities = useMemo(() => {
    let result = [...activities];

    // Filter by activity type
    if (filters.types.length > 0) {
      result = result.filter(activity => filters.types.includes(activity.type));
    }

    // Filter by subject
    if (filters.subjects.length > 0) {
      result = result.filter(activity => filters.subjects.includes(activity.subject));
    }

    // Filter by date range
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start);
      result = result.filter(activity => new Date(activity.timestamp) >= startDate);
    }

    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end);
      result = result.filter(activity => new Date(activity.timestamp) <= endDate);
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(activity => 
        activity.subject?.toLowerCase().includes(query) ||
        activity.action?.toLowerCase().includes(query) ||
        activity.type?.toLowerCase().includes(query)
      );
    }

    // Sort results
    result.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case 'score':
          aValue = a.score || 0;
          bValue = b.score || 0;
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'timestamp':
        default:
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [activities, filters]);

  // Get unique subjects from activities
  const availableSubjects = useMemo(() => {
    const subjects = new Set();
    activities.forEach(activity => {
      if (activity.subject) {
        subjects.add(activity.subject);
      }
    });
    return Array.from(subjects).sort();
  }, [activities]);

  // Toggle activity type filter
  const toggleType = useCallback((type) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  }, []);

  // Toggle subject filter
  const toggleSubject = useCallback((subject) => {
    setFilters(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  }, []);

  // Set date range
  const setDateRange = useCallback((start, end) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { start, end }
    }));
  }, []);

  // Set search query
  const setSearchQuery = useCallback((query) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: query
    }));
  }, []);

  // Set sort options
  const setSortBy = useCallback((sortBy) => {
    setFilters(prev => ({
      ...prev,
      sortBy
    }));
  }, []);

  const setSortOrder = useCallback((sortOrder) => {
    setFilters(prev => ({
      ...prev,
      sortOrder
    }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      types: Object.values(ACTIVITY_TYPES),
      subjects: [],
      dateRange: {
        start: null,
        end: null
      },
      searchQuery: '',
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  }, []);

  // Get filter statistics
  const stats = useMemo(() => {
    return {
      totalActivities: activities.length,
      filteredActivities: filteredActivities.length,
      activeFilters: 
        (filters.types.length < Object.values(ACTIVITY_TYPES).length ? 1 : 0) +
        (filters.subjects.length > 0 ? 1 : 0) +
        (filters.dateRange.start || filters.dateRange.end ? 1 : 0) +
        (filters.searchQuery ? 1 : 0),
      availableSubjects
    };
  }, [activities, filteredActivities, filters, availableSubjects]);

  return {
    filteredActivities,
    filters,
    toggleType,
    toggleSubject,
    setDateRange,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    resetFilters,
    stats,
    availableSubjects
  };
};

export default useActivityFilter;
