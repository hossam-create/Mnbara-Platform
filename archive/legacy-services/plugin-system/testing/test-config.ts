/**
 * Plugin Testing Framework Configuration
 * Comprehensive configuration for plugin testing
 */

export interface TestConfig {
  // Security settings
  security: {
    // Snyk API token for vulnerability scanning
    snykToken?: string;
    // Maximum allowed vulnerabilities per severity level
    maxVulnerabilities: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    // Dependency scanning settings
    dependencyScan: {
      enabled: boolean;
      failOnCritical: boolean;
      failOnHigh: boolean;
      maxMedium: number;
    };
  };

  // Performance settings
  performance: {
    // Maximum load time in milliseconds
    maxLoadTime: number;
    // Maximum hook execution time in milliseconds
    maxHookTime: number;
    // Number of iterations for performance tests
    iterations: number;
    // Performance thresholds
    thresholds: {
      memoryUsage: number; // MB
      cpuUsage: number; // percentage
    };
  };

  // Test execution settings
  execution: {
    // Timeout for individual tests in milliseconds
    testTimeout: number;
    // Maximum number of concurrent tests
    maxConcurrency: number;
    // Retry failed tests
    retryFailed: boolean;
    // Number of retries
    maxRetries: number;
  };

  // Coverage settings
  coverage: {
    // Minimum required coverage percentage
    minCoverage: number;
    // Categories that must be tested
    requiredCategories: string[];
  };

  // Reporting settings
  reporting: {
    // Generate HTML report
    htmlReport: boolean;
    // Generate JSON report
    jsonReport: boolean;
    // Generate JUnit XML report
    junitReport: boolean;
    // Include metrics in report
    includeMetrics: boolean;
  };
}

/**
 * Default test configuration
 */
export const defaultTestConfig: TestConfig = {
  security: {
    maxVulnerabilities: {
      critical: 0,
      high: 0,
      medium: 5,
      low: 10
    },
    dependencyScan: {
      enabled: true,
      failOnCritical: true,
      failOnHigh: true,
      maxMedium: 5
    }
  },
  performance: {
    maxLoadTime: 2000,
    maxHookTime: 500,
    iterations: 10,
    thresholds: {
      memoryUsage: 100, // 100MB
      cpuUsage: 80 // 80%
    }
  },
  execution: {
    testTimeout: 30000,
    maxConcurrency: 4,
    retryFailed: true,
    maxRetries: 3
  },
  coverage: {
    minCoverage: 80,
    requiredCategories: ['manifest', 'security', 'functional']
  },
  reporting: {
    htmlReport: true,
    jsonReport: true,
    junitReport: false,
    includeMetrics: true
  }
};

/**
 * Strict test configuration (for production plugins)
 */
export const strictTestConfig: TestConfig = {
  ...defaultTestConfig,
  security: {
    ...defaultTestConfig.security,
    maxVulnerabilities: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 2
    }
  },
  performance: {
    ...defaultTestConfig.performance,
    maxLoadTime: 1000,
    maxHookTime: 250,
    thresholds: {
      memoryUsage: 50, // 50MB
      cpuUsage: 60 // 60%
    }
  },
  coverage: {
    minCoverage: 95,
    requiredCategories: ['manifest', 'security', 'functional', 'performance', 'integration']
  }
};

/**
 * Development test configuration (for development plugins)
 */
export const developmentTestConfig: TestConfig = {
  ...defaultTestConfig,
  security: {
    ...defaultTestConfig.security,
    maxVulnerabilities: {
      critical: 0,
      high: 1,
      medium: 10,
      low: 20
    },
    dependencyScan: {
      enabled: true,
      failOnCritical: true,
      failOnHigh: false,
      maxMedium: 10
    }
  },
  performance: {
    ...defaultTestConfig.performance,
    maxLoadTime: 5000,
    maxHookTime: 1000,
    thresholds: {
      memoryUsage: 200, // 200MB
      cpuUsage: 90 // 90%
    }
  },
  coverage: {
    minCoverage: 60,
    requiredCategories: ['manifest', 'security']
  }
};