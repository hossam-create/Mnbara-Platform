const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Starting Direct Seed Runner...');
console.log('========================================');

// Define paths
const serviceDir = path.join(__dirname, '../services/auth-service');
const rootNodeModules = path.join(__dirname, '../node_modules');
const localNodeModules = path.join(serviceDir, 'node_modules');

// Load .env with encoding detection
const envPath = path.join(serviceDir, '.env');
const envVars = { ...process.env };

if (fs.existsSync(envPath)) {
  console.log(`📄 Loading .env from ${envPath}`);
  
  let envContent;
  const buffer = fs.readFileSync(envPath);
  
  // Check for UTF-16LE BOM (FF FE)
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    console.log('   Detected UTF-16LE encoding');
    envContent = buffer.toString('utf16le');
  } else {
    console.log('   Assuming UTF-8 encoding');
    envContent = buffer.toString('utf8');
  }

  let loadedCount = 0;
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
      if (key && !key.startsWith('#')) {
        envVars[key] = value;
        loadedCount++;
      }
    }
  });
  console.log(`   Loaded ${loadedCount} variables`);
  if (envVars.DATABASE_URL) {
    console.log('   ✅ DATABASE_URL found');
  } else {
    console.warn('   ⚠️  DATABASE_URL NOT found in .env!');
  }

} else {
  console.warn('⚠️  Warning: .env file not found!');
}

// Find Prisma CLI JS file
const prismaPathLocal = path.join(localNodeModules, 'prisma/build/index.js');
const prismaPathRoot = path.join(rootNodeModules, 'prisma/build/index.js');

let prismaCli = null;
if (fs.existsSync(prismaPathLocal)) {
  prismaCli = prismaPathLocal;
} else if (fs.existsSync(prismaPathRoot)) {
  prismaCli = prismaPathRoot;
}

if (!prismaCli) {
  console.error('❌ Error: Prisma CLI (build/index.js) not found!');
  process.exit(1);
}

console.log(`✅ Found Prisma CLI: ${prismaCli}`);

// Function to run command
function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`\nRunning: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      cwd: cwd,
      env: envVars, // Pass loaded environment variables
      stdio: 'inherit',
      shell: false
    });

    child.on('error', (err) => {
      console.error(`Failed to start subprocess: ${err}`);
      reject(err);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    // Step 1: Generate Prisma Client
    console.log('\n📦 Step 1: Generating Prisma Client...');
    await runCommand(process.execPath, [prismaCli, 'generate'], serviceDir);
    console.log('✅ Prisma Client Generated');

    // Step 2: Run Seed
    console.log('\n🌱 Step 2: Running Seed Script...');
    const seedFile = path.join(serviceDir, 'prisma/seeds/ebay-categories.seed.js');
    
    if (!fs.existsSync(seedFile)) {
      throw new Error(`Seed file not found at ${seedFile}`);
    }

    await runCommand(process.execPath, [seedFile], serviceDir);
    
    console.log('\n========================================');
    console.log('🎉 Success! Database seeded.');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ Fatal Error during execution:');
    console.error(error.message);
    process.exit(1);
  }
}

main();
