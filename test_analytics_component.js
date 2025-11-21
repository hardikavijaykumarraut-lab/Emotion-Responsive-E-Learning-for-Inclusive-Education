// Simple test to verify the analytics component structure
const fs = require('fs');
const path = require('path');

// Read the AnalyticsSection component
const componentPath = path.join(__dirname, 'emolearn', 'frontend', 'src', 'pages', 'AdminPage', 'sections', 'AnalyticsSection.js');
const componentContent = fs.readFileSync(componentPath, 'utf8');

// Check for key elements that should be present
const checks = [
  { name: 'Engagement Rate calculation', pattern: /engagementRate/ },
  { name: 'Active Students tracking', pattern: /activeStudents/ },
  { name: 'Insights section', pattern: /insights/ },
  { name: 'Recommendations section', pattern: /recommendations/ },
  { name: 'Engagement Trends chart', pattern: /engagementTrends/ },
  { name: 'Emotion Distribution chart', pattern: /emotionDistribution/ }
];

console.log('Testing AnalyticsSection component...\n');

let allPassed = true;
checks.forEach(check => {
  const found = componentContent.match(check.pattern);
  if (found) {
    console.log(`✓ ${check.name} - Found`);
  } else {
    console.log(`✗ ${check.name} - Not found`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✓ All checks passed! The component appears to be correctly implemented.');
} else {
  console.log('✗ Some checks failed. Please review the component implementation.');
}