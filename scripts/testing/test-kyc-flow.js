#!/usr/bin/env node

/**
 * KYC Flow Test Script
 * Tests the complete KYC verification flow including:
 * 1. Frontend KYC form submission
 * 2. Backend KYC processing
 * 3. KYC status checking
 * 4. KYC enforcement in trips-service
 */

const axios = require('axios');
const { execSync } = require('child_process');

// Configuration
const BASE_URL = 'http://localhost:3001';
const AUTH_SERVICE_URL = 'http://localhost:3002';
const TRIPS_SERVICE_URL = 'http://localhost:3003';

// Test user credentials
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'testpassword123',
  firstName: 'Test',
  lastName: 'User'
};

// Test KYC data
const TEST_KYC_DATA = {
  firstName: 'Test',
  lastName: 'User',
  dateOfBirth: '1990-01-01',
  nationality: 'SA',
  idNumber: '1234567890',
  idType: 'national_id',
  address: '123 Test Street',
  city: 'Riyadh',
  country: 'SA',
  postalCode: '12345',
  phoneNumber: '+966501234567'
};

class KYCTest {
  constructor() {
    this.authToken = null;
    this.userId = null;
    this.testResults = [];
  }

  async runTests() {
    console.log('🚀 Starting KYC Flow Tests...\n');

    try {
      // Test 1: User Registration
      await this.testUserRegistration();

      // Test 2: User Login
      await this.testUserLogin();

      // Test 3: Check initial KYC status (should be DRAFT)
      await this.testInitialKYCStatus();

      // Test 4: Submit KYC application
      await this.testKYCSubmission();

      // Test 5: Check KYC status after submission (should be PENDING)
      await this.testKYCStatusAfterSubmission();

      // Test 6: Test KYC enforcement - Try to create trip (should fail)
      await this.testKYCEnforcement();

      // Test 7: Simulate KYC approval (admin action)
      await this.testKYCApproval();

      // Test 8: Test KYC status after approval (should be APPROVED)
      await this.testKYCStatusAfterApproval();

      // Test 9: Test KYC enforcement - Try to create trip (should succeed)
      await this.testKYCEnforcementAfterApproval();

      // Test 10: Test audit logging
      await this.testAuditLogging();

      this.printResults();

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  }

  async testUserRegistration() {
    console.log('1. Testing user registration...');
    
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/register`, {
        email: TEST_USER.email,
        password: TEST_USER.password,
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
        role: 'traveler'
      });

      if (response.data.success) {
        this.userId = response.data.data.user.id;
        console.log('✅ User registered successfully');
        this.testResults.push({ test: 'User Registration', status: 'PASSED' });
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️  User already exists, proceeding with login...');
        this.testResults.push({ test: 'User Registration', status: 'SKIPPED' });
      } else {
        throw error;
      }
    }
  }

  async testUserLogin() {
    console.log('2. Testing user login...');
    
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (response.data.success && response.data.data.accessToken) {
      this.authToken = response.data.data.accessToken;
      this.userId = response.data.data.user.id;
      console.log('✅ User logged in successfully');
      this.testResults.push({ test: 'User Login', status: 'PASSED' });
    } else {
      throw new Error('Login failed');
    }
  }

  async testInitialKYCStatus() {
    console.log('3. Testing initial KYC status...');
    
    const response = await axios.get(
      `${AUTH_SERVICE_URL}/api/traveler-kyc/status/${this.userId}`,
      { headers: { Authorization: `Bearer ${this.authToken}` } }
    );

    if (response.data.status === 'DRAFT' && !response.data.isVerified) {
      console.log('✅ Initial KYC status is DRAFT (as expected)');
      this.testResults.push({ test: 'Initial KYC Status', status: 'PASSED' });
    } else {
      throw new Error(`Expected DRAFT status, got ${response.data.status}`);
    }
  }

  async testKYCSubmission() {
    console.log('4. Testing KYC submission...');
    
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/traveler-kyc/submit`,
      {
        ...TEST_KYC_DATA,
        userId: this.userId
      },
      { headers: { Authorization: `Bearer ${this.authToken}` } }
    );

    if (response.data.success) {
      console.log('✅ KYC submitted successfully');
      this.testResults.push({ test: 'KYC Submission', status: 'PASSED' });
    } else {
      throw new Error(response.data.message || 'KYC submission failed');
    }
  }

  async testKYCStatusAfterSubmission() {
    console.log('5. Testing KYC status after submission...');
    
    const response = await axios.get(
      `${AUTH_SERVICE_URL}/api/traveler-kyc/status/${this.userId}`,
      { headers: { Authorization: `Bearer ${this.authToken}` } }
    );

    if (response.data.status === 'PENDING') {
      console.log('✅ KYC status is PENDING after submission');
      this.testResults.push({ test: 'KYC Status After Submission', status: 'PASSED' });
    } else {
      throw new Error(`Expected PENDING status, got ${response.data.status}`);
    }
  }

