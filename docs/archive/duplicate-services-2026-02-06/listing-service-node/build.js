const { execSync } = require('child_process');
const path = require('path');

try {
  // Use npx to run TypeScript compiler
  execSync('npx tsc', { stdio: 'inherit', cwd: __dirname });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}