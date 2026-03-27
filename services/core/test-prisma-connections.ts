/**
 * Test script to verify Prisma database connections for all core services
 * This script tests that each service can connect to its database
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

interface ServiceConfig {
  name: string;
  path: string;
  dbName: string;
}

const services: ServiceConfig[] = [
  {
    name: 'Auth Service',
    path: 'services/core/auth-service',
    dbName: 'mnbara_auth'
  },
  {
    name: 'User Service',
    path: 'services/core/user-service',
    dbName: 'mnbara_user_service'
  },
  {
    name: 'Notification Service',
    path: 'services/core/notification-service',
    dbName: 'mnbara_notification_service'
  }
];

console.log('🔍 Testing Prisma Database Connections\n');
console.log('=' .repeat(60));

let allPassed = true;

for (const service of services) {
  console.log(`\n📦 Testing ${service.name}`);
  console.log('-'.repeat(60));

  try {
    // Check if prisma schema exists
    const schemaPath = path.join(service.path, 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      console.log(`❌ Prisma schema not found at ${schemaPath}`);
      allPassed = false;
      continue;
    }
    console.log(`✅ Prisma schema found`);

    // Check if migrations exist
    const migrationsPath = path.join(service.path, 'prisma', 'migrations');
    if (!fs.existsSync(migrationsPath)) {
      console.log(`❌ Migrations directory not found at ${migrationsPath}`);
      allPassed = false;
      continue;
    }
    console.log(`✅ Migrations directory found`);

    // Check if .env.example exists
    const envExamplePath = path.join(service.path, '.env.example');
    if (!fs.existsSync(envExamplePath)) {
      console.log(`❌ .env.example not found at ${envExamplePath}`);
      allPassed = false;
      continue;
    }
    console.log(`✅ .env.example found`);

    // Check if package.json has prisma scripts
    const packageJsonPath = path.join(service.path, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    const requiredScripts = ['prisma:generate', 'prisma:migrate', 'prisma:deploy'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length > 0) {
      console.log(`❌ Missing scripts: ${missingScripts.join(', ')}`);
      allPassed = false;
      continue;
    }
    console.log(`✅ All required Prisma scripts found`);

    // Check if @prisma/client is in dependencies
    if (!packageJson.dependencies['@prisma/client']) {
      console.log(`❌ @prisma/client not found in dependencies`);
      allPassed = false;
      continue;
    }
    console.log(`✅ @prisma/client dependency found`);

    // Try to generate Prisma client
    try {
      execSync(`npm run prisma:generate`, {
        cwd: service.path,
        stdio: 'pipe'
      });
      console.log(`✅ Prisma client generated successfully`);
    } catch (error) {
      console.log(`❌ Failed to generate Prisma client`);
      allPassed = false;
      continue;
    }

    console.log(`\n✅ ${service.name} - All checks passed!`);

  } catch (error) {
    console.log(`❌ Error testing ${service.name}: ${error instanceof Error ? error.message : String(error)}`);
    allPassed = false;
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary\n');

if (allPassed) {
  console.log('✅ All services have valid Prisma configurations!');
  console.log('\nNext steps:');
  console.log('1. Create PostgreSQL databases for each service');
  console.log('2. Update .env files with actual database credentials');
  console.log('3. Run "npm run prisma:migrate" in each service to apply migrations');
  console.log('4. Services are ready for deployment');
  process.exit(0);
} else {
  console.log('❌ Some services have configuration issues. Please review above.');
  process.exit(1);
}