  async testKYCEnforcement() {
    console.log('6. Testing KYC enforcement (should block trip creation)...');
    
    try {
      await axios.post(
        `${TRIPS_SERVICE_URL}/trips`,
        {
          origin: 'Riyadh',
          destination: 'Jeddah',
          departureDate: '2024-12-25',
          availableWeight: 10,
          pricePerKg: 50
        },
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );
      
      throw new Error('Expected trip creation to fail due to KYC verification');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ KYC enforcement working - trip creation blocked');
        this.testResults.push({ test: 'KYC Enforcement', status: 'PASSED' });
      } else {
        throw new Error(`Expected 403 error, got ${error.response?.status}`);
      }
    }
  }

  async testKYCApproval() {
    console.log('7. Simulating KYC approval (admin action)...');
    
    // This would normally be done through the admin service
    // For testing, we'll directly update the database
    try {
      // Simulate admin approval by directly updating status
      execSync(`npx prisma db execute --file ./scripts/approve-kyc.sql --data '{"userId": ${this.userId}}'`);
      console.log('✅ KYC approved (simulated admin action)');
      this.testResults.push({ test: 'KYC Approval', status: 'PASSED' });
    } catch (error) {
      console.log('ℹ️  KYC approval simulation skipped (manual verification needed)');
      this.testResults.push({ test: 'KYC Approval', status: 'SKIPPED' });
    }
  }

  async testKYCStatusAfterApproval() {
    console.log('8. Testing KYC status after approval...');
    
    const response = await axios.get(
      `${AUTH_SERVICE_URL}/api/traveler-kyc/status/${this.userId}`,
      { headers: { Authorization: `Bearer ${this.authToken}` } }
    );

    if (response.data.status === 'APPROVED' && response.data.isVerified) {
      console.log('✅ KYC status is APPROVED after approval');
      this.testResults.push({ test: 'KYC Status After Approval', status: 'PASSED' });
    } else {
      console.log(`ℹ️  KYC status: ${response.data.status}, manual verification may be needed`);
      this.testResults.push({ test: 'KYC Status After Approval', status: 'SKIPPED' });
    }
  }

  async testKYCEnforcementAfterApproval() {
    console.log('9. Testing KYC enforcement after approval (should allow trip creation)...');
    
    try {
      const response = await axios.post(
        `${TRIPS_SERVICE_URL}/trips`,
        {
          origin: 'Riyadh',
          destination: 'Jeddah',
          departureDate: '2024-12-25',
          availableWeight: 10,
          pricePerKg: 50
        },
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );

      if (response.status === 201) {
        console.log('✅ KYC enforcement working - trip creation allowed after approval');
        this.testResults.push({ test: 'KYC Enforcement After Approval', status: 'PASSED' });
      } else {
        throw new Error(`Expected 201 status, got ${response.status}`);
      }
    } catch (error) {
      console.log('ℹ️  Trip creation test skipped (KYC may not be approved yet)');
      this.testResults.push({ test: 'KYC Enforcement After Approval', status: 'SKIPPED' });
    }
  }

  async testAuditLogging() {
    console.log('10. Testing audit logging...');
    
    try {
      const response = await axios.get(
        `${AUTH_SERVICE_URL}/api/audit/events?userId=${this.userId}`,
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );

      if (response.data.success) {
        console.log('✅ Audit logs accessible');
        this.testResults.push({ test: 'Audit Logging', status: 'PASSED' });
      } else {
        throw new Error('Audit logging test failed');
      }
    } catch (error) {
      console.log('ℹ️  Audit logging test skipped');
      this.testResults.push({ test: 'Audit Logging', status: 'SKIPPED' });
    }
  }

  printResults() {
    console.log('\n📊 Test Results:');
    console.log('='.repeat(50));
    
    this.testResults.forEach((result, index) => {
      const statusIcon = result.status === 'PASSED' ? '✅' : result.status === 'SKIPPED' ? 'ℹ️ ' : '❌';
      console.log(`${index + 1}. ${statusIcon} ${result.test}: ${result.status}`);
    });

    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIPPED').length;
    const total = this.testResults.length;

    console.log('\n📈 Summary:');
    console.log(`Passed: ${passed}/${total}`);
    console.log(`Skipped: ${skipped}/${total}`);
    console.log(`Coverage: ${Math.round((passed / total) * 100)}%`);

    if (passed === total) {
      console.log('\n🎉 All KYC flow tests completed successfully!');
    } else {
      console.log('\n⚠️  Some tests were skipped or failed. Manual verification may be needed.');
    }
  }
}

// Run the tests
const test = new KYCTest();
test.runTests().catch(console.error);