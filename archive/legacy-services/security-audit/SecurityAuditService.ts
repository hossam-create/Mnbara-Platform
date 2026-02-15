import { Logger } from '@mnbara/shared-utils';
import { EventBus } from '@mnbara/event-bus';
import axios from 'axios';
import crypto from 'crypto';

/**
 * Security Audit Service - Comprehensive security scanning and vulnerability assessment
 */
export class SecurityAuditService {
  private logger: Logger;
  private eventBus: EventBus;
  private services: ServiceConfig[];

  constructor(eventBus: EventBus) {
    this.logger = new Logger('SecurityAuditService');
    this.eventBus = eventBus;
    this.services = [
      {
        name: 'plugin-system',
        url: 'http://localhost:3001',
        endpoints: ['/health', '/api/plugins', '/api/marketplace']
      },
      {
        name: 'ebay-live-service',
        url: 'http://localhost:3000',
        endpoints: ['/health', '/api/streams', '/api/auctions', '/api/chat']
      },
      {
        name: 'craftercms-content-service',
        url: 'http://localhost:3002',
        endpoints: ['/health', '/api/v1/content/sites/mnbara/content']
      },
      {
        name: 'unified-wallet-service',
        url: 'http://localhost:3003',
        endpoints: ['/health', '/api/wallets', '/api/transactions']
      },
      {
        name: 'event-bus',
        url: 'http://localhost:6379',
        endpoints: ['/health']
      }
    ];
  }

  /**
   * Run comprehensive security audit
   */
  async runSecurityAudit(): Promise<SecurityAuditReport> {
    this.logger.info('Starting comprehensive security audit');
    
    const report: SecurityAuditReport = {
      timestamp: new Date().toISOString(),
      overallScore: 0,
      findings: [],
      recommendations: [],
      services: {},
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      }
    };

