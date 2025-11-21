// Simple verification of fixes
const fs = require('fs');
const path = require('path');

console.log('Verifying dashboard fixes...\n');

// Files to check
const filesToCheck = [
  {
    name: 'Progress Model',
    path: path.join(__dirname, 'emolearn', 'backend', 'models', 'Progress.js'),
    content: 'calculateOverallProgress = function()'
  },
  {
    name: 'Progress Route',
    path: path.join(__dirname, 'emolearn', 'backend', 'routes', 'progress.js'),
    content: 'progress.calculateOverallProgress();'
  },
  {
    name: 'Student Dashboard',
    path: path.join(__dirname, 'emolearn', 'frontend', 'src', 'pages', 'StudentDashboard', 'StudentDashboard.js'),
    content: 'realtimeService.connectAsStudent'
  },
  {
    name: 'Realtime Service',
    path: path.join(__dirname, 'emolearn', 'frontend', 'src', 'services', 'realtimeService.js'),
    content: 'connectAsStudent'
  },
  {
    name: 'UseEffect Dependencies',
    path: path.join(__dirname, 'emolearn', 'frontend', 'src', 'pages', 'StudentDashboard', 'StudentDashboard.js'),
    content: '[user, token, fetchData]'
  }
];

let allFound = true;
filesToCheck.forEach(check => {
  try {
    const content = fs.readFileSync(check.path, 'utf8');
    if (content.includes(check.content)) {
      console.log(`✓ ${check.name} - Found "${check.content}"`);
    } else {
      console.log(`✗ ${check.name} - Missing "${check.content}"`);
      allFound = false;
    }
  } catch (error) {
    console.log(`✗ ${check.name} - Error: ${error.message}`);
    allFound = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allFound) {
  console.log('🎉 All fixes verified! The dashboard should now update properly.');
  console.log('\nTo debug further:');
  console.log('1. Check browser console for WebSocket messages');
  console.log('2. Check server logs for broadcast debugging');
  console.log('3. Verify real-time updates when progress changes');
} else {
  console.log('❌ Some fixes are missing. Please review the implementation.');
}