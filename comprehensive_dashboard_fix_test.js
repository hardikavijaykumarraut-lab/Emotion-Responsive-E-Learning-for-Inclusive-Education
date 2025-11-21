// Comprehensive test to verify all dashboard fixes
const fs = require('fs');
const path = require('path');

console.log('Testing comprehensive dashboard fixes...\n');

// Check all the fixes we've applied
const checks = [
  {
    name: 'Progress model calculateOverallProgress method fixed',
    file: path.join(__dirname, 'emolearn', 'backend', 'models', 'Progress.js'),
    pattern: /calculateOverallProgress = function\(\)/,
    description: 'Method should not be async since it doesn\'t use await'
  },
  {
    name: 'Progress route ensures overall progress calculation',
    file: path.join(__dirname, 'emolearn', 'backend', 'routes', 'progress.js'),
    pattern: /progress\.calculateOverallProgress\(\);/,
    description: 'Should explicitly call calculateOverallProgress before saving'
  },
  {
    name: 'Student dashboard uses real-time updates',
    file: path.join(__dirname, 'emolearn', 'frontend', 'src', 'pages', 'StudentDashboard', 'StudentDashboard.js'),
    pattern: /realtimeService\.connectAsStudent/,
    description: 'Should connect to student WebSocket endpoint'
  },
  {
    name: 'Frontend realtime service supports student connections',
    file: path.join(__dirname, 'emolearn', 'frontend', 'src', 'services', 'realtimeService.js'),
    pattern: /connectAsStudent/,
    description: 'Should have connectAsStudent method'
  },
  {
    name: 'Student dashboard has proper useEffect dependencies',
    file: path.join(__dirname, 'emolearn', 'frontend', 'src', 'pages', 'StudentDashboard', 'StudentDashboard.js'),
    pattern: /\[user, token, fetchData\]/,
    description: 'useEffect should include user, token, and fetchData in dependencies'
  },
  {
    name: 'Backend broadcast methods have debugging',
    file: path.join(__dirname, 'emolearn', 'backend', 'services', 'realtimeService.js'),
    pattern: /Broadcasting progress update for user/,
    description: 'Should have debugging for broadcast methods'
  },
  {
    name: 'Student dashboard has debugging',
    file: path.join(__dirname, 'emolearn', 'frontend', 'src', 'pages', 'StudentDashboard', 'StudentDashboard.js'),
    pattern: /Setting up WebSocket connection for student/,
    description: 'Should have debugging for WebSocket connections'
  }
];

let allPassed = true;
checks.forEach(check => {
  try {
    const content = fs.readFileSync(check.file, 'utf8');
    const found = content.includes(check.pattern) || content.match(check.pattern);
    if (found) {
      console.log(`✓ ${check.name} - Found`);
    } else {
      console.log(`✗ ${check.name} - Not found`);
      console.log(`  Description: ${check.description}`);
      allPassed = false;
    }
  } catch (error) {
    console.log(`✗ ${check.name} - Error reading file: ${error.message}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('🎉 All checks passed! The dashboard fixes appear to be correctly implemented.');
  console.log('\nSummary of fixes:');
  console.log('1. Fixed calculateOverallProgress method in Progress model');
  console.log('2. Ensured progress is calculated before saving in progress route');
  console.log('3. Implemented real-time updates for student dashboard');
  console.log('4. Updated frontend realtime service to support student connections');
  console.log('5. Fixed useEffect dependencies in student dashboard');
  console.log('6. Added debugging to backend broadcast methods');
  console.log('7. Added debugging to student dashboard WebSocket connections');
  console.log('\nNext steps:');
  console.log('- Start the application and check browser console for WebSocket messages');
  console.log('- Check server logs for broadcast debugging messages');
  console.log('- Verify that dashboards update in real-time when progress changes');
} else {
  console.log('❌ Some checks failed. Please review the implementation.');
}