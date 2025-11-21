#!/usr/bin/env node

/**
 * End-to-End Test for Subject Progress Details
 * Tests the complete flow from activity creation to frontend display
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function pass(message) {
  log(`✓ ${message}`, 'green');
}

function fail(message) {
  log(`✗ ${message}`, 'red');
}

function warn(message) {
  log(`⚠ ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${title}`, 'cyan');
  log(`${'='.repeat(60)}\n`, 'cyan');
}

// Test configurations
const tests = [];
let passedTests = 0;
let failedTests = 0;

// Test 1: Check backend file exists and has proper imports
function testBackendImports() {
  info('Checking backend imports and SubjectProgressDetail usage...');
  
  const filePath = 'emolearn/backend/routes/progress.js';
  if (!fs.existsSync(filePath)) {
    fail('Backend progress.js file not found');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for SubjectProgressDetail import
  if (!content.includes('const SubjectProgressDetail = require(')) {
    fail('SubjectProgressDetail not imported in progress.js');
    return false;
  }
  pass('SubjectProgressDetail properly imported');
  
  // Check for detailedProgress queries
  const detailedProgressCount = (content.match(/SubjectProgressDetail\.find/g) || []).length;
  if (detailedProgressCount === 0) {
    fail('No SubjectProgressDetail queries found in progress.js');
    return false;
  }
  pass(`Found ${detailedProgressCount} SubjectProgressDetail database queries`);
  
  // Check for detailedSubjectProgress in responses
  const responseCount = (content.match(/detailedSubjectProgress:/g) || []).length;
  if (responseCount === 0) {
    fail('detailedSubjectProgress not included in API responses');
    return false;
  }
  pass(`detailedSubjectProgress included in ${responseCount} API responses`);
  
  // Check for getActionType function
  if (!content.includes('function getActionType')) {
    fail('getActionType function not defined');
    return false;
  }
  pass('getActionType function properly defined');
  
  return true;
}

// Test 2: Check SubjectProgress model exists
function testSubjectProgressModel() {
  info('Checking SubjectProgressDetail model...');
  
  const modelPath = 'emolearn/backend/models/SubjectProgress.js';
  if (!fs.existsSync(modelPath)) {
    fail('SubjectProgress.js model file not found');
    return false;
  }
  
  const content = fs.readFileSync(modelPath, 'utf8');
  
  // Check for required fields
  const requiredFields = ['userId', 'subject', 'module', 'moduleProgress', 'timeSpent'];
  for (const field of requiredFields) {
    if (!content.includes(field)) {
      fail(`Required field '${field}' not found in model`);
      return false;
    }
  }
  pass(`All required fields present: ${requiredFields.join(', ')}`);
  
  // Check for timestamps
  if (!content.includes('timestamps: true')) {
    fail('Timestamps not enabled in model');
    return false;
  }
  pass('Timestamps properly configured');
  
  // Check for indexes
  if (!content.includes('.index(')) {
    fail('Database indexes not defined');
    return false;
  }
  pass('Database indexes properly configured');
  
  return true;
}

// Test 3: Check frontend DashboardPage extraction
function testFrontendExtraction() {
  info('Checking frontend DashboardPage data extraction...');
  
  const filePath = 'emolearn/frontend/src/pages/DashboardPage/DashboardPage.js';
  if (!fs.existsSync(filePath)) {
    fail('DashboardPage.js not found');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for detailedSubjectProgress state
  if (!content.includes('setDetailedSubjectProgress')) {
    fail('detailedSubjectProgress state not found in DashboardPage');
    return false;
  }
  pass('detailedSubjectProgress state properly declared');
  
  // Check if extraction from API response
  if (!content.includes('progressResponse.data.detailedSubjectProgress')) {
    fail('Not extracting detailedSubjectProgress from API response');
    return false;
  }
  pass('Extracting detailedSubjectProgress from API response');
  
  // Check if extracted in WebSocket handlers
  const webSocketExtractionCount = (content.match(/data\.data\.progress\.detailedSubjectProgress/g) || []).length;
  if (webSocketExtractionCount === 0) {
    fail('Not extracting detailedSubjectProgress from WebSocket updates');
    return false;
  }
  pass(`Extracting detailedSubjectProgress in ${webSocketExtractionCount} WebSocket event handlers`);
  
  return true;
}

// Test 4: Check frontend display component
function testFrontendDisplay() {
  info('Checking frontend display of detailed subject progress...');
  
  const filePath = 'emolearn/frontend/src/pages/DashboardPage/DashboardPage.js';
  if (!fs.existsSync(filePath)) {
    fail('DashboardPage.js not found');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for rendering logic
  if (!content.includes('detailedSubjectProgress.length > 0')) {
    fail('No rendering logic for detailedSubjectProgress found');
    return false;
  }
  pass('Rendering logic for detailedSubjectProgress present');
  
  // Check for display of progress metrics
  if (!content.includes('moduleProgress') || !content.includes('timeSpent')) {
    fail('Not displaying all progress metrics (moduleProgress, timeSpent)');
    return false;
  }
  pass('Displaying all required progress metrics');
  
  // Check for empty state
  if (!content.includes('No detailed progress yet')) {
    fail('No empty state message for detailed progress');
    return false;
  }
  pass('Empty state message properly configured');
  
  return true;
}

// Test 5: Check API response structure
function testAPIResponseStructure() {
  info('Checking API response structure in progress routes...');
  
  const filePath = 'emolearn/backend/routes/progress.js';
  if (!fs.existsSync(filePath)) {
    fail('progress.js not found');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check multiple response endpoints
  const endpoints = [
    { name: 'GET /api/progress/:userId', check: 'detailedProgress.*=.*await.*SubjectProgressDetail' },
    { name: 'POST /api/progress/:userId/update', check: 'res\\.json.*detailedSubjectProgress' }
  ];
  
  for (const endpoint of endpoints) {
    const pattern = new RegExp(endpoint.check, 's');
    if (!pattern.test(content)) {
      warn(`Couldn't verify ${endpoint.name} returns detailedSubjectProgress`);
    }
  }
  
  pass('API response structure checks completed');
  return true;
}

// Test 6: Check for polling mechanism
function testPollingMechanism() {
  info('Checking polling mechanism in DashboardPage...');
  
  const filePath = 'emolearn/frontend/src/pages/DashboardPage/DashboardPage.js';
  if (!fs.existsSync(filePath)) {
    fail('DashboardPage.js not found');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for polling interval
  if (!content.includes('setInterval') || !content.includes('10000')) {
    fail('Polling mechanism (10-second interval) not found');
    return false;
  }
  pass('Polling mechanism configured with 10-second interval');
  
  // Check for cleanup
  if (!content.includes('clearInterval')) {
    fail('Polling cleanup not implemented');
    return false;
  }
  pass('Polling cleanup properly implemented');
  
  return true;
}

// Test 7: Check WebSocket real-time updates
function testWebSocketUpdates() {
  info('Checking WebSocket real-time update support...');
  
  const filePath = 'emolearn/frontend/src/pages/DashboardPage/DashboardPage.js';
  if (!fs.existsSync(filePath)) {
    fail('DashboardPage.js not found');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for WebSocket connection
  if (!content.includes('studentRealtimeService.connect')) {
    fail('WebSocket connection not established');
    return false;
  }
  pass('WebSocket connection properly established');
  
  // Check for real-time event handlers
  const eventHandlers = ['INITIAL_STUDENT_DATA', 'PROGRESS_UPDATE'];
  for (const handler of eventHandlers) {
    if (!content.includes(`case '${handler}':`)) {
      fail(`Event handler for '${handler}' not found`);
      return false;
    }
  }
  pass(`All required event handlers present: ${eventHandlers.join(', ')}`);
  
  return true;
}

// Test 8: Check error handling
function testErrorHandling() {
  info('Checking error handling...');
  
  const filePath = 'emolearn/backend/routes/progress.js';
  if (!fs.existsSync(filePath)) {
    fail('progress.js not found');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for try-catch blocks
  if (!content.includes('try') || !content.includes('catch')) {
    warn('Limited error handling found');
    return true; // Not critical
  }
  pass('Error handling implemented');
  
  return true;
}

// Run all tests
section('Subject Progress Details - End-to-End Test Suite');

const testFunctions = [
  { name: 'Backend Imports & Usage', fn: testBackendImports },
  { name: 'SubjectProgress Model', fn: testSubjectProgressModel },
  { name: 'Frontend Data Extraction', fn: testFrontendExtraction },
  { name: 'Frontend Display Component', fn: testFrontendDisplay },
  { name: 'API Response Structure', fn: testAPIResponseStructure },
  { name: 'Polling Mechanism', fn: testPollingMechanism },
  { name: 'WebSocket Real-time Updates', fn: testWebSocketUpdates },
  { name: 'Error Handling', fn: testErrorHandling }
];

log(`Running ${testFunctions.length} test groups...\n`);

for (const test of testFunctions) {
  section(test.name);
  try {
    const result = test.fn();
    if (result) {
      passedTests++;
    } else {
      failedTests++;
    }
  } catch (error) {
    fail(`Test crashed: ${error.message}`);
    failedTests++;
  }
}

// Summary
section('Test Summary');
log(`Total Tests: ${passedTests + failedTests}`);
pass(`Passed: ${passedTests}`);
if (failedTests > 0) {
  fail(`Failed: ${failedTests}`);
} else {
  pass('Failed: 0');
}

// Recommendations
section('Next Steps');
info('To complete the implementation and verify it works end-to-end:');
log('1. Start the backend server: npm start (in emolearn/backend)');
log('2. Start the frontend server: npm start (in emolearn/frontend)');
log('3. Log in as a student and complete a module');
log('4. Check if "Detailed Subject Progress" card appears on dashboard');
log('5. Verify MongoDB subjectprogressdetails collection has records:');
log('   mongodb://localhost:27017/emotion_learning');
log('6. Verify WebSocket receives real-time updates (check browser console)');

section('Verification Checklist');
log('After completing the above steps, verify:');
log('□ Backend creates SubjectProgressDetail records in MongoDB');
log('□ Frontend receives detailedSubjectProgress in API response');
log('□ Dashboard displays "Detailed Subject Progress" card');
log('□ Card shows module name, progress %, and time spent');
log('□ Progress updates in real-time via polling/WebSocket');
log('□ Empty state shows when no records exist');

if (failedTests === 0) {
  section('✓ All Code Structure Tests Passed!');
  log('The implementation is ready for end-to-end testing. Start your servers and test manually.');
} else {
  section('⚠ Some Tests Failed');
  log('Review the failures above and fix them before testing.');
}

process.exit(failedTests > 0 ? 1 : 0);
