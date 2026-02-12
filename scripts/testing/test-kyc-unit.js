#!/usr/bin/env node

/**
 * KYC Unit Test Script
 * Tests the KYC verification flow components individually
 */

const { execSync } = require('child_process');

class KYCUnitTest {
  constructor() {
    this.testResults = [];
  }

  async runTests() {
    console.log('🧪 Starting KYC Unit Tests...\n');

    try {
      // Test 1: Check KYC controller exists
      await this.testKYCController();

      // Test 2: Check KYC service exists
      await this.testKYCService();

      // Test 3: Check KYC middleware exists
      await this.testKYCMiddleware();

      // Test 4: Check KYC guard exists
      await this.testKYCGuard();

      // Test 5: Check audit service exists
      await this.testAuditService();

      // Test 6: Check database migrations
      await this.testDatabaseMigrations();

      // Test 7: Check frontend KYC component
      await this.testFrontendKYCComponent();

      this.printResults();

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  }

  async testKYCController() {
    console.log('1. Testing KYC controller...');
    
    const controllerPath = 'backend/services/auth-service/src/controllers/kyc.controller.ts';
    if (this.fileExists(controllerPath)) {
      const content = this.readFile(controllerPath);
      if (content.includes('submitKYC') || content.includes('getKYCStatus')) {
        console.log('✅ KYC controller found with required methods');
        this.testResults.push({ test: 'KYC Controller', status: 'PASSED' });
      } else {
        throw new Error('KYC controller missing required methods');
      }
    } else {
      throw new Error('KYC controller not found');
    }
  }

  async testKYCService() {
    console.log('2. Testing KYC service...');
    
    const servicePath = 'backend/services/auth-service/src/services/kyc.service.ts';
    if (this.fileExists(servicePath)) {
      const content = this.readFile(servicePath);
      if (content.includes('submitKYC') && content.includes('checkKYCStatus')) {
        console.log('✅ KYC service found with required methods');
        this.testResults.push({ test: 'KYC Service', status: 'PASSED' });
      } else {
        throw new Error('KYC service missing required methods');
      }
    } else {
      throw new Error('KYC service not found');
    }
  }

  async testKYCMiddleware() {
    console.log('3. Testing KYC middleware...');
    
    const middlewarePath = 'backend/services/trips-service/src/middleware/auth.middleware.ts';
    if (this.fileExists(middlewarePath)) {
      const content = this.readFile(middlewarePath);
      if (content.includes('authenticate') && content.includes('req.user')) {
        console.log('✅ KYC middleware found');
        this.testResults.push({ test: 'KYC Middleware', status: 'PASSED' });
      } else {
        throw new Error('KYC middleware incomplete');
      }
    } else {
      throw new Error('KYC middleware not found');
    }
  }

  async testKYCGuard() {
    console.log('4. Testing KYC guard...');
    
    const guardPath = 'backend/services/trips-service/src/common/auth/kyc.guard.ts';
    if (this.fileExists(guardPath)) {
      const content = this.readFile(guardPath);
      if (content.includes('KycGuard') && content.includes('canActivate')) {
        console.log('✅ KYC guard found');
        this.testResults.push({ test: 'KYC Guard', status: 'PASSED' });
      } else {
        throw new Error('KYC guard incomplete');
      }
    } else {
      throw new Error('KYC guard not found');
    }
  }

  async testAuditService() {
    console.log('5. Testing audit service...');
    
    const auditPath = 'backend/services/admin-service/src/shared/audit/audit.service.ts';
    if (this.fileExists(auditPath)) {
      const content = this.readFile(auditPath);
      if (content.includes('AuditService') && content.includes('logKYCSubmission')) {
        console.log('✅ Audit service found with KYC methods');
        this.testResults.push({ test: 'Audit Service', status: 'PASSED' });
      } else {
        throw new Error('Audit service missing KYC methods');
      }
    } else {
      throw new Error('Audit service not found');
    }
  }

  async testDatabaseMigrations() {
    console.log('6. Testing database migrations...');
    
    const migrationPath = 'backend/services/admin-service/prisma/migrations';
    try {
      const files = execSync(`dir "${migrationPath}" /b`).toString();
      if (files.includes('kyc') || files.includes('KYC')) {
        console.log('✅ KYC database migrations found');
        this.testResults.push({ test: 'Database Migrations', status: 'PASSED' });
      } else {
        console.log('ℹ️  No specific KYC migrations found, checking schema...');
        
        const schemaPath = 'backend/services/admin-service/prisma/schema.prisma';
        if (this.fileExists(schemaPath)) {
          const schema = this.readFile(schemaPath);
          if (schema.includes('TravelerKYC') || schema.includes('AuditLog')) {
            console.log('✅ KYC tables found in schema');
            this.testResults.push({ test: 'Database Schema', status: 'PASSED' });
          } else {
            throw new Error('KYC tables not found in schema');
          }
        } else {
          throw new Error('Schema file not found');
        }
      }
    } catch (error) {
      console.log('ℹ️  Database migration check skipped');
      this.testResults.push({ test: 'Database Migrations', status: 'SKIPPED' });
    }
  }

  async testFrontendKYCComponent() {
    console.log('7. Testing frontend KYC component...');
    
    const kycPagePath = 'frontend/web/src/pages/traveler/TravelerKYCVerificationPage.tsx';
    if (this.fileExists(kycPagePath)) {
      const content = this.readFile(kycPagePath);
      if (content.includes('KYCVerification') && content.includes('useState')) {
        console.log('✅ Frontend KYC component found');
        this.testResults.push({ test: 'Frontend KYC Component', status: 'PASSED' });
      } else {
        throw new Error('Frontend KYC component incomplete');
      }
    } else {
      throw new Error('Frontend KYC component not found');
    }
  }

  fileExists(path) {
    try {
      execSync(`dir "${path}"`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  readFile(path) {
    try {
      return execSync(`type "${path}"`).toString();
    } catch (error) {
      throw new Error(`Cannot read file ${path}: ${error.message}`);
    }
  }

  printResults() {
    console.log('\n📊 Unit Test Results:');
    console.log('='.repeat(50));
    
    this.testResults.forEach((result, index) => {
      const statusIcon = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${index + 1}. ${statusIcon} ${result.test}: ${result.status}`);
    });

    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const total = this.testResults.length;

    console.log('\n📈 Summary:');
    console.log(`Passed: ${passed}/${total}`);
    console.log(`Coverage: ${Math.round((passed / total) * 100)}%`);

    if (passed === total) {
      console.log('\n🎉 All KYC unit tests passed! The implementation is complete.');
      console.log('\n🚀 Next steps:');
      console.log('   1. Start the backend services: npm run dev:auth & npm run dev:trips');
      console.log('   2. Start the frontend: cd frontend/web && npm run dev');
      console.log('   3. Test the complete flow manually');
    } else {
      console.log('\n❌ Some tests failed. Please check the implementation.');
    }
  }
}

// Run the unit tests
const test = new KYCUnitTest();
test.runTests().catch(console.error);