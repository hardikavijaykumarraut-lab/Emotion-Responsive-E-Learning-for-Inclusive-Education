const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// Test script to verify real-time updates are working
console.log('Testing real-time updates...');

// Generate a test JWT token (in a real app, you'd get this from the login process)
const testToken = jwt.sign(
  { userId: 'test-user-id', role: 'student' },
  process.env.JWT_SECRET || 'your-secret-key',
  { expiresIn: '1h' }
);

// Connect to the WebSocket server
const wsUrl = 'ws://localhost:5000/ws/student';
const ws = new WebSocket(wsUrl, [testToken]);

ws.on('open', function open() {
  console.log('Connected to WebSocket server');
});

ws.on('message', function incoming(data) {
  console.log('Received message:', data.toString());
});

ws.on('close', function close() {
  console.log('Disconnected from WebSocket server');
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

// Keep the connection alive for testing
setTimeout(() => {
  ws.close();
}, 10000);