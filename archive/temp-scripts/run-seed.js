const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Robust Seed Runner...');
console.log('========================================');

// Define paths
const serviceDir = path.join(__dirname, '../services/auth-service');
const nodeModulesBin = path.join(serviceDir, 'node_modules/.bin');
const rootNodeModulesBin = path.join(__dirname, '../node_modules/.bin');

// Find prisma executable
let prismaCmd = path.join(nodeModulesBin, 'prisma.cmd');
if (!fs.existsSync(prismaCmd)) {
  console.log('⚠️ Local prisma not found, checking root...');
  prismaCmd = path.join(rootNodeModulesBin, 'prisma.cmd');
}

if (!fs.existsSync(prismaCmd)) {
  console.error('❌ Error: Prisma binary not found!');
  process.exit(1);
}

console.log(`✅ Found Prisma: ${prismaCmd}`);

try {
  // Step 1: Generate Prisma Client
  console.log('\n📦 Step 1: Generating Prisma Client...');
  // Use quotes for path with spaces/special chars
  execSync(`"${prismaCmd}" generate`, { 
    cwd: serviceDir, 
    stdio: 'inherit',
    shell: true 
  });
  console.log('✅ Prisma Client Generated');

  // Step 2: Run Seed
  console.log('\n🌱 Step 2: Running Seed Script...');
  const seedFile = path.join(serviceDir, 'prisma/seeds/ebay-categories.seed.js');
  
  if (!fs.existsSync(seedFile)) {
    console.error(`❌ Error: Seed file not found at ${seedFile}`);
    process.exit(1);
  }

  // Run node directly on the JS seed file
  execSync(`node "${seedFile}"`, { 
    cwd: serviceDir, 
    stdio: 'inherit',
    shell: true 
  });
  
  console.log('\n========================================');
  console.log('🎉 Success! Database seeded.');
  console.log('========================================');

} catch (error) {
  console.error('\n❌ Fatal Error during execution:');
  console.error(error.message);
  process.exit(1);
}
