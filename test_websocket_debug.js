// Simple test to verify WebSocket debugging is working
const fs = require('fs');
const path = require('path');

console.log('Testing WebSocket debugging setup...\n');

// Check if debugging logs are present in the files
const filesToCheck = [
  {
    name: 'Backend Realtime Service',
    path: path.join(__dirname, 'emolearn', 'backend', 'services', 'realtimeService.js'),
    patterns: [
      "console.log('Broadcasting progress update for user'",
      "console.log('Broadcasting new emotion'",
      "console.log('Broadcasting message to admin clients'",
      "console.log('Broadcasting message to student'"
    ]
  },
  {
    name: 'Progress Route',
    path: path.join(__dirname, 'emolearn', 'backend', 'routes', 'progress.js'),
    patterns: [
      "console.log('Broadcasting progress updates for user'"
    ]
  },
  {
    name: 'Emotions Route',
    path: path.join(__dirname, 'emolearn', 'backend', 'routes', 'emotions.js'),
    patterns: [
      "console.log('Broadcasting emotion updates for user'"
    ]
  },
  {
    name: 'Student Dashboard',
    path: path.join(__dirname, 'emolearn', 'frontend', 'src', 'pages', 'StudentDashboard', 'StudentDashboard.js'),
    patterns: [
      "console.log('Setting up WebSocket connection for student'",
      "console.log('Received PROGRESS_UPDATE message'",
      "console.log('Received INITIAL_STUDENT_DATA message'"
    ]
  }
];

let allPassed = true;
filesToCheck.forEach(fileCheck => {
  try {
    const content = fs.readFileSync(fileCheck.path, 'utf8');
    console.log(`Checking ${fileCheck.name}...`);
    
    fileCheck.patterns.forEach(pattern => {
      if (content.includes(pattern)) {
        console.log(`  ✓ Found debug log: ${pattern.substring(0, 50)}...`);
      } else {
        console.log(`  ✗ Missing debug log: ${pattern}`);
        allPassed = false;
      }
    });
  } catch (error) {
    console.log(`  ✗ Error reading ${fileCheck.name}: ${error.message}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✓ All debug logs are in place! You can now check the browser console and server logs to debug the WebSocket issues.');
} else {
  console.log('✗ Some debug logs are missing. Please review the implementation.');
}