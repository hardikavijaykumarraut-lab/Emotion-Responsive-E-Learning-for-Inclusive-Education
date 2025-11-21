const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Emotion = require('../models/Emotion');
const SubjectProgressDetail = require('../models/SubjectProgress');

// Store the singleton instance
let instance = null;

class RealtimeService {
  constructor(server) {
    // Ensure singleton pattern
    if (instance) {
      return instance;
    }
    
    this.wss = new WebSocket.Server({ noServer: true });
    this.clients = new Map(); // Map of userId to WebSocket
    this.studentClients = new Map(); // Map of userId to WebSocket for students
    this.setupWebSocket(server);
    
    // Set the instance
    instance = this;
  }

  static getInstance() {
    return instance;
  }

  setupWebSocket(server) {
    // Handle upgrade from HTTP to WebSocket
    server.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
      
      if (pathname === '/ws/admin' || pathname === '/ws/student') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws, request) => {
      const token = request.headers['sec-websocket-protocol'];
      const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
      
      try {
        if (!token) throw new Error('No token provided');
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        if (pathname === '/ws/admin') {
          if (decoded.role !== 'admin') throw new Error('Unauthorized: Admin access required');
          this.clients.set(decoded.userId, ws);
          console.log(`Admin client connected: ${decoded.userId}`);
          // Send initial data
          this.sendInitialData(ws);
        } else if (pathname === '/ws/student') {
          // Allow both students and admins to connect to student WebSocket
          this.studentClients.set(decoded.userId, ws);
          console.log(`Student client connected: ${decoded.userId}`);
          // Send initial student data
          this.sendInitialStudentData(ws, decoded.userId);
        }
        
        ws.on('close', () => {
          console.log(`Client disconnected: ${decoded.userId} (role: ${decoded.role})`);
          this.clients.delete(decoded.userId);
          this.studentClients.delete(decoded.userId);
        });
        
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.clients.delete(decoded.userId);
          this.studentClients.delete(decoded.userId);
        });
        
      } catch (error) {
        console.error('WebSocket authentication failed:', error.message);
        ws.close(1008, 'Unauthorized');
      }
    });
  }

  async sendInitialData(ws) {
    try {
      const [students, stats] = await Promise.all([
        this.getStudentsWithProgress(),
        this.getDashboardStats()
      ]);
      
      const message = {
        type: 'INITIAL_DATA',
        data: {
          students,
          stats
        }
      };
      
      console.log('Sending initial data to admin client');
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  async sendInitialStudentData(ws, userId) {
    try {
      const [progress, emotions, detailedProgress] = await Promise.all([
        Progress.findOne({ userId }),
        Emotion.find({ userId })
          .sort({ timestamp: -1 })
          .limit(100) // Increase limit to get more emotion history
          .lean(),
        SubjectProgressDetail.find({ userId })
          .sort({ createdAt: -1 })
          .limit(100) // Increase limit for detailed progress
          .lean()
      ]);

      // Get recent activity (last 20 entries)
      const recentActivity = progress && progress.recentActivity 
        ? progress.recentActivity.slice(0, 20) 
        : [];

      const message = {
        type: 'INITIAL_STUDENT_DATA',
        data: {
          progress: {
            ...progress?.toObject(),
            detailedSubjectProgress: detailedProgress
          },
          emotions,
          detailedProgress, // Keep this for backward compatibility
          recentActivity
        }
      };
      
      console.log(`Sending initial student data to client: ${userId}`);
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending initial student data:', error);
    }
  }

  async getStudentsWithProgress() {
    const students = await User.find({ role: 'student' })
      .select('name email lastActive avatar')
      .lean();

    return Promise.all(students.map(async (student) => {
      const [progress, recentEmotions] = await Promise.all([
        Progress.findOne({ userId: student._id }),
        Emotion.find({ userId: student._id })
          .sort({ timestamp: -1 })
          .limit(10)
          .select('emotion confidence timestamp')
          .lean()
      ]);

      // Get recent activity (last 10 entries)
      const recentActivity = progress && progress.recentActivity 
        ? progress.recentActivity.slice(0, 10) 
        : [];

      // Calculate emotion distribution for this student
      const emotionDistribution = recentEmotions.reduce((acc, emotion) => {
        acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
        return acc;
      }, {});

      return {
        ...student,
        _id: student._id, // Ensure _id is included
        progress: progress?.overallProgress || 0,
        subjectProgress: progress?.subjectProgress || {},
        lastActive: progress?.lastActive || student.lastActive || new Date(),
        recentEmotions: recentEmotions || [],
        recentActivity: recentActivity,
        emotionDistribution: emotionDistribution
      };
    }));
  }

  async getDashboardStats() {
    const [
      totalStudents,
      activeStudents,
      avgProgressResult,
      emotionDistribution,
      recentEmotions
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', lastActive: { $exists: true } }),
      Progress.aggregate([
        { $group: { _id: null, avg: { $avg: '$overallProgress' } } }
      ]),
      Emotion.aggregate([
        { $group: { _id: '$emotion', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Emotion.find()
        .sort({ timestamp: -1 })
        .limit(20)
        .populate('userId', 'name email')
        .lean()
    ]);

    const avgProgress = avgProgressResult[0]?.avg || 0;

    return {
      totalStudents,
      activeStudents,
      avgProgress: avgProgress,
      emotionDistribution: emotionDistribution.map(e => ({
        emotion: e._id,
        count: e.count
      })),
      recentEmotions: recentEmotions.map(e => ({
        ...e,
        student: e.userId ? { name: e.userId.name, email: e.userId.email } : null
      }))
    };
  }

  // Call this method when progress is updated
  async broadcastProgressUpdate(userId) {
    try {
      console.log('Broadcasting progress update for user:', userId);
      const [student, progress] = await Promise.all([
        User.findById(userId).select('name email lastActive avatar').lean(),
        Progress.findOne({ userId })
      ]);

      if (!student) {
        console.log('No student found for userId:', userId);
        return;
      }

      // Get recent emotions for this student
      const recentEmotions = await Emotion.find({ userId })
        .sort({ timestamp: -1 })
        .limit(10)
        .select('emotion confidence timestamp')
        .lean();

      // Get recent activity (last 20 entries)
      const recentActivity = progress && progress.recentActivity 
        ? progress.recentActivity.slice(0, 20) 
        : [];

      // Get detailed progress information
      const detailedProgress = await SubjectProgressDetail.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      // Calculate emotion distribution for this student
      const emotionDistribution = recentEmotions.reduce((acc, emotion) => {
        acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
        return acc;
      }, {});

      const studentData = {
        ...student,
        _id: userId, // Ensure _id is included
        progress: {
          ...progress?.toObject(),
          detailedSubjectProgress: detailedProgress
        },
        subjectProgress: progress?.subjectProgress || {},
        lastActive: progress?.lastActive || new Date(),
        recentEmotions: recentEmotions || [],
        recentActivity: recentActivity,
        emotionDistribution: emotionDistribution
      };

      console.log('Broadcasting STUDENT_UPDATED message:', studentData);
      this.broadcast({
        type: 'STUDENT_UPDATED',
        data: studentData
      });
      
      // Also broadcast to the specific student
      this.broadcastToStudent(userId, {
        type: 'PROGRESS_UPDATE',
        data: {
          progress: {
            ...progress?.toObject(),
            detailedSubjectProgress: detailedProgress
          },
          emotions: recentEmotions,
          detailedProgress, // Keep this for backward compatibility
          recentActivity
        }
      });
    } catch (error) {
      console.error('Error broadcasting progress update:', error);
    }
  }

  // Call this method when a new emotion is detected
  async broadcastNewEmotion(emotionData) {
    try {
      console.log('Broadcasting new emotion:', emotionData);
      const student = await User.findById(emotionData.userId)
        .select('name email')
        .lean();

      if (!student) {
        console.log('No student found for emotion userId:', emotionData.userId);
        return;
      }

      const broadcastData = {
        type: 'NEW_EMOTION',
        data: {
          ...emotionData,
          student: {
            name: student.name,
            email: student.email
          },
          timestamp: new Date()
        }
      };

      console.log('Broadcasting NEW_EMOTION message:', broadcastData);
      // Broadcast to admin clients
      this.broadcast(broadcastData);
      
      // Broadcast to the specific student client
      this.broadcastToStudent(emotionData.userId, broadcastData);
    } catch (error) {
      console.error('Error broadcasting new emotion:', error);
    }
  }

  // Broadcast to all admin clients
  broadcast(message) {
    console.log('Broadcasting message to admin clients:', message);
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }

    let clientCount = 0;
    this.clients.forEach((client, userId) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        clientCount++;
      } else {
        // Clean up closed connections
        this.clients.delete(userId);
      }
    });
    console.log(`Message sent to ${clientCount} admin clients`);
  }

  // Broadcast to a specific student
  broadcastToStudent(userId, message) {
    console.log(`Broadcasting message to student ${userId}:`, message);
    const studentWs = this.studentClients.get(userId);
    if (studentWs && studentWs.readyState === WebSocket.OPEN) {
      if (typeof message !== 'string') {
        message = JSON.stringify(message);
      }
      studentWs.send(message);
      console.log(`Message sent to student ${userId}`);
    } else {
      console.log(`No active WebSocket connection for student ${userId}`);
      // Clean up closed connections
      if (studentWs) {
        this.studentClients.delete(userId);
      }
    }
  }

  // Broadcast progress update to a specific student
  async broadcastStudentProgressUpdate(userId) {
    try {
      console.log('Broadcasting student progress update for user:', userId);
      const [progress, emotions, detailedProgress, progressRecord] = await Promise.all([
        Progress.findOne({ userId }),
        Emotion.find({ userId })
          .sort({ timestamp: -1 })
          .limit(100) // Increase limit for more emotion history
          .lean(),
        SubjectProgressDetail.find({ userId })
          .sort({ createdAt: -1 })
          .limit(100) // Increase limit for detailed progress
          .lean(),
        Progress.findOne({ userId }).select('recentActivity')
      ]);

      // Get the latest recent activity (limit to last 20)
      const recentActivity = progressRecord && progressRecord.recentActivity 
        ? progressRecord.recentActivity.slice(0, 20) 
        : [];

      const message = {
        type: 'PROGRESS_UPDATE',
        data: {
          progress: {
            ...progress?.toObject(),
            detailedSubjectProgress: detailedProgress
          },
          emotions,
          detailedProgress, // Keep this for backward compatibility
          recentActivity
        }
      };

      console.log('Broadcasting PROGRESS_UPDATE message:', message);
      this.broadcastToStudent(userId, message);
    } catch (error) {
      console.error('Error broadcasting student progress update:', error);
    }
  }
}

module.exports = RealtimeService;