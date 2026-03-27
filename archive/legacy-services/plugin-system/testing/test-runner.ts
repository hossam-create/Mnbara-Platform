#!/usr/bin/env node

/**
 * Plugin Test Runner
 * Standalone test runner for plugin testing
 */

import { PluginTestingFramework } from './PluginTestingFramework';
import { PluginManager } from '@mnbara/plugin-manager';
import { HookSystem } from '@mnbara/hook-system';
import { defaultTestConfig, TestConfig } from './test-config';
import * as fs from 'fs';
import * as path from 'path';
import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface TestRunnerOptions {
  pluginPath: string;
  testType: 'all' | 'security' | 'performance' | 'functional' | 'integration';
  configPath?: string;
  outputPath?: string;
  snykToken?: string;
  verbose: boolean;
  ci: boolean;
}

class PluginTestRunner {
  private options: TestRunnerOptions;
  private config: TestConfig;

  constructor(options: TestRunnerOptions) {
    this.options = options;
    this.config = this.loadConfig();
  }

  /**
   * Load test configuration
   */
  private loadConfig(): TestConfig {
    if (this.options.configPath && fs.existsSync(this.options.configPath)) {
      const configData = fs.readFileSync(this.options.configPath, 'utf8');
      return { ...defaultTestConfig, ...JSON.parse(configData) };
    }
    return defaultTestConfig;
  }

