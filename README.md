# EmoLearn — Emotion-Responsive E-Learning for Inclusive Education

An adaptive learning platform that personalizes content delivery through **real-time emotion detection**. Using facial expression analysis via TensorFlow.js and a Python FastAPI microservice, EmoLearn detects student emotions and adjusts learning pace, content difficulty, and teaching style dynamically to maximize engagement and learning outcomes.

**Tech Stack:** React.js · Node.js/Express · MongoDB · WebSocket · TensorFlow.js · Python FastAPI

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Key Features](#key-features)
4. [Emotion Detection Workflow](#emotion-detection-workflow)
5. [Learning Adaptation Algorithms](#learning-adaptation-algorithms)
6. [Prerequisites & Setup](#prerequisites--setup)
7. [Configuration](#configuration)
8. [Running the Project](#running-the-project)
9. [API Endpoints](#api-endpoints)
10. [WebSocket Events](#websocket-events)
11. [Database Schema](#database-schema)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

---

## Project Overview

EmoLearn is a three-tier e-learning platform designed to provide **emotion-responsive education**:

- **Students** take interactive quizzes and lessons while the system monitors their facial expressions
- **Teachers/Admins** view real-time dashboards showing student progress, emotion patterns, and engagement metrics
- **System** automatically adjusts content difficulty, pace, and teaching methods based on detected emotions

### Core Problem Solved
Traditional e-learning platforms treat all students the same. EmoLearn recognizes that students learn differently when they're:
- **Confused** → system provides hints, slows down, simplifies explanations
- **Bored** → system increases difficulty, adds interactive elements, speeds up
- **Frustrated** → system offers breaks, encourages, provides alternative explanations
- **Confident** → system increases challenge, advances to harder topics

### Measurable Impact
- Increased engagement through real-time feedback
- Personalized learning paths reducing dropout rates
- Data-driven insights for teachers on student pain points

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Frontend (emolearn/frontend)                      │   │
│  │  ├─ Dashboard Page (teacher/admin view)                  │   │
│  │  ├─ Learning Page (student quizzes & lessons)            │   │
│  │  ├─ Analytics Page (progress tracking)                   │   │
│  │  └─ TensorFlow.js Emotion Detection (local)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
              ▲                                    ▲
              │ HTTP + WebSocket                  │ HTTP
              │                                    │
┌─────────────┴────────────────────────────────────┴──────────────┐
│                   Backend API (Node.js/Express)                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ emolearn/backend                                          │   │
│  │ ├─ Routes:                                                │   │
│  │ │  ├─ /api/auth (login, register, JWT)                   │   │
│  │ │  ├─ /api/progress (student progress tracking)           │   │
│  │ │  ├─ /api/emotions (emotion logs & analytics)            │   │
│  │ │  ├─ /api/subjects (course/subject management)           │   │
│  │ │  └─ /api/admin (admin dashboards & reports)             │   │
│  │ ├─ Services:                                              │   │
│  │ │  ├─ realtimeService (WebSocket server)                 │   │
│  │ │  ├─ progressBroadcastService (live updates)            │   │
│  │ │  └─ authService (JWT token management)                 │   │
│  │ └─ Middleware:                                            │   │
│  │    ├─ Authentication (JWT)                                │   │
│  │    ├─ Rate limiting                                       │   │
│  │    └─ CORS                                                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────┬────────────────────────────────────┬───────────────┘
              │ MongoDB Protocol                   │ HTTP
              │                                    │
┌─────────────▼────────────────────────────────────▼──────────────┐
│                    MongoDB Database                              │
│  Collections:                                                    │
│  ├─ users (students, teachers, admins)                          │
│  ├─ subjects (course structure)                                 │
│  ├─ modules (lessons)                                           │
│  ├─ progress (student progress per module)                      │
│  ├─ subjectProgressDetails (detailed tracking)                  │
│  ├─ emotions (emotion detection logs)                           │
│  └─ activities (student learning activities)                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│         Python Emotion Detection Microservice (Optional)          │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ emolearn/python-service (FastAPI)                        │    │
│  │ ├─ POST /detect-emotion (facial recognition model)      │    │
│  │ └─ WebSocket /ws/emotions (stream emotion data)         │    │
│  │                                                           │    │
│  │ ML Models:                                                │    │
│  │ ├─ face-api.js or face-recognition.py                   │    │
│  │ └─ Emotion classifier (CNN-based)                        │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Features

### For Students
- 🎓 Interactive quizzes and lessons with real-time feedback
- 😊 Emotion detection via webcam (optional)
- 📈 Personalized content difficulty based on emotion state
- 💾 Progress tracking and learning history
- 🏆 Achievement badges and streak tracking

### For Teachers/Admins
- 📊 Real-time dashboard showing all student progress
- 😢 Emotion analytics (confusion, frustration, boredom trends)
- 📉 Identify struggling students for intervention
- 🎯 Subject-level and module-level analytics
- 📝 Generate reports on student engagement

### System Features
- 🔒 JWT-based authentication
- ⚡ WebSocket for real-time updates (no polling)
- 🗄️ MongoDB for flexible schema
- 🚀 Scalable microservices architecture
- 🔄 Automatic content adaptation

---

## Emotion Detection Workflow

### Step 1: Capture & Detect
```
Student takes quiz → Webcam captures frame every 1-2 seconds
    ↓
TensorFlow.js/face-api detects facial landmarks
    ↓
Emotion classifier predicts: joy, sadness, anger, fear, surprise, neutral, disgust
    ↓
Confidence score (0-1) for each emotion
```

### Step 2: Send to Backend
```
Frontend sends: { timestamp, primaryEmotion, confidence, emotionScores }
    ↓
Backend receives via HTTP POST or WebSocket
    ↓
Stores in MongoDB 'emotions' collection
    ↓
Triggers real-time broadcast to admin dashboard
```

### Step 3: Analyze & Respond
```
Backend calculates emotion trends over quiz/lesson:
  - What % of time was student confused?
  - Peak frustration moments?
  - Overall engagement level?
    ↓
Learning adaptation algorithm updates:
  - Quiz difficulty
  - Content pace
  - Hint frequency
  - Break suggestions
```

### Emotion Classes Detected

| Emotion | Score Threshold | System Response |
|---------|-----------------|-----------------|
| **Confused** (Fear + Surprise) | 0.7+ | Provide hints, slow pace, simplify explanations |
| **Frustrated** (Anger + Sadness) | 0.7+ | Offer breaks, encouragement, alternative content |
| **Bored** (Neutral dominant) | 0.8+ | Increase difficulty, add gamification, speed up |
| **Confident** (Joy) | 0.8+ | Advance to harder topics, reduce hints |
| **Engaged** (Mixed positive) | Balanced | Continue current content |

---

## Learning Adaptation Algorithms

### 1. Dynamic Difficulty Adjustment

```
Input: Student emotion sequence over last N questions
Output: Adjusted difficulty for next question

Algorithm:
  CONFUSION_RATIO = (count of confused frames) / total frames
  CONFIDENCE_RATIO = (count of confident frames) / total frames
  FRUSTRATION_RATIO = (count of frustrated frames) / total frames

  IF CONFUSION_RATIO > 0.5:
    difficulty = difficulty - 1
    hint_frequency = hint_frequency + 1
  ELIF CONFIDENCE_RATIO > 0.6:
    difficulty = difficulty + 1
    hint_frequency = max(0, hint_frequency - 1)
  ELIF FRUSTRATION_RATIO > 0.4:
    suggest_break = True
    difficulty = difficulty - 0.5
  ELSE:
    // maintain current difficulty
```

### 2. Pace Control Algorithm

```
Input: Question completion time vs. emotion state
Output: Adjusted time limits for next questions

slow_down_threshold = 120% of average time
speed_up_threshold = 60% of average time

IF avg_time > slow_down_threshold AND confusion_detected:
  next_time_limit = current_time_limit * 1.3
  show_hints = True
ELIF avg_time < speed_up_threshold AND confident_emotion:
  next_time_limit = current_time_limit * 0.8
  show_hints = False
```

### 3. Module Progress Calculation

```
OVERALL_PROGRESS = (
  (correct_answers / total_questions) * 0.5 +
  (average_emotion_confidence) * 0.3 +
  (completion_time_efficiency) * 0.2
) * 100

Module completion unlocked when: OVERALL_PROGRESS >= 70%
Next module auto-recommended when: OVERALL_PROGRESS >= 85%
```

### 4. Achievement & Streak System

```
STREAK = consecutive days of learning activity
ACHIEVEMENT = unlock when:
  - Quiz Score > 80% (Perfect Score)
  - Emotion stability (low frustration) (Zen Master)
  - Complete module in < expected time (Speed Learner)
  - 7+ day streak (Consistent Learner)
```

---

## Prerequisites & Setup

### System Requirements
- **Node.js:** 18.x or 20.x
- **Python:** 3.9+ (optional, for emotion detection service)
- **MongoDB:** 5.0+ (local or Atlas cloud)
- **Git:** For version control
- **Browser:** Chrome/Firefox/Edge with webcam support

### Installation Steps

#### 1. Clone Repository
```powershell
git clone https://github.com/YOUR_USERNAME/Emotion-Responsive-E-Learning-for-Inclusive-Education.git
cd emotionapp
```

#### 2. Install Backend Dependencies
```powershell
cd emolearn/backend
npm install
```

#### 3. Install Frontend Dependencies
```powershell
cd ../frontend
npm install
```

#### 4. Install Python Service Dependencies (Optional)
```powershell
cd ../python-service
pip install -r requirements.txt
```

---

## Configuration

### Backend Configuration (`.env`)

Create `emolearn/backend/.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/emolearn
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=http://localhost:3000
PYTHON_SERVICE_URL=http://localhost:8000
```

**For MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/emolearn?retryWrites=true&w=majority
```

### Frontend Configuration (`.env`)

Create `emolearn/frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WEBSOCKET_URL=ws://localhost:5000
REACT_APP_PYTHON_SERVICE_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
```

### Python Service Configuration (`.env`)

Create `emolearn/python-service/.env`:
```env
ENVIRONMENT=development
BACKEND_API_URL=http://localhost:5000
PORT=8000
```

---

## Running the Project

### Start All Services (Recommended)

#### Option A: Using PowerShell Scripts
```powershell
cd c:\Users\HARDIKA RAUT\emotionapp\emolearn

# Start backend
.\start-backend.ps1

# In a new terminal, start frontend
.\start-frontend.ps1

# In another terminal, start Python service (optional)
.\start-python-service.ps1
```

#### Option B: Manual Start

**Terminal 1 - Backend:**
```powershell
cd emolearn/backend
npm run dev
# Should output: Server running on http://localhost:5000
```

**Terminal 2 - Frontend:**
```powershell
cd emolearn/frontend
npm start
# Should output: Compiled successfully! App running on http://localhost:3000
```

**Terminal 3 - Python Service (Optional):**
```powershell
cd emolearn/python-service
python -m uvicorn main:app --reload --port 8000
# Should output: Uvicorn running on http://127.0.0.1:8000
```

### Verify All Services Running

Open browser and check:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/health
- Python Service: http://localhost:8000/docs

---

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure-password",
  "role": "student" | "teacher" | "admin"
}

Response: { "token": "jwt-token", "user": { "id", "name", "email", "role" } }
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure-password"
}

Response: { "token": "jwt-token", "user": { ... } }
```

### Progress Routes (`/api/progress`)

#### Get Student Progress
```http
GET /api/progress/:userId
Authorization: Bearer <jwt-token>

Response: {
  "userId": "...",
  "overallProgress": 65.5,
  "subjectProgress": [
    { "subjectId": "...", "progress": 75, "modulesCompleted": 3 },
    ...
  ]
}
```

#### Update Progress
```http
POST /api/progress/:userId/update
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "moduleId": "...",
  "action": "quiz_complete" | "lesson_view" | "question_answered",
  "score": 85,
  "timeTaken": 120
}

Response: { "success": true, "newProgress": 72.3 }
```

### Emotion Routes (`/api/emotions`)

#### Log Emotion
```http
POST /api/emotions/log
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "userId": "...",
  "moduleId": "...",
  "emotion": "confused" | "frustrated" | "confident" | "bored",
  "confidence": 0.85,
  "timestamp": "2025-11-21T10:30:00Z"
}

Response: { "success": true, "emotionId": "..." }
```

#### Get Emotion Analytics
```http
GET /api/emotions/analytics/:userId
Authorization: Bearer <jwt-token>

Response: {
  "userId": "...",
  "totalEmotions": 245,
  "emotionDistribution": {
    "confident": 40,
    "engaged": 35,
    "confused": 15,
    "frustrated": 10
  },
  "averageEngagement": 82.5
}
```

### Admin Routes (`/api/admin`)

#### Get Dashboard Data
```http
GET /api/admin/dashboard
Authorization: Bearer <jwt-token> (admin only)

Response: {
  "totalStudents": 145,
  "averageProgress": 68.3,
  "studentsNeedingHelp": [
    { "userId": "...", "name": "...", "progress": 35, "lastActive": "2h ago" },
    ...
  ],
  "topEmotions": { "confident": 45%, "frustrated": 20%, ... }
}
```

---

## WebSocket Events

### Real-Time Progress Updates

**Frontend connects:**
```javascript
const socket = io('http://localhost:5000');

// Receive updates
socket.on('progress-updated', (data) => {
  console.log(`Student ${data.userId} progress: ${data.progress}%`);
});

socket.on('emotion-detected', (data) => {
  console.log(`Emotion: ${data.emotion} (confidence: ${data.confidence})`);
});
```

**Backend emits:**
```javascript
broadcastStudentProgressUpdate(userId);  // notifies admin dashboard
broadcastProgressUpdate(userId);         // notifies student
broadcastEmotionDetection(userId, emotionData); // real-time emotion
```

### Connection Events
```
'connection'      - Client connects to WebSocket server
'student-join'    - Student starts taking quiz/lesson
'student-leave'   - Student finishes or disconnects
'disconnect'      - Client disconnects
```

---

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "student" | "teacher" | "admin",
  createdAt: Date,
  lastLogin: Date,
  isActive: Boolean
}
```

### Progress Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  subjectId: ObjectId (ref: subjects),
  overallProgress: Number (0-100),
  quizzesTaken: Number,
  lessonsViewed: Number,
  averageScore: Number,
  lastUpdated: Date,
  streakDays: Number
}
```

### SubjectProgressDetails Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  moduleId: ObjectId,
  moduleNumber: Number,
  status: "in-progress" | "completed" | "locked",
  score: Number,
  completionTime: Number (seconds),
  emotionState: String,
  lastAccessed: Date,
  attempts: Number
}
```

### Emotions Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  moduleId: ObjectId,
  emotion: "confused" | "frustrated" | "confident" | "bored",
  confidence: Number (0-1),
  emotionScores: {
    joy: 0.1,
    sadness: 0.05,
    anger: 0.02,
    fear: 0.15,  // confused
    surprise: 0.08,
    neutral: 0.6,
    disgust: 0.0
  },
  timestamp: Date
}
```

### Subjects Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  modules: [ObjectId],  // ref: modules
  createdBy: ObjectId,  // ref: users (teacher/admin)
  createdAt: Date
}
```

### Modules Collection
```javascript
{
  _id: ObjectId,
  moduleNumber: Number,
  title: String,
  content: String,
  questions: [
    {
      id: String,
      text: String,
      type: "multiple-choice" | "short-answer" | "essay",
      options: [String],
      correctAnswer: String,
      difficulty: Number (1-5)
    }
  ],
  subjectId: ObjectId,
  estimatedTime: Number (minutes)
}
```

---

## Deployment

See **[GITHUB_DEPLOYMENT_GUIDE.md](./GITHUB_DEPLOYMENT_GUIDE.md)** for detailed deployment instructions.

### Quick Deploy to Production

**Frontend → Vercel:**
```powershell
# Push to GitHub main branch
git push origin main

# Vercel auto-deploys on push
# Visit: https://your-project.vercel.app
```

**Backend → Railway:**
```powershell
# Push to GitHub main branch (same)
# Railway auto-deploys
# Backend available at: https://your-backend.railway.app
```

**Python Service → Railway:**
```powershell
# Add to same Railway project
# Auto-deploys
# Available at: https://your-python-service.railway.app
```

---

## Troubleshooting

### Issue: Emotion Detection Not Working
**Symptom:** Webcam is enabled but emotion scores not updating.

**Solution:**
1. Check browser console for errors (`F12`)
2. Verify webcam permissions granted in browser
3. Ensure TensorFlow.js models are loaded (check Network tab)
4. Test with Chrome/Firefox (Edge may have different permissions)

### Issue: Backend Won't Start
**Symptom:** `npm start` fails with "Port 5000 in use" or connection error.

**Solution:**
```powershell
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change PORT in .env to 5001
```

### Issue: MongoDB Connection Failed
**Symptom:** "MongooseError: connect ECONNREFUSED 127.0.0.1:27017"

**Solution:**
```powershell
# Check MongoDB is running
mongod --version

# Start MongoDB
mongod

# Or use MongoDB Atlas: update MONGODB_URI in .env
```

### Issue: WebSocket Connection Timeout
**Symptom:** Real-time updates don't appear on dashboard.

**Solution:**
1. Verify backend is running: `http://localhost:5000/api/health`
2. Check CORS_ORIGIN in `.env` matches frontend URL
3. Ensure WebSocket port (5000) is not blocked by firewall
4. Check browser console for connection errors

### Issue: JWT Token Expired
**Symptom:** "Unauthorized" errors after logging in.

**Solution:**
1. Token expires after 24 hours by default
2. Log out and log back in to get new token
3. Or extend token expiry in backend: `jwt.sign(..., { expiresIn: '7d' })`

---

## Performance Tips

- **Frontend:** Use React DevTools Profiler to identify slow components
- **Backend:** Enable request logging with Morgan, use indexing in MongoDB
- **Database:** Create indexes on frequently queried fields (`userId`, `moduleId`)
- **Deployment:** Use CDN for static assets, cache emotion model files

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT License — See LICENSE file for details.

---

## Support & Contact

For questions or issues:
- Email: support@emolearn.app
- GitHub Issues: [Report a bug](https://github.com/hardikavijaykumarraut-lab/Emotion-Responsive-E-Learning-for-Inclusive-Education/issues)
- Documentation: [GITHUB_DEPLOYMENT_GUIDE.md](./GITHUB_DEPLOYMENT_GUIDE.md)
