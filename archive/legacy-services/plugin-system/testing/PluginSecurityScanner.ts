/**
 * Plugin Security Scanner
 * 
 * Provides vulnerability scanning and security analysis for plugins
 */

import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface Vulnerability {
  package: string;
  version: string;
  vulnerability: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  patchedIn?: string;
  cve?: string;
}

export interface SecurityScanResult {
  vulnerabilities: Vulnerability[];
  dependencyCount: number;
  outdatedDependencies: number;
  totalSize: number;
  scanDuration: number;
  riskScore: number; // 0-100, higher is riskier
}

export class PluginSecurityScanner {
  private npmRegistryUrl = 'https://registry.npmjs.org';
  private snykApiUrl = 'https://snyk.io/api/v1';
  private snykToken?: string;

  constructor(snykToken?: string) {
    this.snykToken = snykToken;
  }

  /**
   * Perform comprehensive security scan of plugin
   */
  async scanPlugin(pluginPath: string, manifest: any): Promise<SecurityScanResult> {
    const startTime = Date.now();
    
    console.log(`🔍 Scanning plugin at ${pluginPath} for security vulnerabilities...`);

    const results = await Promise.all([
      this.scanDependencies(pluginPath, manifest.dependencies || {}),
      this.scanPackageSize(pluginPath),
      this.scanForSecrets(pluginPath),
      this.scanForMaliciousCode(pluginPath),
    ]);

    const [vulnerabilities, sizeInfo, secrets, maliciousCode] = results;
    
    const scanDuration = Date.now() - startTime;
    const riskScore = this.calculateRiskScore(vulnerabilities, secrets, maliciousCode);

    return {
      vulnerabilities: [...vulnerabilities, ...secrets, ...maliciousCode],
      dependencyCount: Object.keys(manifest.dependencies || {}).length,
      outdatedDependencies: vulnerabilities.filter(v => v.severity !== 'low').length,
      totalSize: sizeInfo.totalSize,
      scanDuration,
      riskScore,
    };
  }

