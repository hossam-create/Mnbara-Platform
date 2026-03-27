"use strict";
/**
 * Plugin Security Scanner
 *
 * Provides vulnerability scanning and security analysis for plugins
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginSecurityScanner = void 0;
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class PluginSecurityScanner {
    constructor(snykToken) {
        this.npmRegistryUrl = 'https://registry.npmjs.org';
        this.snykApiUrl = 'https://snyk.io/api/v1';
        this.snykToken = snykToken;
    }
    /**
     * Perform comprehensive security scan of plugin
     */
    async scanPlugin(pluginPath, manifest) {
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
    async scanDependencies(pluginPath, dependencies) {
        const vulnerabilities = [];
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
                        const vulnData = vuln;
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
            }
            catch (auditError) {
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
        }
        catch (error) {
            console.warn(`Could not scan dependencies: ${error}`);
        }
        return vulnerabilities;
    }
    /**
     * Check individual dependency for vulnerabilities
     */
    async checkDependencyVulnerabilities(packageName, version) {
        const vulnerabilities = [];
        try {
            // Check npm registry for security advisories
            const response = await axios_1.default.get(`${this.npmRegistryUrl}/-/npm/v1/security/advisories/bulk`, {
                params: { package: packageName },
            });
            if (response.data && response.data.advisories) {
                for (const advisory of Object.values(response.data.advisories)) {
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
        }
        catch (error) {
            console.warn(`Could not check vulnerabilities for ${packageName}@${version}: ${error}`);
        }
        return vulnerabilities;
    }
    /**
     * Check for outdated dependencies
     */
    async checkOutdatedDependencies(pluginPath) {
        const outdated = [];
        try {
            const { stdout } = await execAsync('npm outdated --json', { cwd: pluginPath });
            const outdatedResult = JSON.parse(stdout);
            for (const [pkg, info] of Object.entries(outdatedResult)) {
                outdated.push({
                    package: pkg,
                    current: info.current,
                    wanted: info.wanted,
                    latest: info.latest,
                });
            }
        }
        catch (error) {
            // npm outdated returns non-zero exit code when there are outdated packages
            if (error.stdout) {
                try {
                    const outdatedResult = JSON.parse(error.stdout);
                    for (const [pkg, info] of Object.entries(outdatedResult)) {
                        outdated.push({
                            package: pkg,
                            current: info.current,
                            wanted: info.wanted,
                            latest: info.latest,
                        });
                    }
                }
                catch (parseError) {
                    console.warn('Could not parse outdated dependencies');
                }
            }
        }
        return outdated;
    }
    /**
     * Scan for secrets and sensitive data
     */
    async scanForSecrets(pluginPath) {
        const secrets = [];
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
        }
        catch (error) {
            console.warn(`Could not scan for secrets: ${error}`);
        }
        return secrets;
    }
    /**
     * Scan for malicious code patterns
     */
    async scanForMaliciousCode(pluginPath) {
        const maliciousCode = [];
        const dangerousPatterns = [
            {
                pattern: /eval\s*\(/gi,
                description: 'Use of eval() function',
                severity: 'high',
            },
            {
                pattern: /Function\s*\(\s*["\'].*["\']\s*\)/gi,
                description: 'Dynamic function creation',
                severity: 'high',
            },
            {
                pattern: /process\.exit\s*\(/gi,
                description: 'Process termination',
                severity: 'medium',
            },
            {
                pattern: /require\s*\(\s*["\']child_process["\']\s*\)/gi,
                description: 'Child process execution',
                severity: 'high',
            },
            {
                pattern: /fs\.writeFile.*\/etc\/passwd/gi,
                description: 'System file modification',
                severity: 'critical',
            },
            {
                pattern: /XMLHttpRequest.*file:\/\//gi,
                description: 'Local file access',
                severity: 'medium',
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
        }
        catch (error) {
            console.warn(`Could not scan for malicious code: ${error}`);
        }
        return maliciousCode;
    }
    /**
     * Calculate package size
     */
    async scanPackageSize(pluginPath) {
        let totalSize = 0;
        try {
            const files = await this.getAllFiles(pluginPath);
            for (const file of files) {
                const stats = await fs.stat(file);
                totalSize += stats.size;
            }
        }
        catch (error) {
            console.warn(`Could not calculate package size: ${error}`);
        }
        return { totalSize };
    }
    /**
     * Get all files in directory recursively
     */
    async getAllFiles(dir, extensions) {
        const files = [];
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                        const subFiles = await this.getAllFiles(fullPath, extensions);
                        files.push(...subFiles);
                    }
                }
                else if (entry.isFile()) {
                    if (!extensions || extensions.some(ext => entry.name.endsWith(ext))) {
                        files.push(fullPath);
                    }
                }
            }
        }
        catch (error) {
            console.warn(`Could not read directory ${dir}: ${error}`);
        }
        return files;
    }
    /**
     * Check if version is affected by vulnerability
     */
    isVersionAffected(version, vulnerableRange) {
        // Simple version range checking - in production, use a proper semver library
        try {
            // This is a simplified implementation
            if (vulnerableRange.includes('<')) {
                const maxVersion = vulnerableRange.replace('<', '').trim();
                return this.compareVersions(version, maxVersion) < 0;
            }
            return true; // Assume affected if can't parse
        }
        catch {
            return true;
        }
    }
    /**
     * Compare two version strings
     */
    compareVersions(version1, version2) {
        const v1 = version1.split('.').map(Number);
        const v2 = version2.split('.').map(Number);
        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const a = v1[i] || 0;
            const b = v2[i] || 0;
            if (a < b)
                return -1;
            if (a > b)
                return 1;
        }
        return 0;
    }
    /**
     * Get known vulnerabilities for specific packages
     */
    getKnownVulnerabilities(packageName, version) {
        const knownVulns = {
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
    calculateRiskScore(vulnerabilities, secrets, maliciousCode) {
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
exports.PluginSecurityScanner = PluginSecurityScanner;
//# sourceMappingURL=PluginSecurityScanner.js.map