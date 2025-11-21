const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const RealtimeService = require('./services/realtimeService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000', 'http://localhost:5001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const adminAnalyticsRoutes = require('./routes/adminAnalytics');
const contentRoutes = require('./routes/content');
const emotionsRoutes = require('./routes/emotions');
const quizRoutes = require('./routes/quiz');
const progressRoutes = require('./routes/progress');
const analyticsRoutes = require('./routes/analytics');
const settingsRoutes = require('./routes/settings');

// Function to find an available port
const findAvailablePort = (startPort, maxAttempts = 10) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tryPort = (port) => {
      if (attempts >= maxAttempts) {
        return reject(new Error(`Could not find an available port after ${maxAttempts} attempts`));
      }
      
      const server = require('net').createServer();
      
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          attempts++;
          console.log(`Port ${port} is in use, trying port ${port + 1}...`);
          tryPort(port + 1);
        } else {
          reject(err);
        }
      });
      
      server.once('listening', () => {
        server.close(() => {
          resolve(port);
        });
      });
      
      server.listen(port, '0.0.0.0');
    };
    
    tryPort(startPort);
  });
};

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Find an available port starting from PORT
    const availablePort = await findAvailablePort(Number(PORT));
    
    // Create HTTP server after routes are defined
    const server = http.createServer(app);
    
    // Initialize realtime service
    const realtimeService = new RealtimeService(server);
    
    // Set the realtime service for emotions route
    emotionsRoutes.setRealtimeService(realtimeService);
    progressRoutes.setRealtimeService(realtimeService);
    
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/admin/analytics', adminAnalyticsRoutes);
    app.use('/api/content', contentRoutes);
    app.use('/api/emotions', emotionsRoutes.router);
    app.use('/api/quiz', quizRoutes);
    app.use('/api/progress', progressRoutes.router);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/settings', settingsRoutes);
    
    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    });
    
    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
    
    server.listen(availablePort, '0.0.0.0', () => {
      console.log(`🚀 EmoLearn backend server running on port ${availablePort}`);
      console.log(`📊 Health check: http://localhost:${availablePort}/api/health`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });
    
    // Handle process termination
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received. Shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();