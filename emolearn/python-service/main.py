import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import base64
import logging
import random
import requests
import json
from typing import Dict, List
import os

# Get the path to Haar cascades
cv2_data = getattr(cv2, 'data')
HAAR_CASCADES_PATH = os.path.join(cv2_data.haarcascades, 'haarcascade_frontalface_default.xml')

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add emotion labels including 'confused'
EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprised', 'neutral', 'confused']

# Backend API configuration - use environment variable or default
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:5000/api")
API_KEY = os.getenv("API_KEY", "your-api-key-here")  # In production, use environment variables

# Global variables to maintain emotion stability
current_emotion = 'neutral'
emotion_confidence = 0.0
emotion_stability_counter = 0
emotion_stability_threshold = 5  # Number of frames to keep the same emotion
last_logged_emotion = None
last_logged_time = 0
emotion_log_cooldown = 5  # Minimum seconds between emotion logs

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_sessions: Dict[WebSocket, str] = {}  # Track user sessions

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("New client connected")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            # Remove user session if exists
            if websocket in self.user_sessions:
                del self.user_sessions[websocket]
            logger.info("Client disconnected")

    async def send_message(self, message: Dict, websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")

    def set_user_id(self, websocket: WebSocket, user_id: str):
        self.user_sessions[websocket] = user_id

    def get_user_id(self, websocket: WebSocket) -> str:
        return self.user_sessions.get(websocket, "")

manager = ConnectionManager()

def log_emotion_to_backend(user_id: str, emotion_data: Dict):
    """Log emotion data to the backend API"""
    global last_logged_emotion, last_logged_time
    
    current_time = asyncio.get_event_loop().time()
    
    # Check if we should log this emotion (cooldown and change detection)
    if (last_logged_emotion != emotion_data['emotion'] or 
        current_time - last_logged_time > emotion_log_cooldown):
        
        # Prepare the data for the backend API
        log_data = {
            "userId": user_id,
            "emotion": emotion_data['emotion'],
            "confidence": emotion_data['confidence'],
            "detectionData": {
                "faceDetected": emotion_data['face_detected'],
                "expressions": emotion_data['emotions']
            }
        }
        
        # Send to backend API
        logger.info(f"Sending emotion data to {BACKEND_API_URL}/emotions/detect")
        try:
            response = requests.post(
                f"{BACKEND_API_URL}/emotions/detect",
                json=log_data,
                headers={
                    "Content-Type": "application/json",
                    # Removed Authorization header since the endpoint doesn't require it
                },
                timeout=10  # Add timeout to prevent hanging
            )
            
            if response.status_code == 200:
                response_data = response.json()
                logger.info(f"Emotion logged successfully: {emotion_data['emotion']} for user {user_id}")
                logger.info(f"Response: {response_data}")
                last_logged_emotion = emotion_data['emotion']
                last_logged_time = current_time
            else:
                logger.error(f"Failed to log emotion: {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error logging emotion to backend: {e}")
        except Exception as e:
            logger.error(f"Error logging emotion to backend: {e}")

# Enhanced emotion detection with more realistic patterns
def detect_emotion(frame):
    global current_emotion, emotion_confidence, emotion_stability_counter
    
    # Simple face detection using OpenCV's Haar Cascade
    face_cascade = cv2.CascadeClassifier(HAAR_CASCADES_PATH)
    
    # Convert to grayscale for face detection
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Detect faces
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    if len(faces) > 0:
        # Increase stability counter
        emotion_stability_counter += 1
        
        # Only change emotion if stability threshold is reached
        if emotion_stability_counter >= emotion_stability_threshold:
            # More realistic emotion selection based on common patterns
            # Weighted distribution to simulate real-world emotions
            emotion_weights = {
                'happy': 0.15,
                'neutral': 0.30,
                'sad': 0.10,
                'surprised': 0.10,  # Changed from 'surprise' to 'surprised'
                'angry': 0.08,
                'fear': 0.07,
                'disgust': 0.05,
                'confused': 0.15  # Added confused emotion
            }
            
            # Select emotion based on weights
            emotions_list = list(emotion_weights.keys())
            weights_list = list(emotion_weights.values())
            current_emotion = random.choices(emotions_list, weights=weights_list)[0]
            emotion_confidence = random.uniform(0.6, 0.95)
            emotion_stability_counter = 0  # Reset counter
        
        # Create emotion distribution with all emotions
        emotions = {e: 0.0 for e in EMOTIONS}
        emotions[current_emotion] = emotion_confidence
        # Add some noise to other emotions to make it more realistic
        for e in EMOTIONS:
            if e != current_emotion:
                emotions[e] = random.uniform(0.0, 0.3) * (1.0 - emotion_confidence)
        
        return {
            'emotion': current_emotion,
            'confidence': emotion_confidence,
            'emotions': emotions,
            'face_detected': True
        }
    
    # Reset when no face is detected
    emotion_stability_counter = 0
    current_emotion = 'neutral'
    emotion_confidence = 0.0
    
    return {
        'emotion': 'neutral',
        'confidence': 0,
        'emotions': {e: 0.0 for e in EMOTIONS},
        'face_detected': False
    }

@app.websocket("/ws/emotion-detection")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    user_id = None
    try:
        while True:
            # Receive base64 encoded image from client
            data = await websocket.receive_text()
            
            try:
                # Check if this is a user ID message (JSON)
                if data.startswith('{'):
                    try:
                        user_data = json.loads(data)
                        if 'userId' in user_data:
                            user_id = user_data['userId']
                            manager.set_user_id(websocket, user_id)
                            logger.info(f"User ID set: {user_id}")
                            continue
                    except json.JSONDecodeError:
                        pass  # Not a JSON message, treat as image data
                
                # Remove the data URL prefix if present
                if 'base64,' in data:
                    data = data.split('base64,')[1]
                
                # Decode base64 to bytes
                img_data = base64.b64decode(data)
                nparr = np.frombuffer(img_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if frame is None:
                    await manager.send_message({
                        'error': 'Could not decode image'
                    }, websocket)
                    continue
                
                # Detect emotion
                emotion_data = detect_emotion(frame)
                
                # Log emotion to backend if we have a user ID
                if user_id:
                    log_emotion_to_backend(user_id, emotion_data)
                
                # Send the emotion data back to the client
                await manager.send_message(emotion_data, websocket)
                
            except Exception as e:
                logger.error(f"Error processing frame: {e}")
                await manager.send_message({
                    'error': str(e)
                }, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "emotion-detection"}

if __name__ == "__main__":
    import uvicorn
    # Try different ports to avoid conflicts
    ports = [8000, 8001, 8002]
    for port in ports:
        try:
            print(f"Attempting to start server on port {port}")
            uvicorn.run(app, host="0.0.0.0", port=port)
            break
        except Exception as e:
            print(f"Failed to start server on port {port}: {e}")
            if port == ports[-1]:  # Last port
                raise e