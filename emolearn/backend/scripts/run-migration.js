// This script runs database migrations
const { execFile } = require('child_process');
const path = require('path');

console.log('Running database migrations...');

// Run the overall progress migration
const migrationPath = path.join(__dirname, 'migrations', 'add-overall-progress.js');
console.log('\nRunning migration: Add overallProgress field to Progress model');

// Use execFile instead of exec to handle paths with spaces
const child = execFile(
  'node',
  [migrationPath],
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running migration: ${error}`);
      return;
    }
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    if (!error) {
      console.log('\nAll migrations completed successfully!');
    }
  }
);
