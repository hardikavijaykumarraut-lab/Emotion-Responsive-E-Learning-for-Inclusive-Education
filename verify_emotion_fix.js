// Verify that the emotion fix is correct
const fs = require('fs');
const path = require('path');

console.log('Verifying emotion value consistency...\n');

// Check Python service emotion values
const pythonServicePath = path.join(__dirname, 'emolearn', 'python-service', 'main.py');
const backendModelPath = path.join(__dirname, 'emolearn', 'backend', 'models', 'Emotion.js');

const checks = [
  {
    name: 'Python service EMOTIONS array',
    file: pythonServicePath,
    pattern: "['angry', 'disgust', 'fear', 'happy', 'sad', 'surprised', 'neutral', 'confused']",
    description: 'Should use "surprised" not "surprise"'
  },
  {
    name: 'Python service emotion_weights',
    file: pythonServicePath,
    pattern: "'surprised': 0.10",
    description: 'Should use "surprised" not "surprise"'
  },
  {
    name: 'Backend emotion model enum',
    file: backendModelPath,
    pattern: "['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral', 'confused']",
    description: 'Should use "surprised" not "surprise"'
  }
];

let allFound = true;
checks.forEach(check => {
  try {
    const content = fs.readFileSync(check.file, 'utf8');
    if (content.includes(check.pattern)) {
      console.log(`✓ ${check.name} - Correct`);
    } else {
      console.log(`✗ ${check.name} - Incorrect`);
      console.log(`  Expected: ${check.pattern}`);
      console.log(`  Description: ${check.description}`);
      allFound = false;
    }
  } catch (error) {
    console.log(`✗ ${check.name} - Error reading file: ${error.message}`);
    allFound = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allFound) {
  console.log('🎉 All emotion values are consistent!');
  console.log('\nTo test the fix:');
  console.log('1. Restart the Python emotion detection service');
  console.log('2. Start the backend server');
  console.log('3. Test emotion detection in the frontend');
  console.log('4. Verify that no "Invalid emotion value" errors appear');
} else {
  console.log('❌ Some emotion values are inconsistent. Please review the implementation.');
}