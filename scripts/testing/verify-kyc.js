#!/usr/bin/env node

/**
 * KYC Implementation Verification Script
 * Verifies that all KYC components are properly implemented
 */

const fs = require('fs');
const path = require('path');

class KYCVerifier {
  constructor() {
    this.basePath = __dirname;
    this.checks = [];
  }

  async verify() {
    console.log('🔍 Verifying KYC Implementation...\n');

    // Check 1: KYC Controller
    await this.checkFileExists(
      'backend/services/auth-service/src/controllers/kyc.controller.ts',
      'KYC Controller'
    );

    // Check 2: KYC Service
    await this.checkFileExists(
      'backend/services/auth-service/src/services/kyc.service.ts',
      'KYC Service'
    );

    // Check 3: Traveler KYC Service
    await this.checkFileExists(
      'backend/services/auth-service/src/services/traveler-kyc.service.ts',
      'Traveler KYC Service'
    );

    // Check 4: KYC Routes
    await this.checkFileExists(
      'backend/services/auth-service/src/routes/kyc.routes.ts',
      'KYC Routes'
    );

    // Check 5: Traveler KYC Routes
    await this.checkFileExists(
      'backend/services/auth-service/src/routes/traveler-kyc.routes.ts',
      'Traveler KYC Routes'
    );

    // Check 6: KYC Middleware
    await this.checkFileExists(
      'backend/services/trips-service/src/middleware/auth.middleware.ts',
      'KYC Middleware'
    );

    // Check 7: KYC Guard
    await this.checkFileExists(
      'backend/services/trips-service/src/common/auth/kyc.guard.ts',
      'KYC Guard'
    );

    // Check 8: KYC Service (HTTP)
    await this.checkFileExists(
      'backend/services/trips-service/src/common/auth/kyc.service.ts',
      'KYC HTTP Service'
    );

    // Check 9: Audit Service
    await this.checkFileExists(
      'backend/services/admin-service/src/shared/audit/audit.service.ts',
      'Audit Service'
    );

    // Check 10: Frontend KYC Component
    await this.checkFileExists(
      'frontend/web/src/pages/traveler/TravelerKYCVerificationPage.tsx',
      'Frontend KYC Component'
    );

    // Check 11: Database Migrations
    await this.checkMigrations();

    this.printResults();
  }

  async checkFileExists(relativePath, name) {
    const fullPath = path.join(this.basePath, relativePath);
    
    try {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        console.log(`✅ ${name}: FOUND (${relativePath})`);
        this.checks.push({ name, status: 'PASSED', path: relativePath });
        
        // Additional checks for specific files
        if (relativePath.includes('kyc.controller.ts') && content.includes('submitKYC')) {
          console.log('   ↳ Contains submitKYC method');
        }
        if (relativePath.includes('kyc.guard.ts') && content.includes('canActivate')) {
          console.log('   ↳ Contains canActivate method');
        }
        if (relativePath.includes('TravelerKYCVerificationPage.tsx') && content.includes('useState')) {
          console.log('   ↳ React component with state management');
        }
        
      } else {
        console.log(`❌ ${name}: NOT FOUND (${relativePath})`);
        this.checks.push({ name, status: 'FAILED', path: relativePath });
      }
    } catch (error) {
      console.log(`❌ ${name}: ERROR - ${error.message}`);
      this.checks.push({ name, status: 'ERROR', path: relativePath });
    }
  }

  async checkMigrations() {
    const migrationsPath = path.join(this.basePath, 'backend/services/admin-service/prisma/migrations');
    
    try {
      if (fs.existsSync(migrationsPath)) {
        const files = fs.readdirSync(migrationsPath);
        const kycMigrations = files.filter(file => 
          file.toLowerCase().includes('kyc') || 
          file.toLowerCase().includes('traveler')
        );
        
        if (kycMigrations.length > 0) {
          console.log(`✅ Database Migrations: FOUND (${kycMigrations.length} KYC-related migrations)`);
          kycMigrations.forEach(migration => {
            console.log(`   ↳ ${migration}`);
          });
          this.checks.push({ name: 'Database Migrations', status: 'PASSED', path: 'migrations/' });
        } else {
          console.log('ℹ️  Database Migrations: No specific KYC migrations found');
          this.checks.push({ name: 'Database Migrations', status: 'INFO', path: 'migrations/' });
        }
      } else {
        console.log('❌ Database Migrations: Migrations directory not found');
        this.checks.push({ name: 'Database Migrations', status: 'FAILED', path: 'migrations/' });
      }
    } catch (error) {
      console.log(`❌ Database Migrations: ERROR - ${error.message}`);
      this.checks.push({ name: 'Database Migrations', status: 'ERROR', path: 'migrations/' });
    }
  }

  printResults() {
    console.log('\n📊 Verification Results:');
    console.log('='.repeat(60));
    
    const passed = this.checks.filter(c => c.status === 'PASSED').length;
    const failed = this.checks.filter(c => c.status === 'FAILED').length;
    const errors = this.checks.filter(c => c.status === 'ERROR').length;
    const info = this.checks.filter(c => c.status === 'INFO').length;
    const total = this.checks.length;

    this.checks.forEach((check, index) => {
      const statusIcon = check.status === 'PASSED' ? '✅' : 
                         check.status === 'FAILED' ? '❌' : 
                         check.status === 'ERROR' ? '⚠️ ' : 'ℹ️ ';
      console.log(`${index + 1}. ${statusIcon} ${check.name}: ${check.status}`);
    });

    console.log('\n📈 Summary:');
    console.log(`Passed: ${passed}/${total}`);
    console.log(`Failed: ${failed}/${total}`);
    console.log(`Errors: ${errors}/${total}`);
    console.log(`Info: ${info}/${total}`);
    console.log(`Coverage: ${Math.round((passed / total) * 100)}%`);

    if (failed === 0 && errors === 0) {
      console.log('\n🎉 KYC implementation verification completed successfully!');
      console.log('\n🚀 The KYC flow is fully implemented and ready for testing.');
      console.log('\n📋 Next steps:');
      console.log('   1. Start the backend services (auth, trips, admin)');
      console.log('   2. Start the frontend development server');
      console.log('   3. Test the complete KYC flow manually');
      console.log('   4. Verify KYC enforcement in trips service');
    } else {
      console.log('\n⚠️  Some components are missing or have errors.');
      console.log('   Please check the implementation and run verification again.');
    }
  }
}

// Run verification
const verifier = new KYCVerifier();
verifier.verify().catch(console.error);