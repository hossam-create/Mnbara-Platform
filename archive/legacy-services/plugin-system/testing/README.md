# Plugin Testing Framework

The Plugin Testing Framework provides comprehensive testing capabilities for plugins, including security scanning, performance testing, functional testing, and integration testing.

## Features

- **Comprehensive Test Coverage**: Manifest validation, security scanning, functional testing, performance testing, integration testing, and hook testing
- **Security Scanning**: Integration with Snyk for vulnerability scanning of dependencies and code
- **Performance Testing**: Automated performance benchmarks with configurable thresholds
- **Test Configuration**: Flexible configuration system with presets for different environments
- **Multiple Report Formats**: JSON, HTML, and JUnit XML reports
- **CI/CD Integration**: Built-in support for continuous integration pipelines
- **Plugin Lifecycle Testing**: Complete testing from loading to execution

## Quick Start

### Using the CLI

```bash
# Run all tests
plugin-dev test ./my-plugin

# Run specific test types
plugin-dev test ./my-plugin security
plugin-dev test ./my-plugin performance
plugin-dev test ./my-plugin functional

# Run with custom configuration
plugin-dev test ./my-plugin all --config ./test-config.json
```

### Using the Testing Framework Directly

```typescript
import { PluginTestingFramework } from '@mnbara/plugin-system';
import { PluginManager } from '@mnbara/plugin-manager';
import { HookSystem } from '@mnbara/hook-system';

// Initialize testing framework
const pluginManager = new PluginManager();
const hookSystem = new HookSystem();
const testingFramework = new PluginTestingFramework(pluginManager, hookSystem);

// Generate test suite
const testSuite = testingFramework.generateTestSuite('my-plugin', {
  maxDependencies: 15,
  allowedPermissions: ['read', 'write', 'execute'],
  maxLoadTime: 2000,
  maxHookTime: 500
});

// Run tests
const results = await testingFramework.runPluginTests('my-plugin', testSuite);

// Generate report
const report = testingFramework.generateTestReport('my-plugin', results.results);
console.log(`Tests: ${report.summary.passed}/${report.summary.total} passed`);
```

### Using the Standalone Test Runner

```bash
# Run tests with standalone runner
npx plugin-test-runner --plugin-path ./my-plugin --test-type all

# Run with custom configuration
npx plugin-test-runner --plugin-path ./my-plugin --config ./test-config.json --output ./reports/

# Run in CI mode
npx plugin-test-runner --plugin-path ./my-plugin --ci --verbose
```

## Test Types

### 1. Manifest Tests
Validates plugin manifest structure and content:
- Required fields validation
- Version format validation
- Dependencies validation
- Permissions validation

### 2. Security Tests
Comprehensive security testing:
- Permission validation
- Sandbox validation
- Dependency vulnerability scanning
- Code injection testing
- Vulnerability scanning with Snyk integration

### 3. Functional Tests
Tests plugin functionality:
- Plugin loading
- Hook registration
- Configuration validation
- Basic functionality verification

### 4. Performance Tests
Performance benchmarking:
- Plugin load time
- Hook execution time
- Memory usage monitoring
- CPU usage monitoring

### 5. Integration Tests
Tests integration with core systems:
- Plugin manager integration
- Hook system integration
- Event system integration
- Database integration

### 6. Hook Tests
Tests plugin hook execution:
- Hook registration
- Hook execution
- Hook result validation
- Error handling

## Configuration

### Default Configuration

```json
{
  "security": {
    "maxVulnerabilities": {
      "critical": 0,
      "high": 0,
      "medium": 5,
      "low": 10
    },
    "dependencyScan": {
      "enabled": true,
      "failOnCritical": true,
      "failOnHigh": true,
      "maxMedium": 5
    }
  },
  "performance": {
    "maxLoadTime": 2000,
    "maxHookTime": 500,
    "iterations": 10,
    "thresholds": {
      "memoryUsage": 100,
      "cpuUsage": 80
    }
  },
  "execution": {
    "testTimeout": 30000,
    "maxConcurrency": 4,
    "retryFailed": true,
    "maxRetries": 3
  },
  "coverage": {
    "minCoverage": 80,
    "requiredCategories": ["manifest", "security", "functional"]
  },
  "reporting": {
    "htmlReport": true,
    "jsonReport": true,
    "junitReport": false,
    "includeMetrics": true
  }
}
```

### Configuration Presets

#### Strict Configuration (Production)
```json
{
  "security": {
    "maxVulnerabilities": {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 2
    }
  },
  "performance": {
    "maxLoadTime": 1000,
    "maxHookTime": 250
  },
  "coverage": {
    "minCoverage": 95,
    "requiredCategories": ["manifest", "security", "functional", "performance", "integration"]
  }
}
```

#### Development Configuration
```json
{
  "security": {
    "maxVulnerabilities": {
      "critical": 0,
      "high": 1,
      "medium": 10,
      "low": 20
    }
  },
  "performance": {
    "maxLoadTime": 5000,
    "maxHookTime": 1000
  },
  "coverage": {
    "minCoverage": 60,
    "requiredCategories": ["manifest", "security"]
  }
}
```

