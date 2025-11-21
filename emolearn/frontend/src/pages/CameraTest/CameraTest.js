import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import PythonFaceDetection from '../../components/FaceDetection/PythonFaceDetection';

const CameraTest = () => {
  const handleEmotionDetected = (emotionData) => {
    console.log('Detected emotion:', emotionData);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
      </Typography>
      
      <Typography paragraph>
        This is a test page to verify that your camera is working correctly with the emotion detection system.
      </Typography>
      
      <Box sx={{ mt: 4, mb: 4 }}>
        <PythonFaceDetection 
          onEmotionDetected={handleEmotionDetected} 
          onFaceDetected={(hasFace) => console.log('Face detected:', hasFace)}
        />
      </Box>
      
      <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>Instructions:</Typography>
        <ol>
          <li>Click "Start Camera" to enable your webcam</li>
          <li>Allow camera permissions if prompted</li>
          <li>Make sure your face is well-lit and visible</li>
          <li>The system will detect your face and emotions in real-time</li>
        </ol>
      </Box>
    </Container>
  );
};

export default CameraTest;
