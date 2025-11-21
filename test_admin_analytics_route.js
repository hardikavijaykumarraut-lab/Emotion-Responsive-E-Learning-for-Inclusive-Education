// Simple test to verify the admin analytics route
const fs = require('fs');
const path = require('path');

// Read the admin analytics route
const routePath = path.join(__dirname, 'emolearn', 'backend', 'routes', 'adminAnalytics.js');
const routeContent = fs.readFileSync(routePath, 'utf8');

// Check for key elements that should be present
const checks = [
  { name: 'Dashboard stats route', pattern: /dashboard-stats/ },
  { name: 'Total students calculation', pattern: /totalStudents/ },
  { name: 'Active students calculation', pattern: /activeStudents/ },
  { name: 'Average progress calculation', pattern: /avgProgress/ },
  { name: 'Emotion distribution calculation', pattern: /emotionDistribution/ },
  { name: 'Recent emotions query', pattern: /recentEmotions/ }
];

console.log('Testing Admin Analytics route...\n');

let allPassed = true;
checks.forEach(check => {
  const found = routeContent.match(check.pattern);
  if (found) {
    console.log(`✓ ${check.name} - Found`);
  } else {
    console.log(`✗ ${check.name} - Not found`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✓ All checks passed! The route appears to be correctly implemented.');
} else {
  console.log('✗ Some checks failed. Please review the route implementation.');
}