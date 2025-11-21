// Verify that analytics fixes are in place
const fs = require('fs');
const path = require('path');

console.log('Verifying analytics section fixes...\n');

// Check if the analytics section has real-time updates
const analyticsSectionPath = path.join(__dirname, 'emolearn', 'frontend', 'src', 'pages', 'AdminPage', 'sections', 'AnalyticsSection.js');
const dashboardSectionPath = path.join(__dirname, 'emolearn', 'frontend', 'src', 'pages', 'AdminPage', 'sections', 'DashboardSection.js');
const adminAnalyticsServicePath = path.join(__dirname, 'emolearn', 'frontend', 'src', 'services', 'adminAnalyticsService.js');

const checks = [
  {
    name: 'Analytics section imports subscribeToRealtimeUpdates',
    file: analyticsSectionPath,
    pattern: /import.*adminAnalyticsService/,
    description: 'Should import adminAnalyticsService for real-time updates'
  },
  {
    name: 'Analytics section uses useEffect with real-time updates',
    file: analyticsSectionPath,
    pattern: /subscribeToRealtimeUpdates/,
    description: 'Should subscribe to real-time updates like dashboard section'
  },
  {
    name: 'Analytics section has updateStudent function',
    file: analyticsSectionPath,
    pattern: /const updateStudent = useCallback/,
    description: 'Should have updateStudent function for real-time updates'
  },
  {
    name: 'Analytics section has addEmotion function',
    file: analyticsSectionPath,
    pattern: /const addEmotion = useCallback/,
    description: 'Should have addEmotion function for real-time updates'
  },
  {
    name: 'Backend route has debugging logs',
    file: path.join(__dirname, 'emolearn', 'backend', 'routes', 'adminAnalytics.js'),
    pattern: /console\.log\('Dashboard stats request received'/,
    description: 'Should have debugging for backend route'
  }
];

let allFound = true;
checks.forEach(check => {
  try {
    const content = fs.readFileSync(check.file, 'utf8');
    if (content.includes(check.pattern) || content.match(check.pattern)) {
      console.log(`✓ ${check.name} - Found`);
    } else {
      console.log(`✗ ${check.name} - Not found`);
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
  console.log('🎉 All analytics fixes verified!');
  console.log('\nTo test the fixes:');
  console.log('1. Start the application');
  console.log('2. Log in as admin and navigate to Analytics section');
  console.log('3. Log in as student and make progress');
  console.log('4. Observe that analytics section updates in real-time');
  console.log('5. Check browser console for debugging messages');
  console.log('6. Check server logs for backend debugging');
} else {
  console.log('❌ Some fixes are missing. Please review the implementation.');
}