  /**
   * Run plugin tests
   */
  async runTests(): Promise<void> {
    try {
      console.log(`🧪 Starting plugin tests for: ${this.options.pluginPath}`);
      console.log(`   Test type: ${this.options.testType}`);
      console.log(`   Config: ${this.options.configPath || 'default'}`);

      // Validate plugin structure
      const pluginPath = path.resolve(this.options.pluginPath);
      const manifestPath = path.join(pluginPath, 'plugin.json');
      const packageJsonPath = path.join(pluginPath, 'package.json');

      if (!fs.existsSync(manifestPath)) {
        throw new Error('plugin.json not found');
      }

      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
      }

      // Load plugin manifest
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Initialize testing framework
      const pluginManager = new PluginManager();
      const hookSystem = new HookSystem();
      const testingFramework = new PluginTestingFramework(
        pluginManager, 
        hookSystem, 
        this.options.snykToken || this.config.security.snykToken
      );

      // Generate test suite
      const testSuite = testingFramework.generateTestSuite(manifest.name, {
        maxDependencies: 15,
        allowedPermissions: ['read', 'write', 'execute', 'stream:read', 'chat:read'],
        maxLoadTime: this.config.performance.maxLoadTime,
        maxHookTime: this.config.performance.maxHookTime
      });

      // Filter tests based on test type
      const filteredSuite = this.filterTestSuite(testSuite);

      // Run tests
      console.log(`\n📋 Running ${this.options.testType} tests...`);
      const startTime = Date.now();
      
      const results = await testingFramework.runPluginTests(manifest.name, filteredSuite);
      
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // Generate and display report
      const report = testingFramework.generateTestReport(manifest.name, results.results);
      
      this.displayResults(report, totalDuration);

      // Save report
      await this.saveReport(report);

      // Check if tests passed
      if (results.summary.failed > 0) {
        console.log(`\n❌ ${results.summary.failed} tests failed`);
        process.exit(1);
      } else {
        console.log(`\n✅ All tests passed!`);
      }

    } catch (error) {
      console.error('❌ Test execution failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Filter test suite based on test type
   */
  private filterTestSuite(suite: any): any {
    switch (this.options.testType) {
      case 'security':
        return {
          ...suite,
          manifest: [],
          functional: [],
          performance: [],
          integration: [],
          hooks: []
        };
      case 'performance':
        return {
          ...suite,
          manifest: [],
          security: [],
          functional: [],
          integration: [],
          hooks: []
        };
      case 'functional':
        return {
          ...suite,
          manifest: [],
          security: [],
          performance: [],
          integration: [],
          hooks: []
        };
      case 'integration':
        return {
          ...suite,
          manifest: [],
          security: [],
          functional: [],
          performance: [],
          hooks: []
        };
      default:
        return suite;
    }
  }

  /**
   * Display test results
   */
  private displayResults(report: any, duration: number): void {
    console.log(`\n📊 Test Results:`);
    console.log(`   Plugin: ${report.pluginName}`);
    console.log(`   Tests: ${report.summary.passed}/${report.summary.total} passed`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Coverage: ${this.calculateOverallCoverage(report.coverage)}%`);

    if (this.options.verbose) {
      console.log(`\n📈 Category Breakdown:`);
      Object.entries(report.categories).forEach(([category, stats]: [string, any]) => {
        console.log(`   ${category}: ${stats.passed}/${stats.total} (${Math.round((stats.passed / stats.total) * 100)}%)`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      report.recommendations.forEach((rec: string) => console.log(`   - ${rec}`));
    }

    if (this.options.ci) {
      // CI-friendly output
      console.log(`\n##teamcity[buildStatus status='${report.summary.failed > 0 ? "FAILURE" : "SUCCESS"}' text='${report.summary.passed}/${report.summary.total} tests passed']`);
    }
  }

  /**
   * Calculate overall coverage
   */
  private calculateOverallCoverage(coverage: any): number {
    const categories = Object.keys(coverage);
    if (categories.length === 0) return 0;
    
    const totalPercentage = categories.reduce((sum, category) => {
      return sum + (coverage[category]?.percentage || 0);
    }, 0);
    
    return Math.round(totalPercentage / categories.length);
  }

  /**
   * Save test report
   */
  private async saveReport(report: any): Promise<void> {
    const outputPath = this.options.outputPath || path.join(process.cwd(), 'test-report.json');
    
    // Save JSON report
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Test report saved to: ${outputPath}`);

    // Generate HTML report if enabled
    if (this.config.reporting.htmlReport) {
      const htmlPath = outputPath.replace('.json', '.html');
      const htmlContent = this.generateHtmlReport(report);
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`📄 HTML report saved to: ${htmlPath}`);
    }

    // Generate JUnit XML report if enabled
    if (this.config.reporting.junitReport) {
      const xmlPath = outputPath.replace('.json', '.xml');
      const xmlContent = this.generateJUnitXmlReport(report);
      fs.writeFileSync(xmlPath, xmlContent);
      console.log(`📄 JUnit XML report saved to: ${xmlPath}`);
    }
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(report: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Plugin Test Report - ${report.pluginName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .card { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; flex: 1; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .warning { color: #ffc107; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Plugin Test Report</h1>
        <p><strong>Plugin:</strong> ${report.pluginName}</p>
        <p><strong>Timestamp:</strong> ${report.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="card">
            <h3>Test Summary</h3>
            <p class="${report.summary.failed === 0 ? 'passed' : 'failed'}">
                ${report.summary.passed}/${report.summary.total} tests passed
            </p>
            <p>Duration: ${report.summary.duration}ms</p>
        </div>
        <div class="card">
            <h3>Coverage</h3>
            <p>${this.calculateOverallCoverage(report.coverage)}% overall</p>
        </div>
    </div>
    
    <h2>Test Results by Category</h2>
    <table>
        <thead>
            <tr>
                <th>Category</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Total</th>
                <th>Coverage</th>
            </tr>
        </thead>
        <tbody>
            ${Object.entries(report.categories).map(([category, stats]: [string, any]) => `
                <tr>
                    <td>${category}</td>
                    <td class="passed">${stats.passed}</td>
                    <td class="failed">${stats.failed}</td>
                    <td>${stats.total}</td>
                    <td>${Math.round((stats.passed / stats.total) * 100)}%</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    ${report.recommendations.length > 0 ? `
    <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
            ${report.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
</body>
</html>`;
  }

  /**
   * Generate JUnit XML report
   */
  private generateJUnitXmlReport(report: any): string {
    const testCases = report.results.map((result: any) => `
        <testcase name="${result.testName}" classname="${result.category}" time="${(result.duration || 0) / 1000}">
            ${result.status === 'failed' ? `<failure message="${result.error || 'Test failed'}">${result.error || 'Test failed'}</failure>` : ''}
        </testcase>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
    <testsuite name="${report.pluginName}" tests="${report.summary.total}" failures="${report.summary.failed}" time="${report.summary.duration / 1000}">
        ${testCases}
    </testsuite>
</testsuites>`;
  }
}

/**
 * CLI setup
 */
const argv = yargs(hideBin(process.argv))
  .option('plugin-path', {
    alias: 'p',
    type: 'string',
    description: 'Path to plugin directory',
    default: '.'
  })
  .option('test-type', {
    alias: 't',
    type: 'string',
    choices: ['all', 'security', 'performance', 'functional', 'integration'],
    description: 'Type of tests to run',
    default: 'all'
  })
  .option('config', {
    alias: 'c',
    type: 'string',
    description: 'Path to test configuration file'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'Path to output report file'
  })
  .option('snyk-token', {
    alias: 's',
    type: 'string',
    description: 'Snyk API token for vulnerability scanning'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Enable verbose output',
    default: false
  })
  .option('ci', {
    type: 'boolean',
    description: 'Enable CI-friendly output',
    default: false
  })
  .help()
  .alias('help', 'h')
  .argv;

/**
 * Main execution
 */
async function main() {
  const runner = new PluginTestRunner({
    pluginPath: argv['plugin-path'],
    testType: argv['test-type'] as any,
    configPath: argv.config,
    outputPath: argv.output,
    snykToken: argv['snyk-token'],
    verbose: argv.verbose,
    ci: argv.ci
  });

  await runner.runTests();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { PluginTestRunner };