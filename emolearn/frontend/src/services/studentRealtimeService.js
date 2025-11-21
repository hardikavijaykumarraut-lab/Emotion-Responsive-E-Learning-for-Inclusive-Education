import { getCurrentUser } from './authService';

class StudentRealtimeService {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(token) {
    // If no token provided, try to get it from current user
    if (!token) {
      const user = getCurrentUser();
      token = user?.token;
    }
    
    if (!token) {
      console.error('No authentication token available for WebSocket connection');
      return;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/student`;
      
      console.log('Connecting to student WebSocket:', wsUrl);
      
      // Pass token as WebSocket subprotocol for authentication
      this.socket = new WebSocket(wsUrl, token);
      
      this.socket.onopen = () => {
        console.log('Connected to student real-time service');
        this.reconnectAttempts = 0;
        this.notifyListeners({ type: 'CONNECTED' });
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received student WebSocket message:', data);
          this.notifyListeners(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onclose = (event) => {
        console.log('Disconnected from student real-time service:', event.code, event.reason);
        this.notifyListeners({ type: 'DISCONNECTED' });
        
        // Attempt to reconnect if it wasn't a clean closure
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connect(token), this.reconnectDelay * this.reconnectAttempts);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('Student WebSocket error:', error);
        this.notifyListeners({ type: 'ERROR', error });
      };
    } catch (error) {
      console.error('Error connecting to student WebSocket:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(data) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in WebSocket listener:', error);
      }
    });
  }

  sendMessage(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }
}

// Export singleton instance
const studentRealtimeService = new StudentRealtimeService();
export default studentRealtimeService;