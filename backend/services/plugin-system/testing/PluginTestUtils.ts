import { PluginManifest, PluginType, PluginCategory } from '@mnbara/plugin-registry';
import { PluginTestingFramework, PluginTestSuite, TestResult } from './PluginTestingFramework';

/**
 * Test Utilities for Plugin Testing Framework
 * Provides helper functions and common test scenarios
 */
export class PluginTestUtils {
  /**
   * Create a sample plugin manifest for testing
   */
  static createSampleManifest(overrides: Partial<PluginManifest> = {}): PluginManifest {
    return {
      name: 'test-plugin',
      version: '1.0.0',
      type: PluginType.CUSTOM,
      category: PluginCategory.ANALYTICS,
      description: 'A test plugin for demonstration purposes',
      main: 'index.js',
      author: 'Test Author',
      repository: 'https://github.com/test/test-plugin',
      permissions: ['read:config', 'ui:render'],
      dependencies: {
        'lodash': '^4.17.21',
      },
      hooks: {
        'app:startup': 'onAppStartup',
        'user:login': 'onUserLogin',
      },
      config: {
        apiKey: 'string',
        enabled: 'boolean',
      },
      ...overrides,
    };
  }

  /**
   * Create a complete test suite for a plugin
   */
  static createCompleteTestSuite(): PluginTestSuite {
    return {
      manifest: [
        {
          name: 'Required Fields Validation',
          type: 'required_fields',
          expected: {
            fields: ['name', 'version', 'main', 'type'],
          },
        },
        {
          name: 'Version Format Validation',
          type: 'version_format',
          expected: {
            pattern: /^\d+\.\d+\.\d+/,
          },
        },
        {
          name: 'Dependency Count Validation',
          type: 'dependency_validation',
          expected: {
            maxCount: 10,
          },
        },
        {
          name: 'Permission Validation',
          type: 'permission_validation',
          expected: {
            allowed: ['read:config', 'write:config', 'ui:render', 'ui:modal'],
          },
        },
      ],
      security: [
        {
          name: 'Permission Security Check',
          type: 'permission_validation',
        },
        {
          name: 'Sandbox Security Check',
          type: 'sandbox_validation',
        },
        {
          name: 'Dependency Security Scan',
          type: 'dependency_scan',
        },
        {
          name: 'Code Injection Test',
          type: 'code_injection_test',
        },
      ],
      functional: [
        {
          name: 'Plugin Initialization',
          testFunction: async (plugin) => {
            if (!plugin.init) {
              throw new Error('Plugin missing init function');
            }
            await plugin.init();
          },
        },
        {
          name: 'Plugin Configuration',
          testFunction: async (plugin) => {
            if (!plugin.configure) {
              throw new Error('Plugin missing configure function');
            }
            await plugin.configure({ test: 'config' });
          },
        },
        {
          name: 'Plugin Cleanup',
          testFunction: async (plugin) => {
            if (!plugin.destroy) {
              throw new Error('Plugin missing destroy function');
            }
            await plugin.destroy();
          },
        },
      ],
      performance: [
        {
          name: 'Plugin Load Performance',
          iterations: 10,
          maxDuration: 1000,
          testFunction: async (plugin) => {
            const start = Date.now();
            if (plugin.init) await plugin.init();
            const duration = Date.now() - start;
            if (duration > 100) {
              throw new Error(`Plugin initialization too slow: ${duration}ms`);
            }
          },
        },
        {
          name: 'Plugin Hook Performance',
          iterations: 50,
          maxDuration: 2000,
          testFunction: async (plugin) => {
            const start = Date.now();
            if (plugin.onTestHook) await plugin.onTestHook({ test: 'data' });
            const duration = Date.now() - start;
            if (duration > 50) {
              throw new Error(`Plugin hook execution too slow: ${duration}ms`);
            }
          },
        },
      ],
      integration: [
        {
          name: 'Plugin Manager Integration',
          testFunction: async (pluginName, pluginManager, hookSystem) => {
            const plugin = await pluginManager.getPlugin(pluginName);
            if (!plugin) {
              throw new Error('Plugin not found in manager');
            }
          },
        },
        {
          name: 'Hook System Integration',
          testFunction: async (pluginName, pluginManager, hookSystem) => {
            const testHook = 'test:integration';
            let hookExecuted = false;
            
            const handler = () => {
              hookExecuted = true;
            };
            
            await hookSystem.registerHook(testHook, handler);
            await hookSystem.executeHooks(testHook, { test: 'data' });
            
            if (!hookExecuted) {
              throw new Error('Hook was not executed');
            }
          },
        },
      ],
      hooks: [
        {
          name: 'Startup Hook Test',
          hookName: 'app:startup',
          testData: { app: 'test-app' },
        },
        {
          name: 'User Login Hook Test',
          hookName: 'user:login',
          testData: { userId: 'test-user', timestamp: Date.now() },
        },
        {
          name: 'Custom Hook Test',
          hookName: 'plugin:test',
          testData: { message: 'test message' },
        },
      ],
    };
  }

