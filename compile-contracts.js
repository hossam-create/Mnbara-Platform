const {  execSync } = require('child_process');
const path = require('path');

// Compile each contract separately to avoid cross-version conflicts
const contracts = [
  'MNBToken',
  'MNBExchange',
  'MNBWallet',
  'MNBStaking',
  'MNBGovernance'
];

console.log('🔨 Compiling smart contracts...\n');

try {
  // Run full compilation (Hardhat will handle versioning)
  console.log('Running hardhat compile...');
  execSync('node node_modules/hardhat/internal/cli/cli.js compile --force', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('\n✅ Compilation successful!');
  console.log('📦 Artifacts generated in ./artifacts');
  
} catch (error) {
  console.error('❌ Compilation failed');
  process.exit(1);
}
