import { PluginTestingFramework, PluginTestUtils } from './index';
import { PluginManager } from '@mnbara/plugin-manager';
import { HookSystem } from '@mnbara/hook-system';
import { PrismaClient } from '@prisma/client';

/**
 * Plugin Testing Framework Example
 * Demonstrates how to use the testing framework
 */
async function runExample() {
  console.log('🧪 Plugin Testing Framework Example\n');

  // Initialize required services
  const prisma = new PrismaClient();
  const hookSystem = new HookSystem();
  const pluginManager = new PluginManager(prisma, hookSystem, {
    pluginDirectory: './plugins',
    enableSandbox: true,
    enableMarketplace: true,
    autoRegisterHooks: true,
  });

  // Create testing framework
  const testingFramework = new PluginTestingFramework(pluginManager, hookSystem);

  // Example 1: Run complete test suite
  console.log('1️⃣  Running Complete Test Suite...');
  const completeTestSuite = PluginTestUtils.createCompleteTestSuite();
  
  // Mock plugin for testing (in real scenario, this would be an actual plugin)
  const mockPlugin = PluginTestUtils.createMockPlugin({
    name: 'example-plugin',
    init: async () => console.log('✅ Plugin initialized'),
    configure: async (config) => console.log('✅ Plugin configured:', config),
    destroy: async () => console.log('✅ Plugin destroyed'),
    onAppStartup: async (data) => console.log('✅ App startup hook executed'),
    onUserLogin: async (data) => console.log('✅ User login hook executed'),
  });

  try {
    const report = await testingFramework.runPluginTests('example-plugin', completeTestSuite);
    console.log('\n📊 Test Report Summary:');
    console.log(`   Plugin: ${report.pluginName}`);
    console.log(`   Duration: ${report.duration}ms`);
    console.log(`   Total Tests: ${report.totalTests}`);
    console.log(`   Passed: ${report.passedTests} ✅`);
    console.log(`   Failed: ${report.failedTests} ❌`);
    console.log(`   Summary: ${report.summary}`);
  } catch (error) {
    console.error('❌ Test execution failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Example 2: Run minimal test suite
  console.log('\n2️⃣  Running Minimal Test Suite...');
  const minimalTestSuite = PluginTestUtils.createMinimalTestSuite();
  
  try {
    const minimalReport = await testingFramework.runPluginTests('example-plugin', minimalTestSuite);
    console.log(`   Result: ${minimalReport.summary}`);
  } catch (error) {
    console.error('❌ Minimal test failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Example 3: Run security-focused test suite
  console.log('\n3️⃣  Running Security Test Suite...');
  const securityTestSuite = PluginTestUtils.createSecurityTestSuite();
  
  try {
    const securityReport = await testingFramework.runPluginTests('example-plugin', securityTestSuite);
    console.log(`   Security Status: ${securityReport.failedTests === 0 ? '✅ Secure' : '❌ Security Issues Found'}`);
    
    if (securityReport.failedTests > 0) {
      securityReport.results
        .filter(r => r.status === 'failed' && r.category === 'security')
        .forEach(result => {
          console.log(`   - ${result.testName}: ${result.error}`);
        });
    }
  } catch (error) {
    console.error('❌ Security test failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Example 4: Validate test results
  console.log('\n4️⃣  Test Result Validation...');
  const testResults: TestResult[] = [
    { testName: 'Test 1', category: 'functional', status: 'passed', duration: 100 },
    { testName: 'Test 2', category: 'functional', status: 'passed', duration: 150 },
    { testName: 'Test 3', category: 'security', status: 'failed', duration: 200, error: 'Permission denied' },
    { testName: 'Test 4', category: 'performance', status: 'skipped', duration: 0 },
  ];

  const validation = PluginTestUtils.validateTestResults(testResults);
  console.log(`   Validation Results:`);
  console.log(`   - Total: ${validation.total}`);
  console.log(`   - Passed: ${validation.passed}`);
  console.log(`   - Failed: ${validation.failed}`);
  console.log(`   - Skipped: ${validation.skipped}`);
  console.log(`   - Success Rate: ${validation.successRate.toFixed(1)}%`);
  console.log(`   - Summary: ${PluginTestUtils.generateReportSummary(testResults)}`);

  // Example 5: Create custom test manifest
  console.log('\n5️⃣  Creating Custom Test Manifest...');
  const customManifest = PluginTestUtils.createMockManifest({
    name: 'custom-test-plugin',
    version: '2.1.0',
    type: 'custom',
    category: 'analytics',
    permissions: ['read:config', 'write:config', 'ui:render'],
    dependencies: {
      'lodash': '^4.17.21',
      'axios': '^1.0.0',
    },
  });

  console.log(`   Created manifest for: ${customManifest.name} v${customManifest.version}`);
  console.log(`   Permissions: ${customManifest.permissions?.join(', ')}`);
  console.log(`   Dependencies: ${Object.keys(customManifest.dependencies || {}).join(', ')}`);

  console.log('\n✅ Plugin Testing Framework Example Completed!');
  console.log('\n📝 Key Features Demonstrated:');
  console.log('   • Complete test suite execution');
  console.log('   • Minimal test suite for quick validation');
  console.log('   • Security-focused testing');
  console.log('   • Test result validation and reporting');
  console.log('   • Custom test manifest creation');
  console.log('   • Performance benchmarking');
  console.log('   • Integration testing');
  console.log('   • Hook system testing');
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExample().catch(error => {
    console.error('❌ Example failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  });
}

export { runExample };