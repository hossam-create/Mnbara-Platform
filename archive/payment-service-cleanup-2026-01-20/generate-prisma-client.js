#!/usr/bin/env node

/**
 * Generate Prisma Client
 * 
 * This script generates the Prisma client after schema changes.
 * Run this after modifying prisma/schema.prisma
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Generating Prisma Client...\n');

try {
  // Change to the directory containing this script
  const scriptDir = __dirname;
  process.chdir(scriptDir);
  
  console.log(`📁 Working directory: ${process.cwd()}\n`);
  
  // Run prisma generate
  execSync('node node_modules/prisma/build/index.js generate', {
    stdio: 'inherit',
    cwd: scriptDir
  });
  
  console.log('\n✅ Prisma Client generated successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Review the generated types in node_modules/@prisma/client');
  console.log('   2. Run your application or tests');
  
} catch (error) {
  console.error('\n❌ Error generating Prisma Client:');
  console.error(error.message);
  console.error('\n💡 Try running manually:');
  console.error('   cd backend/services/payment-service');
  console.error('   node node_modules/prisma/build/index.js generate');
  process.exit(1);
}
