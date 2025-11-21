/**
 * Utility functions for the admin dashboard
 */

/**
 * Format a date string to a more readable format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Date(dateString).toLocaleDateString(undefined, options);
};

/**
 * Format a number with commas as thousand separators
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Get the appropriate color for a status
 * @param {string} status - The status to get the color for
 * @returns {string} Material-UI color string
 */
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'published':
    case 'success':
    case 'completed':
      return 'success';
    case 'inactive':
    case 'draft':
    case 'pending':
      return 'warning';
    case 'suspended':
    case 'banned':
    case 'error':
    case 'failed':
      return 'error';
    case 'archived':
      return 'default';
    default:
      return 'primary';
  }
};

/**
 * Get the appropriate icon for a content type
 * @param {string} type - The content type
 * @returns {JSX.Element} Material-UI icon component
 */
export const getContentTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'course':
      return <BookIcon />;
    case 'lesson':
      return <ArticleIcon />;
    case 'video':
      return <VideocamIcon />;
    case 'quiz':
      return <QuizIcon />;
    case 'document':
      return <DescriptionIcon />;
    default:
      return <CategoryIcon />;
  }
};

/**
 * Format file size from bytes to a readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate a unique ID
 * @returns {string} A unique ID string
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Debounce a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Truncate text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length of the text
 * @param {boolean} addEllipsis - Whether to add '...' at the end
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100, addEllipsis = true) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  const truncated = text.substr(0, maxLength).trim();
  return addEllipsis ? `${truncated}...` : truncated;
};

/**
 * Convert an object to URL query parameters
 * @param {Object} params - The parameters object
 * @returns {string} URL query string
 */
export const toQueryString = (params) => {
  return Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
};

/**
 * Get the initials from a name
 * @param {string} name - The full name
 * @returns {string} Initials (max 2 characters)
 */
export const getInitials = (name) => {
  if (!name) return 'U';
  
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

// Import Material-UI icons
import BookIcon from '@mui/icons-material/Book';
import ArticleIcon from '@mui/icons-material/Article';
import VideocamIcon from '@mui/icons-material/Videocam';
import QuizIcon from '@mui/icons-material/Quiz';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';
