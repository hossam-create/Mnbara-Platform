import { PluginManager } from '@mnbara/plugin-manager';
import { HookSystem } from '@mnbara/hook-system';
/**
 * Plugin Testing Framework
 * Provides comprehensive testing utilities for plugins
 */
export declare class PluginTestingFramework {
    private pluginManager;
    private hookSystem;
    private securityManager;
    private securityScanner;
    private testResults;
    constructor(pluginManager: PluginManager, hookSystem: HookSystem, snykToken?: string);
    /**
     * Run comprehensive plugin tests
     */
    runPluginTests(pluginName: string, testSuite: PluginTestSuite): Promise<TestReport>;
    /**
     * Run manifest validation tests
     */
    private runManifestTests;
    /**
     * Execute individual manifest test
     */
    private executeManifestTest;
    /**
     * Run security tests
     */
    private runSecurityTests;
    /**
     * Execute individual security test
     */
    private executeSecurityTest;
    /**
     * Run functional tests
     */
    private runFunctionalTests;
    /**
     * Execute individual functional test
     */
    private executeFunctionalTest;
    /**
     * Run performance tests
     */
    private runPerformanceTests;
    /**
     * Execute individual performance test
     */
    private executePerformanceTest;
    /**
     * Run integration tests
     */
    private runIntegrationTests;
    /**
     * Execute individual integration test
     */
    private executeIntegrationTest;
    /**
     * Run hook tests
     */
    private runHookTests;
    /**
     * Execute individual hook test
     */
    private executeHookTest;
    /**
     * Vulnerability scan method
     */
    private vulnerabilityScan;
    /**
     * Helper methods for validation
     */
    private validateRequiredFields;
    private validateVersionFormat;
    private validateDependencies;
    private validatePermissions;
    private scanDependencies;
    private testCodeInjection;
    private validateHookResult;
    /**
     * Generate comprehensive test suite configuration
     */
    generateTestSuite(pluginName: string, options?: TestSuiteOptions): PluginTestSuite;
    /**
     * Generate comprehensive test report
     */
    generateTestReport(pluginName: string, results: TestResult[]): TestReport;
    /**
     * Calculate test coverage
     */
    private calculateTestCoverage;
    /**
     * Generate test recommendations
     */
    private generateRecommendations;
    private calculateOverallCoverage;
    private generateTestSummary;
    /**
     * Get test results for a plugin
     */
    getTestResults(pluginName: string): TestReport | undefined;
    /**
     * Clear test results for a plugin
     */
    clearTestResults(pluginName: string): void;
}
export interface PluginTestSuite {
    manifest: ManifestTest[];
    security: SecurityTest[];
    functional: FunctionalTest[];
    performance: PerformanceTest[];
    integration: IntegrationTest[];
    hooks: HookTest[];
}
export interface TestResult {
    testName: string;
    category: 'manifest' | 'security' | 'functional' | 'performance' | 'integration' | 'hooks';
    status: 'passed' | 'failed' | 'skipped';
    error?: string;
    duration: number;
    metrics?: any;
}
export interface TestReport extends EnhancedTestReport {
}
export interface ManifestTest {
    name: string;
    type: 'required_fields' | 'version_format' | 'dependency_validation' | 'permission_validation';
    expected: any;
}
export interface SecurityTest {
    name: string;
    type: 'permission_validation' | 'sandbox_validation' | 'dependency_scan' | 'vulnerability_scan' | 'code_injection_test';
    expected?: any;
}
export interface FunctionalTest {
    name: string;
    testFunction?: (plugin: any) => Promise<void>;
}
export interface PerformanceTest {
    name: string;
    iterations: number;
    maxDuration: number;
    testFunction?: (plugin: any) => Promise<void>;
}
export interface IntegrationTest {
    name: string;
    testFunction?: (pluginName: string, pluginManager: PluginManager, hookSystem: HookSystem) => Promise<void>;
}
export interface HookTest {
    name: string;
    hookName: string;
    testData?: any;
    expectedResult?: any;
}
export interface TestSuiteOptions {
    maxDependencies?: number;
    allowedPermissions?: string[];
    maxLoadTime?: number;
    maxHookTime?: number;
}
export interface TestCoverage {
    [category: string]: {
        total: number;
        passed: number;
        percentage: number;
    };
}
export interface EnhancedTestReport {
    pluginName: string;
    timestamp: string;
    summary: {
        total: number;
        passed: number;
        failed: number;
        duration: number;
    };
    categories: Record<string, {
        passed: number;
        failed: number;
        total: number;
    }>;
    results: TestResult[];
    coverage: TestCoverage;
    recommendations: string[];
}
//# sourceMappingURL=PluginTestingFramework.d.ts.map