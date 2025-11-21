class RealtimeService {
  constructor() {
    this.socket = null;
    this.adminSocket = null;
    this.studentSocket = null;
    this.listeners = new Map();
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
  }

  connectAsAdmin(token, onConnect, onError) {
    if (this.adminSocket) {
      this.disconnectAdmin();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/admin`;
    
    this.adminSocket = new WebSocket(wsUrl, [token]);
    
    this.adminSocket.onopen = () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      console.log('Admin WebSocket connected');
      if (onConnect) onConnect();
    };

    this.adminSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.notifyListeners(message.type, message.data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.adminSocket.onclose = () => {
      this.connected = false;
      console.log('Admin WebSocket disconnected');
      this.attemptReconnectAsAdmin(token, onConnect, onError);
    };

    this.adminSocket.onerror = (error) => {
      console.error('Admin WebSocket error:', error);
      if (onError) onError(error);
    };
  }

  connectAsStudent(token, userId, onConnect, onError) {
    if (this.studentSocket) {
      this.disconnectStudent();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/student`;
    
    this.studentSocket = new WebSocket(wsUrl, [token]);
    
    this.studentSocket.onopen = () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      console.log('Student WebSocket connected');
      if (onConnect) onConnect();
    };

    this.studentSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.notifyListeners(message.type, message.data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.studentSocket.onclose = () => {
      this.connected = false;
      console.log('Student WebSocket disconnected');
      this.attemptReconnectAsStudent(token, userId, onConnect, onError);
    };

    this.studentSocket.onerror = (error) => {
      console.error('Student WebSocket error:', error);
      if (onError) onError(error);
    };
  }

  attemptReconnectAsAdmin(token, onConnect, onError) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached for admin WebSocket');
      if (onError) onError(new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`Attempting to reconnect admin WebSocket in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connectAsAdmin(token, onConnect, onError);
    }, delay);
  }

  attemptReconnectAsStudent(token, userId, onConnect, onError) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached for student WebSocket');
      if (onError) onError(new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`Attempting to reconnect student WebSocket in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connectAsStudent(token, userId, onConnect, onError);
    }, delay);
  }

  disconnectAdmin() {
    if (this.adminSocket) {
      this.adminSocket.close();
      this.adminSocket = null;
      this.connected = false;
    }
  }

  disconnectStudent() {
    if (this.studentSocket) {
      this.studentSocket.close();
      this.studentSocket = null;
      this.connected = false;
    }
  }

  disconnect() {
    this.disconnectAdmin();
    this.disconnectStudent();
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
    
    // Return unsubscribe function
    return () => this.off(eventType, callback);
  }

  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType);
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  notifyListeners(eventType, data) {
    if (this.listeners.has(eventType)) {
      for (const callback of this.listeners.get(eventType)) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventType} listener:`, error);
        }
      }
    }
  }

  // Helper methods for specific event types
  onInitialData(callback) {
    return this.on('INITIAL_DATA', callback);
  }

  onStudentUpdated(callback) {
    return this.on('STUDENT_UPDATED', callback);
  }

  onNewEmotion(callback) {
    return this.on('NEW_EMOTION', callback);
  }

  onProgressUpdate(callback) {
    return this.on('PROGRESS_UPDATE', callback);
  }

  onInitialStudentData(callback) {
    return this.on('INITIAL_STUDENT_DATA', callback);
  }
}

const realtimeService = new RealtimeService();
export default realtimeService;