## Security Scanning

### Snyk Integration

The framework integrates with Snyk for comprehensive vulnerability scanning:

```typescript
// Configure Snyk token
const testingFramework = new PluginTestingFramework(
  pluginManager, 
  hookSystem, 
  'your-snyk-token'
);

// Or use environment variable
const testingFramework = new PluginTestingFramework(
  pluginManager, 
  hookSystem, 
  process.env.SNYK_TOKEN
);
```

### Vulnerability Severity Levels

- **Critical**: Must be fixed immediately (0 allowed)
- **High**: Should be fixed before deployment (0 allowed in production)
- **Medium**: Should be addressed (5-10 allowed depending on environment)
- **Low**: Informational (10-20 allowed depending on environment)

## Performance Testing

### Load Time Testing
Tests plugin loading performance:
```typescript
const performanceTests = [
  {
    name: 'Plugin Load Time',
    type: 'load_time',
    iterations: 10,
    maxDuration: 2000 // 2 seconds
  }
];
```

### Hook Execution Testing
Tests hook execution performance:
```typescript
const hookPerformanceTests = [
  {
    name: 'Hook Execution Time',
    type: 'hook_execution',
    iterations: 10,
    maxDuration: 500 // 500ms
  }
];
```

## Report Generation

### JSON Report
```json
{
  "pluginName": "my-plugin",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "summary": {
    "total": 25,
    "passed": 23,
    "failed": 2,
    "duration": 1250
  },
  "categories": {
    "manifest": { "passed": 4, "failed": 0, "total": 4 },
    "security": { "passed": 5, "failed": 1, "total": 6 },
    "functional": { "passed": 3, "failed": 0, "total": 3 },
    "performance": { "passed": 2, "failed": 1, "total": 3 },
    "integration": { "passed": 5, "failed": 0, "total": 5 },
    "hooks": { "passed": 4, "failed": 0, "total": 4 }
  },
  "coverage": {
    "manifest": { "total": 4, "passed": 4, "percentage": 100 },
    "security": { "total": 6, "passed": 5, "percentage": 83 },
    "functional": { "total": 3, "passed": 3, "percentage": 100 },
    "performance": { "total": 3, "passed": 2, "percentage": 67 },
    "integration": { "total": 5, "passed": 5, "percentage": 100 },
    "hooks": { "total": 4, "passed": 4, "percentage": 100 }
  },
  "recommendations": [
    "Address security vulnerabilities before deployment",
    "Optimize plugin performance to meet requirements"
  ],
  "results": [
    // Individual test results...
  ]
}
```

### HTML Report
The framework generates comprehensive HTML reports with:
- Test summary dashboard
- Category breakdown
- Individual test results
- Coverage metrics
- Recommendations
- Performance charts

### JUnit XML Report
For CI/CD integration:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
    <testsuite name="my-plugin" tests="25" failures="2" time="1.25">
        <testcase name="Permission Validation" classname="security" time="0.15"/>
        <testcase name="Vulnerability Scan" classname="security" time="0.85">
            <failure message="High severity vulnerabilities found: 1">High severity vulnerabilities found: 1</failure>
        </testcase>
        <!-- More test cases... -->
    </testsuite>
</testsuites>
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Plugin Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npx plugin-test-runner --plugin-path . --ci --verbose
      - uses: actions/upload-artifact@v2
        if: always()
        with:
          name: test-reports
          path: test-report.*
```

### Jenkins
```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh 'npx plugin-test-runner --plugin-path . --ci'
            }
        }
    }
    post {
        always {
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: '.',
                reportFiles: 'test-report.html',
                reportName: 'Plugin Test Report'
            ])
            junit 'test-report.xml'
        }
    }
}
```

## Best Practices

### 1. Test Early and Often
- Run tests during development
- Integrate testing into CI/CD pipeline
- Test before each release

### 2. Security First
- Always run security tests
- Fix critical and high vulnerabilities immediately
- Regular dependency updates

### 3. Performance Monitoring
- Set realistic performance thresholds
- Monitor performance trends
- Optimize based on test results

### 4. Comprehensive Coverage
- Test all plugin categories
- Include edge cases
- Test error handling

### 5. Configuration Management
- Use appropriate configuration presets
- Customize for your environment
- Version control test configurations

## Troubleshooting

### Common Issues

1. **Snyk Token Issues**
   - Ensure token is valid and has proper permissions
   - Check network connectivity
   - Verify token environment variable

2. **Performance Test Failures**
   - Adjust thresholds for your environment
   - Consider system load during testing
   - Use appropriate iterations

3. **Dependency Scan Failures**
   - Update dependencies regularly
   - Use secure dependency versions
   - Consider using dependency lock files

4. **Hook Test Failures**
   - Verify hook registration
   - Check hook implementation
   - Validate hook data format

### Debug Mode
Enable debug mode for detailed logging:
```bash
DEBUG=plugin-testing npx plugin-test-runner --plugin-path ./my-plugin
```

### Support
For issues and questions:
- Check the troubleshooting section
- Review test reports for specific failures
- Consult the plugin development documentation
- Contact the development team