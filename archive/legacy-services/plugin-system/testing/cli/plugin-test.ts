#!/usr/bin/env node

import { PluginTestingFramework } from './PluginTestingFramework';
import { PluginTestUtils } from './PluginTestUtils';
import { PluginManager } from '@mnbara/plugin-manager';
import { HookSystem } from '@mnbara/hook-system';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Plugin Test Runner CLI
 * Command-line interface for running plugin tests
 */
class PluginTestRunner {
  private pluginManager: PluginManager;
  private hookSystem: HookSystem;
  private testingFramework: PluginTestingFramework;

  constructor() {
    const prisma = new PrismaClient();
    this.hookSystem = new HookSystem();
    this.pluginManager = new PluginManager(prisma, this.hookSystem, {
      pluginDirectory: './plugins',
      enableSandbox: true,
      enableMarketplace: true,
      autoRegisterHooks: true,
    });
    this.testingFramework = new PluginTestingFramework(this.pluginManager, this.hookSystem);
  }

  /**
   * Main CLI entry point
   */
  async run() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      this.showHelp();
      return;
    }

    const command = args[0];
    
    try {
      switch (command) {
        case 'test':
          await this.runTests(args.slice(1));
          break;
        case 'validate':
          await this.validatePlugin(args.slice(1));
          break;
        case 'benchmark':
          await this.runBenchmark(args.slice(1));
          break;
        case 'security':
          await this.runSecurityScan(args.slice(1));
          break;
        case 'generate':
          await this.generateTestSuite(args.slice(1));
          break;
        case 'list':
          await this.listTests(args.slice(1));
          break;
        case 'help':
          this.showHelp();
          break;
        default:
          console.error(`Unknown command: ${command}`);
          this.showHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Run plugin tests
   */
  private async runTests(args: string[]) {
    const pluginName = args[0];
    const testType = args[1] || 'complete';
    
    if (!pluginName) {
      console.error('Plugin name is required');
      process.exit(1);
    }

    console.log(`🧪 Running ${testType} tests for plugin: ${pluginName}`);

    let testSuite;
    switch (testType) {
      case 'complete':
        testSuite = PluginTestUtils.createCompleteTestSuite();
        break;
      case 'minimal':
        testSuite = PluginTestUtils.createMinimalTestSuite();
        break;
      case 'security':
        testSuite = PluginTestUtils.createSecurityTestSuite();
        break;
      default:
        // Try to load custom test suite from file
        const testSuitePath = path.resolve(testType);
        if (fs.existsSync(testSuitePath)) {
          testSuite = JSON.parse(fs.readFileSync(testSuitePath, 'utf8'));
        } else {
          console.error(`Unknown test type: ${testType}`);
          process.exit(1);
        }
    }

    const report = await this.testingFramework.runPluginTests(pluginName, testSuite);
    
    this.printTestReport(report);
    
    // Exit with appropriate code
    process.exit(report.failedTests > 0 ? 1 : 0);
  }

  /**
   * Validate plugin manifest and structure
   */
  private async validatePlugin(args: string[]) {
    const pluginPath = args[0];
    
    if (!pluginPath) {
      console.error('Plugin path is required');
      process.exit(1);
    }

    console.log(`🔍 Validating plugin: ${pluginPath}`);

    try {
      const manifestPath = path.join(pluginPath, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        console.error('❌ manifest.json not found');
        process.exit(1);
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Validate manifest structure
      const validation = this.validateManifestStructure(manifest);
      
      if (validation.valid) {
        console.log('✅ Plugin manifest is valid');
      } else {
        console.error('❌ Plugin manifest validation failed:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }

      // Check for required files
      const requiredFiles = ['index.js', 'manifest.json'];
      for (const file of requiredFiles) {
        const filePath = path.join(pluginPath, file);
        if (!fs.existsSync(filePath)) {
          console.error(`❌ Required file missing: ${file}`);
          process.exit(1);
        }
      }

      console.log('✅ All required files present');
      console.log('✅ Plugin validation completed successfully');
      
    } catch (error) {
      console.error('❌ Validation error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Run performance benchmarks
   */
  private async runBenchmark(args: string[]) {
    const pluginName = args[0];
    const iterations = parseInt(args[1]) || 100;
    
    if (!pluginName) {
      console.error('Plugin name is required');
      process.exit(1);
    }

    console.log(`⚡ Running benchmark for plugin: ${pluginName} (${iterations} iterations)`);

    const benchmarkResults = await this.runPerformanceBenchmark(pluginName, iterations);
    
    console.log('\n📊 Benchmark Results:');
    console.log(`  Average: ${benchmarkResults.average.toFixed(2)}ms`);
    console.log(`  Min: ${benchmarkResults.min.toFixed(2)}ms`);
    console.log(`  Max: ${benchmarkResults.max.toFixed(2)}ms`);
    console.log(`  Total: ${benchmarkResults.total.toFixed(2)}ms`);
    console.log(`  Operations/sec: ${(1000 / benchmarkResults.average).toFixed(2)}`);
  }

  /**
   * Run security scan
   */
  private async runSecurityScan(args: string[]) {
    const pluginName = args[0];
    
    if (!pluginName) {
      console.error('Plugin name is required');
      process.exit(1);
    }

    console.log(`🔒 Running security scan for plugin: ${pluginName}`);

    const testSuite = PluginTestUtils.createSecurityTestSuite();
    const report = await this.testingFramework.runPluginTests(pluginName, testSuite);
    
    this.printSecurityReport(report);
  }

  /**
   * Generate test suite template
   */
  private async generateTestSuite(args: string[]) {
    const outputPath = args[0] || './plugin-test-suite.json';
    const testType = args[1] || 'complete';

    console.log(`📝 Generating ${testType} test suite template: ${outputPath}`);

    let testSuite;
    switch (testType) {
      case 'complete':
        testSuite = PluginTestUtils.createCompleteTestSuite();
        break;
      case 'minimal':
        testSuite = PluginTestUtils.createMinimalTestSuite();
        break;
      case 'security':
        testSuite = PluginTestUtils.createSecurityTestSuite();
        break;
      default:
        console.error(`Unknown test type: ${testType}`);
        process.exit(1);
    }

    fs.writeFileSync(outputPath, JSON.stringify(testSuite, null, 2));
    console.log(`✅ Test suite template generated: ${outputPath}`);
  }

  /**
   * List available tests
   */
  private async listTests(args: string[]) {
    const pluginName = args[0];
    
    if (!pluginName) {
      console.log('📋 Available Test Categories:');
      console.log('  - manifest: Plugin manifest validation');
      console.log('  - security: Security and permission tests');
      console.log('  - functional: Plugin functionality tests');
      console.log('  - performance: Performance and load tests');
      console.log('  - integration: Integration with other systems');
      console.log('  - hooks: Hook system integration');
      return;
    }

    const testSuite = PluginTestUtils.createCompleteTestSuite();
    
    console.log(`📋 Available tests for ${pluginName}:`);
    
    Object.entries(testSuite).forEach(([category, tests]) => {
      if (tests.length > 0) {
        console.log(`\n  ${category.toUpperCase()}:`);
        tests.forEach(test => {
          console.log(`    - ${test.name}`);
        });
      }
    });
  }

  /**
   * Print test report
   */
  private printTestReport(report: any) {
    console.log('\n📊 Test Report:');
    console.log(`  Plugin: ${report.pluginName}`);
    console.log(`  Duration: ${report.duration}ms`);
    console.log(`  Total: ${report.totalTests}`);
    console.log(`  Passed: ${report.passedTests} ✅`);
    console.log(`  Failed: ${report.failedTests} ❌`);
    console.log(`  Skipped: ${report.skippedTests} ⏭️`);
    console.log(`  Summary: ${report.summary}`);

    if (report.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      report.results
        .filter((r: TestResult) => r.status === 'failed')
        .forEach((result: TestResult) => {
          console.log(`  - ${result.testName} (${result.category}): ${result.error}`);
        });
    }

    if (report.passedTests > 0) {
      console.log('\n✅ Passed Tests:');
      report.results
        .filter((r: TestResult) => r.status === 'passed')
        .forEach((result: TestResult) => {
          console.log(`  - ${result.testName} (${result.category}): ${result.duration}ms`);
        });
    }
  }

  /**
   * Print security report
   */
  private printSecurityReport(report: any) {
    console.log('\n🔒 Security Report:');
    console.log(`  Plugin: ${report.pluginName}`);
    console.log(`  Duration: ${report.duration}ms`);
    console.log(`  Total: ${report.totalTests}`);
    console.log(`  Passed: ${report.passedTests} ✅`);
    console.log(`  Failed: ${report.failedTests} ❌`);

    if (report.failedTests > 0) {
      console.log('\n⚠️  Security Issues Found:');
      report.results
        .filter((r: TestResult) => r.status === 'failed' && r.category === 'security')
        .forEach((result: TestResult) => {
          console.log(`  - ${result.testName}: ${result.error}`);
        });
    } else {
      console.log('\n✅ No security issues found');
    }
  }

  /**
   * Run performance benchmark
   */
  private async runPerformanceBenchmark(pluginName: string, iterations: number) {
    const results: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      // Simulate plugin operation
      await this.pluginManager.getPlugin(pluginName);
      
      const duration = Date.now() - start;
      results.push(duration);
    }

    return {
      average: results.reduce((a, b) => a + b, 0) / results.length,
      min: Math.min(...results),
      max: Math.max(...results),
      total: results.reduce((a, b) => a + b, 0),
    };
  }

  /**
   * Validate manifest structure
   */
  private validateManifestStructure(manifest: any) {
    const errors: string[] = [];
    
    const requiredFields = ['name', 'version', 'main', 'type'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate version format
    if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      errors.push('Invalid version format (should be semver)');
    }

    // Validate permissions
    if (manifest.permissions) {
      if (!Array.isArray(manifest.permissions)) {
        errors.push('Permissions must be an array');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Show help
   */
  private showHelp() {
    console.log(`
🧪 Plugin Test Runner CLI

Usage: plugin-test <command> [options]

Commands:
  test <plugin> [type]     Run tests for a plugin
                           Types: complete, minimal, security, <file.json>
  validate <path>         Validate plugin structure
  benchmark <plugin> [n]  Run performance benchmark (n iterations)
  security <plugin>       Run security scan
  generate [path] [type]  Generate test suite template
  list [plugin]          List available tests
  help                   Show this help

Examples:
  plugin-test test my-plugin complete
  plugin-test validate ./plugins/my-plugin
  plugin-test benchmark my-plugin 100
  plugin-test security my-plugin
  plugin-test generate ./test-suite.json security
  plugin-test list my-plugin
`);
  }
}

// Run the CLI
const runner = new PluginTestRunner();
runner.run().catch(error => {
  console.error('CLI Error:', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
});