  /**
   * Scan dependencies for known vulnerabilities
   */
  private async scanDependencies(pluginPath: string, dependencies: Record<string, string>): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];
    const packageJsonPath = path.join(pluginPath, 'package.json');

    try {
      // Check if package.json exists
      await fs.access(packageJsonPath);
      
      // Run npm audit
      try {
        const { stdout } = await execAsync('npm audit --json', { cwd: pluginPath });
        const auditResult = JSON.parse(stdout);
        
        if (auditResult.vulnerabilities) {
          for (const [pkg, vuln] of Object.entries(auditResult.vulnerabilities)) {
            const vulnData = vuln as any;
            vulnerabilities.push({
              package: pkg,
              version: vulnData.findings[0]?.version || 'unknown',
              vulnerability: vulnData.title,
              severity: vulnData.severity,
              description: vulnData.overview,
              patchedIn: vulnData.range,
              cve: vulnData.cves?.[0],
            });
          }
        }
      } catch (auditError) {
        console.warn('npm audit failed, falling back to manual dependency check');
      }

      // Manual dependency version checks
      for (const [pkg, version] of Object.entries(dependencies)) {
        const vuln = await this.checkDependencyVulnerabilities(pkg, version);
        vulnerabilities.push(...vuln);
      }

      // Check for outdated dependencies
      const outdated = await this.checkOutdatedDependencies(pluginPath);
      for (const dep of outdated) {
        vulnerabilities.push({
          package: dep.package,
          version: dep.current,
          vulnerability: 'Outdated dependency',
          severity: 'medium',
          description: `Package is outdated. Current: ${dep.current}, Latest: ${dep.latest}`,
          patchedIn: dep.latest,
        });
      }

    } catch (error) {
      console.warn(`Could not scan dependencies: ${error}`);
    }

    return vulnerabilities;
  }

  /**
   * Check individual dependency for vulnerabilities
   */
  private async checkDependencyVulnerabilities(packageName: string, version: string): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];

    try {
      // Check npm registry for security advisories
      const response = await axios.get(`${this.npmRegistryUrl}/-/npm/v1/security/advisories/bulk`, {
        params: { package: packageName },
      });

      if (response.data && response.data.advisories) {
        for (const advisory of Object.values(response.data.advisories) as any[]) {
          if (this.isVersionAffected(version, advisory.vulnerable_versions)) {
            vulnerabilities.push({
              package: packageName,
              version,
              vulnerability: advisory.title,
              severity: advisory.severity,
              description: advisory.overview,
              patchedIn: advisory.patched_versions,
              cve: advisory.cves?.[0],
            });
          }
        }
      }

      // Check for known vulnerable packages
      const knownVulnerabilities = this.getKnownVulnerabilities(packageName, version);
      vulnerabilities.push(...knownVulnerabilities);

    } catch (error) {
      console.warn(`Could not check vulnerabilities for ${packageName}@${version}: ${error}`);
    }

    return vulnerabilities;
  }

  /**
   * Check for outdated dependencies
   */
  private async checkOutdatedDependencies(pluginPath: string): Promise<any[]> {
    const outdated: any[] = [];

    try {
      const { stdout } = await execAsync('npm outdated --json', { cwd: pluginPath });
      const outdatedResult = JSON.parse(stdout);
      
      for (const [pkg, info] of Object.entries(outdatedResult)) {
        outdated.push({
          package: pkg,
          current: (info as any).current,
          wanted: (info as any).wanted,
          latest: (info as any).latest,
        });
      }
    } catch (error) {
      // npm outdated returns non-zero exit code when there are outdated packages
      if (error.stdout) {
        try {
          const outdatedResult = JSON.parse(error.stdout);
          for (const [pkg, info] of Object.entries(outdatedResult)) {
            outdated.push({
              package: pkg,
              current: (info as any).current,
              wanted: (info as any).wanted,
              latest: (info as any).latest,
            });
          }
        } catch (parseError) {
          console.warn('Could not parse outdated dependencies');
        }
      }
    }

    return outdated;
  }

  /**
   * Scan for secrets and sensitive data
   */
  private async scanForSecrets(pluginPath: string): Promise<Vulnerability[]> {
    const secrets: Vulnerability[] = [];
    const secretPatterns = [
      /api[_-]?key["\s]*[:=]["\s]*([a-zA-Z0-9_-]{20,})/gi,
      /password["\s]*[:=]["\s]*([a-zA-Z0-9!@#$%^&*]{8,})/gi,
      /token["\s]*[:=]["\s]*([a-zA-Z0-9_-]{20,})/gi,
      /secret["\s]*[:=]["\s]*([a-zA-Z0-9_-]{20,})/gi,
      /aws[_-]?access[_-]?key["\s]*[:=]["\s]*(AKIA[0-9A-Z]{16})/gi,
      /aws[_-]?secret[_-]?access[_-]?key["\s]*[:=]["\s]*([a-zA-Z0-9/+=]{40})/gi,
    ];

    try {
      const files = await this.getAllFiles(pluginPath, ['.js', '.ts', '.json', '.env']);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        
        for (const pattern of secretPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            secrets.push({
              package: path.basename(file),
              version: '1.0.0',
              vulnerability: 'Hardcoded secrets detected',
              severity: 'high',
              description: `Found ${matches.length} potential secrets in ${file}`,
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Could not scan for secrets: ${error}`);
    }

    return secrets;
  }

  /**
   * Scan for malicious code patterns
   */
  private async scanForMaliciousCode(pluginPath: string): Promise<Vulnerability[]> {
    const maliciousCode: Vulnerability[] = [];
    const dangerousPatterns = [
      {
        pattern: /eval\s*\(/gi,
        description: 'Use of eval() function',
        severity: 'high' as const,
      },
      {
        pattern: /Function\s*\(\s*["\'].*["\']\s*\)/gi,
        description: 'Dynamic function creation',
        severity: 'high' as const,
      },
      {
        pattern: /process\.exit\s*\(/gi,
        description: 'Process termination',
        severity: 'medium' as const,
      },
      {
        pattern: /require\s*\(\s*["\']child_process["\']\s*\)/gi,
        description: 'Child process execution',
        severity: 'high' as const,
      },
      {
        pattern: /fs\.writeFile.*\/etc\/passwd/gi,
        description: 'System file modification',
        severity: 'critical' as const,
      },
      {
        pattern: /XMLHttpRequest.*file:\/\//gi,
        description: 'Local file access',
        severity: 'medium' as const,
      },
    ];

    try {
      const files = await this.getAllFiles(pluginPath, ['.js', '.ts']);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        
        for (const { pattern, description, severity } of dangerousPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            maliciousCode.push({
              package: path.basename(file),
              version: '1.0.0',
              vulnerability: description,
              severity,
              description: `Found ${matches.length} instances in ${file}`,
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Could not scan for malicious code: ${error}`);
    }

    return maliciousCode;
  }

  /**
   * Calculate package size
   */
  private async scanPackageSize(pluginPath: string): Promise<{ totalSize: number }> {
    let totalSize = 0;

    try {
      const files = await this.getAllFiles(pluginPath);
      
      for (const file of files) {
        const stats = await fs.stat(file);
        totalSize += stats.size;
      }
    } catch (error) {
      console.warn(`Could not calculate package size: ${error}`);
    }

    return { totalSize };
  }

  /**
   * Get all files in directory recursively
   */
  private async getAllFiles(dir: string, extensions?: string[]): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            const subFiles = await this.getAllFiles(fullPath, extensions);
            files.push(...subFiles);
          }
        } else if (entry.isFile()) {
          if (!extensions || extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${dir}: ${error}`);
    }

    return files;
  }

  /**
   * Check if version is affected by vulnerability
   */
  private isVersionAffected(version: string, vulnerableRange: string): boolean {
    // Simple version range checking - in production, use a proper semver library
    try {
      // This is a simplified implementation
      if (vulnerableRange.includes('<')) {
        const maxVersion = vulnerableRange.replace('<', '').trim();
        return this.compareVersions(version, maxVersion) < 0;
      }
      return true; // Assume affected if can't parse
    } catch {
      return true;
    }
  }

  /**
   * Compare two version strings
   */
  private compareVersions(version1: string, version2: string): number {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const a = v1[i] || 0;
      const b = v2[i] || 0;
      
      if (a < b) return -1;
      if (a > b) return 1;
    }
    
    return 0;
  }

  /**
   * Get known vulnerabilities for specific packages
   */
  private getKnownVulnerabilities(packageName: string, version: string): Vulnerability[] {
    const knownVulns: Record<string, Array<{ versions: string; severity: 'low' | 'medium' | 'high' | 'critical'; description: string }>> = {
      'lodash': [
        {
          versions: '<4.17.21',
          severity: 'high',
          description: 'Prototype pollution vulnerability in lodash',
        },
      ],
      'express': [
        {
          versions: '<4.17.3',
          severity: 'medium',
          description: 'Open redirect vulnerability in express',
        },
      ],
      'axios': [
        {
          versions: '<0.21.1',
          severity: 'high',
          description: 'Server-side request forgery vulnerability',
        },
      ],
    };

    const vulns = knownVulns[packageName] || [];
    return vulns
      .filter(vuln => this.isVersionAffected(version, vuln.versions))
      .map(vuln => ({
        package: packageName,
        version,
        vulnerability: vuln.description,
        severity: vuln.severity,
        description: vuln.description,
      }));
  }

  /**
   * Calculate overall risk score (0-100)
   */
  private calculateRiskScore(vulnerabilities: Vulnerability[], secrets: Vulnerability[], maliciousCode: Vulnerability[]): number {
    let score = 0;

    // Critical vulnerabilities add 25 points each
    score += vulnerabilities.filter(v => v.severity === 'critical').length * 25;
    
    // High vulnerabilities add 15 points each
    score += vulnerabilities.filter(v => v.severity === 'high').length * 15;
    
    // Medium vulnerabilities add 10 points each
    score += vulnerabilities.filter(v => v.severity === 'medium').length * 10;
    
    // Low vulnerabilities add 5 points each
    score += vulnerabilities.filter(v => v.severity === 'low').length * 5;

    // Secrets add 20 points each
    score += secrets.length * 20;

    // Malicious code adds 30 points each
    score += maliciousCode.length * 30;

    // Cap at 100
    return Math.min(score, 100);
  }
}