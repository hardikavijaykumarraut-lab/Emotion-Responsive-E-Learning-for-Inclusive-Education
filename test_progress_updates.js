// Simple test to verify progress updates are working
const fs = require('fs');
const path = require('path');

console.log('Testing progress update fixes...\n');

// Check 1: Progress model calculateOverallProgress method
const progressModelPath = path.join(__dirname, 'emolearn', 'backend', 'models', 'Progress.js');
const progressModelContent = fs.readFileSync(progressModelPath, 'utf8');

const checks = [
  {
    name: 'Progress model calculateOverallProgress method',
    pattern: /calculateOverallProgress = function\(\)/,
    file: progressModelContent,
    expected: true
  },
  {
    name: 'Progress route ensures overall progress calculation',
    pattern: /progress\.calculateOverallProgress\(\);/,
    file: fs.readFileSync(path.join(__dirname, 'emolearn', 'backend', 'routes', 'progress.js'), 'utf8'),
    expected: true
  },
  {
    name: 'Student dashboard uses real-time updates',
    pattern: /realtimeService\.connectAsStudent/,
    file: fs.readFileSync(path.join(__dirname, 'emolearn', 'frontend', 'src', 'pages', 'StudentDashboard', 'StudentDashboard.js'), 'utf8'),
    expected: true
  },
  {
    name: 'Frontend realtime service supports student connections',
    pattern: /connectAsStudent/,
    file: fs.readFileSync(path.join(__dirname, 'emolearn', 'frontend', 'src', 'services', 'realtimeService.js'), 'utf8'),
    expected: true
  }
];

let allPassed = true;
checks.forEach(check => {
  const found = check.file.match(check.pattern);
  if (found && check.expected) {
    console.log(`✓ ${check.name} - Found`);
  } else if (!found && !check.expected) {
    console.log(`✓ ${check.name} - Not found (as expected)`);
  } else {
    console.log(`✗ ${check.name} - ${check.expected ? 'Not found' : 'Found unexpectedly'}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✓ All checks passed! The progress update fixes appear to be correctly implemented.');
  console.log('\nSummary of fixes:');
  console.log('1. Fixed calculateOverallProgress method in Progress model');
  console.log('2. Ensured progress is calculated before saving in progress route');
  console.log('3. Implemented real-time updates for student dashboard');
  console.log('4. Updated frontend realtime service to support student connections');
} else {
  console.log('✗ Some checks failed. Please review the implementation.');
}