import axios from 'axios';
import { getAuthHeader } from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get dashboard stats
export const getDashboardStats = async () => {
  try {
    const headers = getAuthHeader();
    console.log('Making request to dashboard stats with headers:', headers);
    
    // Check if we have a valid token
    const authHeader = headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authentication token found');
    }
    
    const response = await axios.get(`${API_URL}/admin/analytics/dashboard-stats`, {
      headers
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    throw error;
  }
};

// Get student details
export const getStudentDetails = async (studentId) => {
  try {
    const headers = getAuthHeader();
    console.log('Making request to student details with headers:', headers);
    
    const response = await axios.get(`${API_URL}/admin/analytics/student/${studentId}`, {
      headers
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching student details:', error);
    throw error;
  }
};

// Get real-time updates
let realtimeService = null;

export const initRealtimeService = (onUpdate) => {
  if (realtimeService) return realtimeService;
  
  realtimeService = {
    socket: null,
    listeners: new Set(),
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    
    connect(token) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
      }
      
      // If no token provided, try to get it from localStorage
      if (!token) {
        const user = JSON.parse(localStorage.getItem('user'));
        token = user?.token || localStorage.getItem('token');
      }
      
      if (!token) {
        console.error('No token found for WebSocket connection');
        return;
      }
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/admin`;
      
      console.log('Connecting to WebSocket with token:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      this.socket = new WebSocket(wsUrl, token); // Pass token as protocol
      
      this.socket.onopen = () => {
        console.log('Connected to real-time service');
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          this.listeners.forEach(listener => listener(data));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onclose = () => {
        console.log('Disconnected from real-time service');
        // Attempt to reconnect after a delay, but with a limit
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30 seconds
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => this.connect(token), delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    },
    
    disconnect() {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      this.listeners.clear();
      this.reconnectAttempts = 0;
    },
    
    addListener(callback) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }
  };
  
  return realtimeService;
};

export const subscribeToRealtimeUpdates = (onUpdate) => {
  // Try to get token from multiple sources
  let token = null;
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (user && user.token) {
    token = user.token;
  } else {
    token = localStorage.getItem('token');
  }
  
  console.log('User for WebSocket connection:', user);
  console.log('Token for WebSocket connection:', token ? `${token.substring(0, 20)}...` : 'No token');
  
  if (!token) {
    console.error('No token found for WebSocket connection');
    return () => {};
  }
  
  const service = initRealtimeService();
  service.connect(token);
  
  return service.addListener((data) => {
    if (onUpdate && typeof onUpdate === 'function') {
      onUpdate(data);
    }
  });
};