"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginTestingFramework = void 0;
const PluginSecurityManager_1 = require("../security/PluginSecurityManager");
const PluginSecurityScanner_1 = require("./PluginSecurityScanner");
/**
 * Plugin Testing Framework
 * Provides comprehensive testing utilities for plugins
 */
class PluginTestingFramework {
    constructor(pluginManager, hookSystem, snykToken) {
        this.pluginManager = pluginManager;
        this.hookSystem = hookSystem;
        this.securityManager = new PluginSecurityManager_1.PluginSecurityManager();
        this.securityScanner = new PluginSecurityScanner_1.PluginSecurityScanner(snykToken);
        this.testResults = new Map();
    }
    /**
     * Run comprehensive plugin tests
     */
    async runPluginTests(pluginName, testSuite) {
        const startTime = Date.now();
        const results = [];
        console.log(`🧪 Running tests for plugin: ${pluginName}`);
        // Run manifest validation tests
        const manifestTests = await this.runManifestTests(pluginName, testSuite.manifest);
        results.push(...manifestTests);
        // Run security tests
        const securityTests = await this.runSecurityTests(pluginName, testSuite.security);
        results.push(...securityTests);
        // Run functional tests
        const functionalTests = await this.runFunctionalTests(pluginName, testSuite.functional);
        results.push(...functionalTests);
        // Run performance tests
        const performanceTests = await this.runPerformanceTests(pluginName, testSuite.performance);
        results.push(...performanceTests);
        // Run integration tests
        const integrationTests = await this.runIntegrationTests(pluginName, testSuite.integration);
        results.push(...integrationTests);
        // Run hook tests
        const hookTests = await this.runHookTests(pluginName, testSuite.hooks);
        results.push(...hookTests);
        const endTime = Date.now();
        const duration = endTime - startTime;
        const report = this.generateTestReport(pluginName, results);
        report.summary.duration = duration;
        this.testResults.set(pluginName, report);
        console.log(`\n📊 Test Report for ${pluginName}:`);
        console.log(`   ${report.summary.passed}/${report.summary.total} tests passed`);
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Coverage: ${this.calculateOverallCoverage(report.coverage)}%`);
        if (report.recommendations.length > 0) {
            console.log(`\n💡 Recommendations:`);
            report.recommendations.forEach(rec => console.log(`   - ${rec}`));
        }
        return report;
    }
    /**
     * Run manifest validation tests
     */
    async runManifestTests(pluginName, manifestTests) {
        const results = [];
        for (const test of manifestTests) {
            try {
                const result = await this.executeManifestTest(pluginName, test);
                results.push(result);
            }
            catch (error) {
                results.push({
                    testName: test.name,
                    category: 'manifest',
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: 0,
                });
            }
        }
        return results;
    }
    /**
     * Execute individual manifest test
     */
    async executeManifestTest(pluginName, test) {
        const startTime = Date.now();
        try {
            const plugin = await this.pluginManager.getPlugin(pluginName);
            if (!plugin) {
                throw new Error(`Plugin ${pluginName} not found`);
            }
            const manifest = plugin.manifest;
            switch (test.type) {
                case 'required_fields':
                    this.validateRequiredFields(manifest, test.expected);
                    break;
                case 'version_format':
                    this.validateVersionFormat(manifest.version, test.expected);
                    break;
                case 'dependency_validation':
                    this.validateDependencies(manifest.dependencies, test.expected);
                    break;
                case 'permission_validation':
                    this.validatePermissions(manifest.permissions, test.expected);
                    break;
                default:
                    throw new Error(`Unknown manifest test type: ${test.type}`);
            }
            const duration = Date.now() - startTime;
            return {
                testName: test.name,
                category: 'manifest',
                status: 'passed',
                duration,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                testName: test.name,
                category: 'manifest',
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            };
        }
    }
    /**
     * Run security tests
     */
    async runSecurityTests(pluginName, securityTests) {
        const results = [];
        for (const test of securityTests) {
            try {
                const result = await this.executeSecurityTest(pluginName, test);
                results.push(result);
            }
            catch (error) {
                results.push({
                    testName: test.name,
                    category: 'security',
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: 0,
                });
            }
        }
        return results;
    }
    /**
     * Execute individual security test
     */
    async executeSecurityTest(pluginName, test) {
        const startTime = Date.now();
        try {
            const plugin = await this.pluginManager.getPlugin(pluginName);
            if (!plugin) {
                throw new Error(`Plugin ${pluginName} not found`);
            }
            switch (test.type) {
                case 'permission_validation':
                    const validation = this.securityManager.validatePluginManifest(plugin.manifest);
                    if (!validation.valid) {
                        throw new Error(`Permission validation failed: ${validation.errors.join(', ')}`);
                    }
                    break;
                case 'sandbox_validation':
                    const sandbox = this.securityManager.createSandbox(pluginName, plugin.manifest.permissions || []);
                    if (!sandbox) {
                        throw new Error('Failed to create secure sandbox');
                    }
                    break;
                case 'dependency_scan':
                    await this.scanDependencies(plugin.manifest.dependencies || {});
                    break;
                case 'vulnerability_scan':
                    await this.vulnerabilityScan(plugin);
                    break;
                case 'code_injection_test':
                    await this.testCodeInjection(plugin);
                    break;
                default:
                    throw new Error(`Unknown security test type: ${test.type}`);
            }
            const duration = Date.now() - startTime;
            return {
                testName: test.name,
                category: 'security',
                status: 'passed',
                duration,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                testName: test.name,
                category: 'security',
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            };
        }
    }
    /**
     * Run functional tests
     */
    async runFunctionalTests(pluginName, functionalTests) {
        const results = [];
        for (const test of functionalTests) {
            try {
                const result = await this.executeFunctionalTest(pluginName, test);
                results.push(result);
            }
            catch (error) {
                results.push({
                    testName: test.name,
                    category: 'functional',
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: 0,
                });
            }
        }
        return results;
    }
    /**
     * Execute individual functional test
     */
    async executeFunctionalTest(pluginName, test) {
        const startTime = Date.now();
        try {
            const plugin = await this.pluginManager.getPlugin(pluginName);
            if (!plugin) {
                throw new Error(`Plugin ${pluginName} not found`);
            }
            // Execute the test function
            if (test.testFunction) {
                await test.testFunction(plugin);
            }
            const duration = Date.now() - startTime;
            return {
                testName: test.name,
                category: 'functional',
                status: 'passed',
                duration,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                testName: test.name,
                category: 'functional',
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            };
        }
    }
    /**
     * Run performance tests
     */
    async runPerformanceTests(pluginName, performanceTests) {
        const results = [];
        for (const test of performanceTests) {
            try {
                const result = await this.executePerformanceTest(pluginName, test);
                results.push(result);
            }
            catch (error) {
                results.push({
                    testName: test.name,
                    category: 'performance',
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: 0,
                });
            }
        }
        return results;
    }
    /**
     * Execute individual performance test
     */
    async executePerformanceTest(pluginName, test) {
        const startTime = Date.now();
        try {
            const plugin = await this.pluginManager.getPlugin(pluginName);
            if (!plugin) {
                throw new Error(`Plugin ${pluginName} not found`);
            }
            const measurements = [];
            // Run multiple iterations
            for (let i = 0; i < test.iterations; i++) {
                const iterationStart = Date.now();
                if (test.testFunction) {
                    await test.testFunction(plugin);
                }
                const iterationDuration = Date.now() - iterationStart;
                measurements.push(iterationDuration);
            }
            const avgDuration = measurements.reduce((a, b) => a + b, 0) / measurements.length;
            const maxDuration = Math.max(...measurements);
            const minDuration = Math.min(...measurements);
            const success = avgDuration <= test.maxDuration;
            const duration = Date.now() - startTime;
            return {
                testName: test.name,
                category: 'performance',
                status: success ? 'passed' : 'failed',
                duration,
                metrics: {
                    avgDuration,
                    maxDuration,
                    minDuration,
                    iterations: test.iterations,
                },
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                testName: test.name,
                category: 'performance',
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            };
        }
    }
    /**
     * Run integration tests
     */
    async runIntegrationTests(pluginName, integrationTests) {
        const results = [];
        for (const test of integrationTests) {
            try {
                const result = await this.executeIntegrationTest(pluginName, test);
                results.push(result);
            }
            catch (error) {
                results.push({
                    testName: test.name,
                    category: 'integration',
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: 0,
                });
            }
        }
        return results;
    }
    /**
     * Execute individual integration test
     */
    async executeIntegrationTest(pluginName, test) {
        const startTime = Date.now();
        try {
            // Execute the integration test
            if (test.testFunction) {
                await test.testFunction(pluginName, this.pluginManager, this.hookSystem);
            }
            const duration = Date.now() - startTime;
            return {
                testName: test.name,
                category: 'integration',
                status: 'passed',
                duration,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                testName: test.name,
                category: 'integration',
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            };
        }
    }
    /**
     * Run hook tests
     */
    async runHookTests(pluginName, hookTests) {
        const results = [];
        for (const test of hookTests) {
            try {
                const result = await this.executeHookTest(pluginName, test);
                results.push(result);
            }
            catch (error) {
                results.push({
                    testName: test.name,
                    category: 'hooks',
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: 0,
                });
            }
        }
        return results;
    }
    /**
     * Execute individual hook test
     */
    async executeHookTest(pluginName, test) {
        const startTime = Date.now();
        try {
            const plugin = await this.pluginManager.getPlugin(pluginName);
            if (!plugin) {
                throw new Error(`Plugin ${pluginName} not found`);
            }
            // Test hook registration and execution
            const testData = test.testData || {};
            const result = await this.hookSystem.executeHooks(test.hookName, testData);
            // Validate results
            if (test.expectedResult) {
                this.validateHookResult(result, test.expectedResult);
            }
            const duration = Date.now() - startTime;
            return {
                testName: test.name,
                category: 'hooks',
                status: 'passed',
                duration,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                testName: test.name,
                category: 'hooks',
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            };
        }
    }
    /**
     * Vulnerability scan method
     */
    async vulnerabilityScan(plugin) {
        const scanResults = await this.securityScanner.scanPlugin(plugin.manifest);
        if (scanResults.critical > 0) {
            throw new Error(`Critical vulnerabilities found: ${scanResults.critical}`);
        }
        if (scanResults.high > 0) {
            throw new Error(`High severity vulnerabilities found: ${scanResults.high}`);
        }
        if (scanResults.medium > 5) {
            throw new Error(`Too many medium severity vulnerabilities: ${scanResults.medium}`);
        }
    }
    /**
     * Helper methods for validation
     */
    validateRequiredFields(manifest, expected) {
        const requiredFields = expected.fields || ['name', 'version', 'main'];
        for (const field of requiredFields) {
            if (!manifest[field]) {
                throw new Error(`Required field '${field}' is missing`);
            }
        }
    }
    validateVersionFormat(version, expected) {
        const pattern = expected.pattern || /^\d+\.\d+\.\d+/;
        if (!pattern.test(version)) {
            throw new Error(`Version format is invalid: ${version}`);
        }
    }
    validateDependencies(dependencies = {}, expected) {
        if (expected.maxCount && Object.keys(dependencies).length > expected.maxCount) {
            throw new Error(`Too many dependencies: ${Object.keys(dependencies).length} > ${expected.maxCount}`);
        }
    }
    validatePermissions(permissions = [], expected) {
        if (expected.allowed && expected.allowed.length > 0) {
            for (const permission of permissions) {
                if (!expected.allowed.includes(permission)) {
                    throw new Error(`Permission '${permission}' is not allowed`);
                }
            }
        }
    }
    async scanDependencies(dependencies) {
        const scanResults = await this.securityScanner.scanDependencies(dependencies);
        if (scanResults.critical > 0) {
            throw new Error(`Critical vulnerabilities in dependencies: ${scanResults.critical}`);
        }
        if (scanResults.high > 0) {
            throw new Error(`High severity vulnerabilities in dependencies: ${scanResults.high}`);
        }
        if (scanResults.medium > 3) {
            throw new Error(`Too many medium severity vulnerabilities in dependencies: ${scanResults.medium}`);
        }
    }
    async testCodeInjection(plugin) {
        // Placeholder for code injection testing
        // In a real implementation, this would test for common injection vulnerabilities
    }
    validateHookResult(result, expected) {
        if (!result) {
            throw new Error('Hook result is null or undefined');
        }
        if (expected.success !== undefined && result.success !== expected.success) {
            throw new Error(`Expected success to be ${expected.success}, got ${result.success}`);
        }
        if (expected.data !== undefined) {
            if (JSON.stringify(result.data) !== JSON.stringify(expected.data)) {
                throw new Error(`Expected data ${JSON.stringify(expected.data)}, got ${JSON.stringify(result.data)}`);
            }
        }
        if (expected.errors && expected.errors.length > 0) {
            if (!result.errors || result.errors.length === 0) {
                throw new Error('Expected errors but none were returned');
            }
            for (const expectedError of expected.errors) {
                const found = result.errors.some((error) => error.message.includes(expectedError.message) ||
                    error.code === expectedError.code);
                if (!found) {
                    throw new Error(`Expected error not found: ${expectedError.message || expectedError.code}`);
                }
            }
        }
        if (expected.plugins && expected.plugins.length > 0) {
            if (!result.plugins || result.plugins.length === 0) {
                throw new Error('Expected plugin results but none were returned');
            }
            for (const expectedPlugin of expected.plugins) {
                const found = result.plugins.some((plugin) => plugin.name === expectedPlugin.name &&
                    plugin.status === expectedPlugin.status);
                if (!found) {
                    throw new Error(`Expected plugin result not found: ${expectedPlugin.name} (${expectedPlugin.status})`);
                }
            }
        }
    }
    /**
     * Generate comprehensive test suite configuration
     */
    generateTestSuite(pluginName, options = {}) {
        const suite = {
            manifest: [
                {
                    name: 'Required Fields Validation',
                    type: 'required_fields',
                    expected: {
                        fields: ['name', 'version', 'main', 'type']
                    }
                },
                {
                    name: 'Version Format Validation',
                    type: 'version_format',
                    expected: {
                        pattern: /^\d+\.\d+\.\d+/
                    }
                },
                {
                    name: 'Dependencies Validation',
                    type: 'dependencies_validation',
                    expected: {
                        maxCount: options.maxDependencies || 20
                    }
                },
                {
                    name: 'Permissions Validation',
                    type: 'permissions_validation',
                    expected: {
                        allowed: options.allowedPermissions || ['read', 'write', 'execute']
                    }
                }
            ],
            security: [
                {
                    name: 'Permission Validation',
                    type: 'permission_validation'
                },
                {
                    name: 'Sandbox Validation',
                    type: 'sandbox_validation'
                },
                {
                    name: 'Dependency Scan',
                    type: 'dependency_scan'
                },
                {
                    name: 'Vulnerability Scan',
                    type: 'vulnerability_scan'
                },
                {
                    name: 'Code Injection Test',
                    type: 'code_injection_test'
                }
            ],
            functional: [
                {
                    name: 'Plugin Loading',
                    type: 'plugin_loading',
                    testFunction: async (plugin) => {
                        if (!plugin.isLoaded) {
                            throw new Error('Plugin failed to load');
                        }
                    }
                },
                {
                    name: 'Hook Registration',
                    type: 'hook_registration',
                    testFunction: async (plugin) => {
                        if (!plugin.manifest.hooks || Object.keys(plugin.manifest.hooks).length === 0) {
                            throw new Error('No hooks registered');
                        }
                    }
                }
            ],
            performance: [
                {
                    name: 'Plugin Load Time',
                    type: 'load_time',
                    iterations: 5,
                    maxDuration: options.maxLoadTime || 2000
                },
                {
                    name: 'Hook Execution Time',
                    type: 'hook_execution',
                    iterations: 10,
                    maxDuration: options.maxHookTime || 500
                }
            ],
            integration: [
                {
                    name: 'Plugin Manager Integration',
                    type: 'plugin_manager',
                    testFunction: async (pluginName, pluginManager, hookSystem) => {
                        const plugin = await pluginManager.getPlugin(pluginName);
                        if (!plugin) {
                            throw new Error('Plugin not found in manager');
                        }
                    }
                },
                {
                    name: 'Hook System Integration',
                    type: 'hook_system',
                    testFunction: async (pluginName, pluginManager, hookSystem) => {
                        const testResult = await hookSystem.executeHooks('test:integration', { pluginName });
                        if (!testResult.success) {
                            throw new Error('Hook system integration failed');
                        }
                    }
                }
            ],
            hooks: [
                {
                    name: 'Hook Execution Test',
                    hookName: 'test:execution',
                    testData: { test: true },
                    expectedResult: {
                        success: true,
                        data: { test: true }
                    }
                }
            ]
        };
        return suite;
    }
    /**
     * Generate comprehensive test report
     */
    generateTestReport(pluginName, results) {
        const categories = ['manifest', 'security', 'functional', 'performance', 'integration', 'hooks'];
        const categoryResults = {};
        for (const category of categories) {
            const categoryTests = results.filter(r => r.category === category);
            categoryResults[category] = {
                passed: categoryTests.filter(r => r.status === 'passed').length,
                failed: categoryTests.filter(r => r.status === 'failed').length,
                total: categoryTests.length
            };
        }
        const totalPassed = results.filter(r => r.status === 'passed').length;
        const totalFailed = results.filter(r => r.status === 'failed').length;
        const totalTests = results.length;
        const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
        return {
            pluginName,
            timestamp: new Date().toISOString(),
            summary: {
                total: totalTests,
                passed: totalPassed,
                failed: totalFailed,
                duration: totalDuration
            },
            categories: categoryResults,
            results,
            coverage: this.calculateTestCoverage(results),
            recommendations: this.generateRecommendations(results)
        };
    }
    /**
     * Calculate test coverage
     */
    calculateTestCoverage(results) {
        const categories = ['manifest', 'security', 'functional', 'performance', 'integration', 'hooks'];
        const coverage = {};
        for (const category of categories) {
            const categoryTests = results.filter(r => r.category === category);
            const passed = categoryTests.filter(r => r.status === 'passed').length;
            const total = categoryTests.length;
            coverage[category] = {
                total,
                passed,
                percentage: total > 0 ? Math.round((passed / total) * 100) : 0
            };
        }
        return coverage;
    }
    /**
     * Generate test recommendations
     */
    generateRecommendations(results) {
        const recommendations = [];
        const failedTests = results.filter(r => r.status === 'failed');
        const failedCategories = new Set(failedTests.map(r => r.category));
        if (failedCategories.has('security')) {
            recommendations.push('Address security vulnerabilities before deployment');
        }
        if (failedCategories.has('performance')) {
            recommendations.push('Optimize plugin performance to meet requirements');
        }
        if (failedCategories.has('manifest')) {
            recommendations.push('Fix plugin manifest validation issues');
        }
        if (failedCategories.has('functional')) {
            recommendations.push('Resolve functional test failures');
        }
        if (failedCategories.has('integration')) {
            recommendations.push('Ensure proper integration with core systems');
        }
        if (failedCategories.has('hooks')) {
            recommendations.push('Fix hook execution issues');
        }
        if (recommendations.length === 0) {
            recommendations.push('All tests passed - plugin is ready for deployment');
        }
        return recommendations;
    }
    calculateOverallCoverage(coverage) {
        const categories = Object.keys(coverage);
        if (categories.length === 0)
            return 0;
        const totalPercentage = categories.reduce((sum, category) => {
            return sum + (coverage[category]?.percentage || 0);
        }, 0);
        return Math.round(totalPercentage / categories.length);
    }
    generateTestSummary(results) {
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.filter(r => r.status === 'failed').length;
        const total = results.length;
        if (failed === 0) {
            return `All ${total} tests passed! ✅`;
        }
        else if (passed === 0) {
            return `All ${total} tests failed! ❌`;
        }
        else {
            return `${passed}/${total} tests passed, ${failed} failed ⚠️`;
        }
    }
    /**
     * Get test results for a plugin
     */
    getTestResults(pluginName) {
        return this.testResults.get(pluginName);
    }
    /**
     * Clear test results for a plugin
     */
    clearTestResults(pluginName) {
        this.testResults.delete(pluginName);
    }
}
exports.PluginTestingFramework = PluginTestingFramework;
//# sourceMappingURL=PluginTestingFramework.js.map