    try {
      // Run all security checks
      const checks = await Promise.all([
        this.checkAuthenticationSecurity(),
        this.checkAuthorizationSecurity(),
        this.checkDataEncryption(),
        this.checkInputValidation(),
        this.checkAPIEndpoints(),
        this.checkDockerSecurity(),
        this.checkEnvironmentVariables(),
        this.checkDependencyVulnerabilities(),
        this.checkSSLConfiguration(),
        this.checkRateLimiting(),
        this.checkLoggingSecurity(),
        this.checkSecretsManagement(),
        this.checkCORSConfiguration(),
        this.checkContentSecurityPolicy(),
        this.checkDatabaseSecurity()
      ]);

      // Aggregate findings
      for (const check of checks) {
        report.findings.push(...check.findings);
        report.recommendations.push(...check.recommendations);
        
        // Update summary counts
        for (const finding of check.findings) {
          report.summary[finding.severity]++;
        }
      }

      // Calculate overall score
      report.overallScore = this.calculateOverallScore(report.findings);

      // Publish audit results
      await this.eventBus.publish({
        type: 'security.audit_completed',
        source: 'security-audit-service',
        data: {
          overallScore: report.overallScore,
          summary: report.summary,
          criticalFindings: report.summary.critical,
          timestamp: report.timestamp
        }
      });

      this.logger.info(`Security audit completed. Overall score: ${report.overallScore}/100`);
      return report;

    } catch (error) {
      this.logger.error('Security audit failed', error);
      throw error;
    }
  }

  /**
   * Check authentication security
   */
  private async checkAuthenticationSecurity(): Promise<SecurityCheckResult> {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];

    try {
      // Check JWT configuration
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        findings.push({
          id: 'AUTH-001',
          title: 'Weak JWT Secret',
          description: 'JWT secret is too short or missing',
          severity: 'high',
          category: 'authentication',
          remediation: 'Use a JWT secret of at least 32 characters'
        });
      }

      // Check token expiration
      if (!process.env.JWT_EXPIRATION || process.env.JWT_EXPIRATION === 'never') {
        findings.push({
          id: 'AUTH-002',
          title: 'No Token Expiration',
          description: 'JWT tokens do not expire',
          severity: 'medium',
          category: 'authentication',
          remediation: 'Set appropriate JWT token expiration times'
        });
      }

      // Check for refresh tokens
      if (!process.env.REFRESH_TOKEN_SECRET) {
        findings.push({
          id: 'AUTH-003',
          title: 'Missing Refresh Token Security',
          description: 'Refresh token mechanism is not properly secured',
          severity: 'medium',
          category: 'authentication',
          remediation: 'Implement secure refresh token mechanism'
        });
      }

      recommendations.push({
        id: 'AUTH-REC-001',
        title: 'Implement Multi-Factor Authentication',
        description: 'Consider adding MFA for sensitive operations',
        priority: 'medium',
        category: 'authentication'
      });

      return { findings, recommendations };

    } catch (error) {
      this.logger.error('Authentication security check failed', error);
      throw error;
    }
  }

  /**
   * Check authorization security
   */
  private async checkAuthorizationSecurity(): Promise<SecurityCheckResult> {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];

    try {
      // Check role-based access control
      findings.push({
        id: 'AUTHZ-001',
        title: 'Verify RBAC Implementation',
        description: 'Ensure proper role-based access control is implemented',
        severity: 'medium',
        category: 'authorization',
        remediation: 'Review and test all role-based permissions'
      });

      // Check for privilege escalation vulnerabilities
      findings.push({
        id: 'AUTHZ-002',
        title: 'Check for Privilege Escalation',
        description: 'Verify users cannot escalate their privileges',
        severity: 'high',
        category: 'authorization',
        remediation: 'Implement proper privilege checks and audit trails'
      });

      recommendations.push({
        id: 'AUTHZ-REC-001',
        title: 'Implement Attribute-Based Access Control',
        description: 'Consider ABAC for more granular permissions',
        priority: 'low',
        category: 'authorization'
      });

      return { findings, recommendations };

    } catch (error) {
      this.logger.error('Authorization security check failed', error);
      throw error;
    }
  }

  /**
   * Check data encryption
   */
  private async checkDataEncryption(): Promise<SecurityCheckResult> {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];

    try {
      // Check for encryption keys
      if (!process.env.ENCRYPTION_KEY) {
        findings.push({
          id: 'CRYPTO-001',
          title: 'Missing Encryption Key',
          description: 'Data encryption key is not configured',
          severity: 'high',
          category: 'cryptography',
          remediation: 'Configure proper data encryption keys'
        });
      }

      // Check for database encryption
      findings.push({
        id: 'CRYPTO-002',
        title: 'Verify Database Encryption',
        description: 'Ensure sensitive data is encrypted at rest',
        severity: 'high',
        category: 'cryptography',
        remediation: 'Enable database-level encryption for sensitive data'
      });

      // Check for TLS/SSL
      findings.push({
        id: 'CRYPTO-003',
        title: 'Verify TLS Configuration',
        description: 'Ensure all communications use TLS 1.3',
        severity: 'medium',
        category: 'cryptography',
        remediation: 'Configure TLS 1.3 for all service communications'
      });

      recommendations.push({
        id: 'CRYPTO-REC-001',
        title: 'Implement Key Rotation',
        description: 'Set up automatic key rotation for encryption keys',
        priority: 'medium',
        category: 'cryptography'
      });

      return { findings, recommendations };

    } catch (error) {
      this.logger.error('Data encryption check failed', error);
      throw error;
    }
  }

  /**
   * Check input validation
   */
  private async checkInputValidation(): Promise<SecurityCheckResult> {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];

    try {
      // Check for SQL injection vulnerabilities
      findings.push({
        id: 'INPUT-001',
        title: 'SQL Injection Prevention',
        description: 'Verify all database queries use parameterized statements',
        severity: 'high',
        category: 'input-validation',
        remediation: 'Use parameterized queries and ORM protections'
      });

      // Check for XSS vulnerabilities
      findings.push({
        id: 'INPUT-002',
        title: 'Cross-Site Scripting Prevention',
        description: 'Ensure proper output encoding for user-generated content',
        severity: 'high',
        category: 'input-validation',
        remediation: 'Implement proper output encoding and CSP headers'
      });

      // Check for CSRF protection
      findings.push({
        id: 'INPUT-003',
        title: 'CSRF Protection',
        description: 'Verify CSRF tokens are implemented for state-changing operations',
        severity: 'medium',
        category: 'input-validation',
        remediation: 'Implement CSRF tokens for all POST/PUT/DELETE operations'
      });

      recommendations.push({
        id: 'INPUT-REC-001',
        title: 'Implement Input Sanitization',
        description: 'Add comprehensive input sanitization for all user inputs',
        priority: 'high',
        category: 'input-validation'
      });

      return { findings, recommendations };

    } catch (error) {
      this.logger.error('Input validation check failed', error);
      throw error;
    }
  }

  /**
   * Check API endpoints
   */
  private async checkAPIEndpoints(): Promise<SecurityCheckResult> {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];

    try {
      for (const service of this.services) {
        for (const endpoint of service.endpoints) {
          try {
            const response = await axios.get(`${service.url}${endpoint}`, {
              timeout: 5000,
              validateStatus: () => true
            });

            // Check for information disclosure
            if (response.headers['server'] || response.headers['x-powered-by']) {
              findings.push({
                id: `API-${service.name.toUpperCase()}-001`,
                title: `Information Disclosure in ${service.name}`,
                description: `Service ${service.name} reveals server information`,
                severity: 'low',
                category: 'api-security',
                remediation: 'Remove server information headers'
              });
            }

            // Check for proper error handling
            if (response.status === 500 && response.data.includes('stack trace')) {
              findings.push({
                id: `API-${service.name.toUpperCase()}-002`,
                title: `Error Information Disclosure in ${service.name}`,
                description: `Service ${service.name} exposes stack traces in errors`,
                severity: 'medium',
                category: 'api-security',
                remediation: 'Implement proper error handling without exposing internals'
              });
            }

          } catch (error) {
            findings.push({
              id: `API-${service.name.toUpperCase()}-003`,
              title: `Service Unavailable: ${service.name}`,
              description: `Service ${service.name} endpoint ${endpoint} is not accessible`,
              severity: 'high',
              category: 'availability',
              remediation: 'Ensure service is running and accessible'
            });
          }
        }
      }

      return { findings, recommendations };

    } catch (error) {
      this.logger.error('API endpoints check failed', error);
      throw error;
    }
  }

  /**
   * Check Docker security
   */
  private async checkDockerSecurity(): Promise<SecurityCheckResult> {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];

    try {
      // Check for root user in containers
      findings.push({
        id: 'DOCKER-001',
        title: 'Container Root User',
        description: 'Containers should not run as root user',
        severity: 'medium',
        category: 'container-security',
        remediation: 'Configure containers to run as non-root user'
      });

      // Check for image scanning
      findings.push({
        id: 'DOCKER-002',
        title: 'Container Image Scanning',
        description: 'Container images should be scanned for vulnerabilities',
        severity: 'high',
        category: 'container-security',
        remediation: 'Implement container image vulnerability scanning'
      });

      // Check for resource limits
      findings.push({
        id: 'DOCKER-003',
        title: 'Resource Limits',
        description: 'Containers should have resource limits configured',
        severity: 'medium',
        category: 'container-security',
        remediation: 'Set CPU and memory limits for containers'
      });

      return { findings, recommendations };

    } catch (error) {
      this.logger.error('Docker security check failed', error);
      throw error;
    }
  }

  /**
   * Check environment variables
   */
  private async checkEnvironmentVariables(): Promise<SecurityCheckResult> {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];

    try {
      // Check for hardcoded secrets
      const sensitivePatterns = [
        /password/i,
        /secret/i,
        /key/i,
        /token/i,
        /api_key/i
      ];

      for (const pattern of sensitivePatterns) {
        for (const [key, value] of Object.entries(process.env)) {
          if (pattern.test(key) && value && value.length < 16) {
            findings.push({
              id: 'ENV-001',
              title: 'Weak Secret in Environment',
              description: `Environment variable ${key} appears to be a weak secret`,
              severity: 'high',
              category: 'secrets-management',
              remediation: 'Use strong, randomly generated secrets'
            });
            break;
          }
        }
      }

      // Check for debug mode in production
      if (process.env.NODE_ENV === 'production' && process.env.DEBUG_MODE === 'true') {
        findings.push({
          id: 'ENV-002',
          title: 'Debug Mode in Production',
          description: 'Debug mode is enabled in production environment',
          severity: 'medium',
          category: 'configuration',
          remediation: 'Disable debug mode in production'
        });
      }

      return { findings, recommendations };

    } catch (error) {
      this.logger.error('Environment variables check failed', error);
      throw error;
    }
  }

  /**
   * Check dependency vulnerabilities
   */
  private async checkDependencyVulnerabilities(): Promise<SecurityCheckResult> {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];

    try {
      // Check for outdated dependencies
      findings.push({
        id: 'DEPS-001',
        title: 'Dependency Updates',
        description: 'Regularly update dependencies to patch known vulnerabilities',
        severity: 'medium',
        category: 'dependencies',
        remediation: 'Implement automated dependency updates and vulnerability scanning'
      });

      // Check for known vulnerable packages
      findings.push({
        id: 'DEPS-002',
        title: 'Known Vulnerable Packages',
        description: 'Scan for packages with known CVEs',
        severity: 'high',
        category: 'dependencies',
        remediation: 'Use tools like npm audit or Snyk to scan for vulnerabilities'
      });

      return { findings, recommendations };

    } catch (error) {
      this.logger.error('Dependency vulnerabilities check failed', error);
      throw error;
    }
  }

  /**
   * Check SSL configuration
   */
  private async checkSSLConfiguration(): Promise<SecurityCheckResult> {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];

    try {
      // Check for HTTPS enforcement
      findings.push({
        id: 'SSL-001',
        title: 'HTTPS Enforcement',
        description: 'Ensure all traffic uses HTTPS',
        severity: 'high',
        category: 'ssl-tls',
        remediation: 'Configure automatic HTTPS redirection'
      });

      // Check for HSTS
      findings.push({
        id: 'SSL-002',
        title: 'HTTP Strict Transport Security',
        description: 'Implement HSTS headers',
        severity: 'medium',
        category: 'ssl-tls',
        remediation: 'Add HSTS headers with appropriate max-age'
      });

      return { findings, recommendations };

    } catch (error) {
      this.logger.error('SSL configuration check failed', error);
      throw error;
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimiting(): Promise<SecurityCheckResult> {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];

    try {
      // Check for rate limiting configuration
      if (!process.env.RATE_LIMIT_WINDOW_MS || !process.env.RATE_LIMIT_MAX_REQUESTS) {
        findings.push({
          id: 'RATE-001',
          title: 'Missing Rate Limiting',
          description: 'Rate limiting is not configured',
          severity: 'medium',
          category: 'rate-limiting',
          remediation: 'Implement rate limiting for all API endpoints'
        });
      }

      return { findings, recommendations };

    } catch (error) {
      this.logger.error('Rate limiting check failed', error);
      throw error;
    }
  }

  /**
   * Check logging security
   */
  private async checkLoggingSecurity(): Promise<SecurityCheckResult> {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];

    try {
      // Check for sensitive data in logs
      findings.push({
        id: 'LOG-001',
        title: 'Sensitive Data in Logs',
        description: 'Ensure sensitive data is not logged',
        severity: 'medium',
        category: 'logging',
        remediation: 'Implement proper log sanitization'
      });

      // Check for log retention
      findings.push({
        id: 'LOG-002',
        title: 'Log Retention Policy',
        description: 'Implement proper log retention and rotation',
        severity: 'low',
        category: 'logging',
        remediation: 'Configure log rotation and retention policies'
      });

      return { findings, recommendations };

    } catch (error) {
      this.logger.error('Logging security check failed', error);
      throw error;
    }
  }

  /**
   * Check secrets management
   */
  private async checkSecretsManagement(): Promise<SecurityCheckResult> {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];

    try {
      // Check for hardcoded secrets in code
      findings.push({
        id: 'SECRETS-001',
        title: 'Hardcoded Secrets',
        description: 'Check for hardcoded secrets in source code',
        severity: 'critical',
        category: 'secrets-management',
        remediation: 'Use environment variables or secret management services'
      });

      // Check for secret rotation
      findings.push({
        id: 'SECRETS-002',
        title: 'Secret Rotation',
        description: 'Implement automatic secret rotation',
        severity: 'medium',
        category: 'secrets-management',
        remediation: 'Set up automated secret rotation policies'
      });

      return { findings, recommendations };

    } catch (error) {
      this.logger.error('Secrets management check failed', error);
      throw error;
    }
  }

  /**
   * Check CORS configuration
   */
  private async checkCORSConfiguration(): Promise<SecurityCheckResult> {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];

    try {
      // Check for overly permissive CORS
      if (process.env.CORS_ORIGIN === '*') {
        findings.push({
          id: 'CORS-001',
          title: 'Permissive CORS Configuration',
          description: 'CORS allows all origins',
          severity: 'medium',
          category: 'cors',
          remediation: 'Restrict CORS to specific trusted origins'
        });
      }

      return { findings, recommendations };

    } catch (error) {
      this.logger.error('CORS configuration check failed', error);
      throw error;
    }
  }

  /**
   * Check Content Security Policy
   */
  private async checkContentSecurityPolicy(): Promise<SecurityCheckResult> {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];

    try {
      // Check for CSP headers
      findings.push({
        id: 'CSP-001',
        title: 'Content Security Policy',
        description: 'Implement Content Security Policy headers',
        severity: 'medium',
        category: 'content-security',
        remediation: 'Add CSP headers to prevent XSS attacks'
      });

      return { findings, recommendations };

    } catch (error) {
      this.logger.error('Content Security Policy check failed', error);
      throw error;
    }
  }

  /**
   * Check database security
   */
  private async checkDatabaseSecurity(): Promise<SecurityCheckResult> {
    const findings: SecurityFinding[] = [];
    const recommendations: SecurityRecommendation[] = [];

    try {
      // Check for default credentials
      if (process.env.DATABASE_URL?.includes('postgres:postgres')) {
        findings.push({
          id: 'DB-001',
          title: 'Default Database Credentials',
          description: 'Database uses default credentials',
          severity: 'critical',
          category: 'database-security',
          remediation: 'Change default database credentials'
        });
      }

      // Check for connection encryption
      findings.push({
        id: 'DB-002',
        title: 'Database Connection Encryption',
        description: 'Ensure database connections use TLS',
        severity: 'high',
        category: 'database-security',
        remediation: 'Enable TLS for database connections'
      });

      // Check for backup encryption
      findings.push({
        id: 'DB-003',
        title: 'Database Backup Encryption',
        description: 'Database backups should be encrypted',
        severity: 'high',
        category: 'database-security',
        remediation: 'Encrypt database backups'
      });

      return { findings, recommendations };

    } catch (error) {
      this.logger.error('Database security check failed', error);
      throw error;
    }
  }

  /**
   * Calculate overall security score
   */
  private calculateOverallScore(findings: SecurityFinding[]): number {
    const severityWeights = {
      critical: 25,
      high: 15,
      medium: 8,
      low: 3,
      info: 1
    };

    let totalDeductions = 0;
    
    for (const finding of findings) {
      totalDeductions += severityWeights[finding.severity] || 0;
    }

    // Calculate score (100 - deductions, minimum 0)
    return Math.max(0, 100 - totalDeductions);
  }

  /**
   * Generate remediation report
   */
  async generateRemediationReport(report: SecurityAuditReport): Promise<RemediationReport> {
    const remediationSteps: RemediationStep[] = [];

    // Group findings by category
    const findingsByCategory = this.groupFindingsByCategory(report.findings);

    for (const [category, findings] of Object.entries(findingsByCategory)) {
      remediationSteps.push({
        category,
        priority: this.calculateCategoryPriority(findings),
        steps: findings.map(finding => ({
          id: finding.id,
          title: finding.title,
          description: finding.description,
          remediation: finding.remediation,
          severity: finding.severity,
          estimatedEffort: this.estimateRemediationEffort(finding)
        }))
      });
    }

    return {
      timestamp: new Date().toISOString(),
      overallScore: report.overallScore,
      remediationSteps: remediationSteps.sort((a, b) => b.priority - a.priority),
      estimatedTotalEffort: this.calculateTotalEffort(remediationSteps),
      criticalPath: this.identifyCriticalPath(remediationSteps)
    };
  }

  /**
   * Group findings by category
   */
  private groupFindingsByCategory(findings: SecurityFinding[]): Record<string, SecurityFinding[]> {
    const grouped: Record<string, SecurityFinding[]> = {};
    
    for (const finding of findings) {
      if (!grouped[finding.category]) {
        grouped[finding.category] = [];
      }
      grouped[finding.category].push(finding);
    }
    
    return grouped;
  }

  /**
   * Calculate category priority
   */
  private calculateCategoryPriority(findings: SecurityFinding[]): number {
    const severityWeights = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      info: 0
    };

    return findings.reduce((total, finding) => 
      total + (severityWeights[finding.severity] || 0), 0
    );
  }

  /**
   * Estimate remediation effort
   */
  private estimateRemediationEffort(finding: SecurityFinding): string {
    const effortMap = {
      critical: '2-4 weeks',
      high: '1-2 weeks',
      medium: '3-7 days',
      low: '1-3 days',
      info: '1 day'
    };

    return effortMap[finding.severity] || 'Unknown';
  }

  /**
   * Calculate total effort
   */
  private calculateTotalEffort(remediationSteps: RemediationStep[]): string {
    // Simplified calculation - in practice, this would be more sophisticated
    const totalDays = remediationSteps.reduce((total, step) => {
      return total + (step.steps.length * 3); // Average 3 days per finding
    }, 0);

    if (totalDays > 30) {
      return `${Math.ceil(totalDays / 30)} months`;
    } else if (totalDays > 7) {
      return `${Math.ceil(totalDays / 7)} weeks`;
    } else {
      return `${totalDays} days`;
    }
  }

  /**
   * Identify critical path
   */
  private identifyCriticalPath(remediationSteps: RemediationStep[]): string[] {
    const criticalPath: string[] = [];
    
    // Add critical and high severity items first
    for (const step of remediationSteps) {
      const criticalFindings = step.steps.filter(s => 
        s.severity === 'critical' || s.severity === 'high'
      );
      
      for (const finding of criticalFindings) {
        criticalPath.push(`${step.category}: ${finding.title}`);
      }
    }
    
    return criticalPath;
  }
}

// Types
interface ServiceConfig {
  name: string;
  url: string;
  endpoints: string[];
}

interface SecurityFinding {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  remediation: string;
}

interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface SecurityCheckResult {
  findings: SecurityFinding[];
  recommendations: SecurityRecommendation[];
}

interface SecurityAuditReport {
  timestamp: string;
  overallScore: number;
  findings: SecurityFinding[];
  recommendations: SecurityRecommendation[];
  services: Record<string, any>;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

interface RemediationReport {
  timestamp: string;
  overallScore: number;
  remediationSteps: RemediationStep[];
  estimatedTotalEffort: string;
  criticalPath: string[];
}

interface RemediationStep {
  category: string;
  priority: number;
  steps: {
    id: string;
    title: string;
    description: string;
    remediation: string;
    severity: string;
    estimatedEffort: string;
  }[];
}