  /**
   * Create a minimal test suite for quick validation
   */
  static createMinimalTestSuite(): PluginTestSuite {
    return {
      manifest: [
        {
          name: 'Basic Manifest Validation',
          type: 'required_fields',
          expected: {
            fields: ['name', 'version', 'main'],
          },
        },
      ],
      security: [
        {
          name: 'Permission Check',
          type: 'permission_validation',
        },
      ],
      functional: [
        {
          name: 'Plugin Loads',
          testFunction: async (plugin) => {
            if (!plugin) {
              throw new Error('Plugin failed to load');
            }
          },
        },
      ],
      performance: [
        {
          name: 'Quick Performance Check',
          iterations: 5,
          maxDuration: 500,
          testFunction: async (plugin) => {
            const start = Date.now();
            if (plugin.init) await plugin.init();
            const duration = Date.now() - start;
            if (duration > 200) {
              throw new Error(`Plugin too slow: ${duration}ms`);
            }
          },
        },
      ],
      integration: [],
      hooks: [],
    };
  }

  /**
   * Create a security-focused test suite
   */
  static createSecurityTestSuite(): PluginTestSuite {
    return {
      manifest: [
        {
          name: 'Permission Validation',
          type: 'permission_validation',
          expected: {
            allowed: ['read:config', 'ui:render', 'hook:register'],
          },
        },
        {
          name: 'Dependency Validation',
          type: 'dependency_validation',
          expected: {
            maxCount: 5,
          },
        },
      ],
      security: [
        {
          name: 'Full Security Scan',
          type: 'permission_validation',
        },
        {
          name: 'Sandbox Validation',
          type: 'sandbox_validation',
        },
        {
          name: 'Dependency Security Scan',
          type: 'dependency_scan',
        },
        {
          name: 'Code Injection Test',
          type: 'code_injection_test',
        },
      ],
      functional: [],
      performance: [],
      integration: [],
      hooks: [],
    };
  }

  /**
   * Validate test results
   */
  static validateTestResults(results: TestResult[]): {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    successRate: number;
  } {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const total = results.length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    return {
      passed,
      failed,
      skipped,
      total,
      successRate,
    };
  }

  /**
   * Generate test report summary
   */
  static generateReportSummary(results: TestResult[]): string {
    const stats = this.validateTestResults(results);
    
    if (stats.failed === 0) {
      return `🎉 All ${stats.total} tests passed! (${stats.successRate.toFixed(1)}% success rate)`;
    } else if (stats.passed === 0) {
      return `❌ All ${stats.total} tests failed! (${stats.successRate.toFixed(1)}% success rate)`;
    } else {
      return `⚠️ ${stats.passed}/${stats.total} tests passed, ${stats.failed} failed (${stats.successRate.toFixed(1)}% success rate)`;
    }
  }

  /**
   * Create mock plugin for testing
   */
  static createMockPlugin(overrides: any = {}): any {
    return {
      name: 'mock-plugin',
      version: '1.0.0',
      init: async () => console.log('Plugin initialized'),
      configure: async (config: any) => console.log('Plugin configured:', config),
      destroy: async () => console.log('Plugin destroyed'),
      onAppStartup: async (data: any) => console.log('App startup:', data),
      onUserLogin: async (data: any) => console.log('User login:', data),
      onTestHook: async (data: any) => console.log('Test hook:', data),
      ...overrides,
    };
  }

  /**
   * Create mock plugin manifest
   */
  static createMockManifest(overrides: Partial<PluginManifest> = {}): PluginManifest {
    return {
      name: 'mock-plugin',
      version: '1.0.0',
      type: PluginType.CUSTOM,
      category: PluginCategory.ANALYTICS,
      description: 'A mock plugin for testing',
      main: 'index.js',
      author: 'Test Author',
      permissions: ['read:config'],
      ...overrides,
    };
  }
}