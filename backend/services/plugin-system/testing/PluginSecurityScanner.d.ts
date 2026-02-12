/**
 * Plugin Security Scanner
 *
 * Provides vulnerability scanning and security analysis for plugins
 */
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
    riskScore: number;
}
export declare class PluginSecurityScanner {
    private npmRegistryUrl;
    private snykApiUrl;
    private snykToken?;
    constructor(snykToken?: string);
    /**
     * Perform comprehensive security scan of plugin
     */
    scanPlugin(pluginPath: string, manifest: any): Promise<SecurityScanResult>;
    /**
     * Scan dependencies for known vulnerabilities
     */
    private scanDependencies;
    /**
     * Check individual dependency for vulnerabilities
     */
    private checkDependencyVulnerabilities;
    /**
     * Check for outdated dependencies
     */
    private checkOutdatedDependencies;
    /**
     * Scan for secrets and sensitive data
     */
    private scanForSecrets;
    /**
     * Scan for malicious code patterns
     */
    private scanForMaliciousCode;
    /**
     * Calculate package size
     */
    private scanPackageSize;
    /**
     * Get all files in directory recursively
     */
    private getAllFiles;
    /**
     * Check if version is affected by vulnerability
     */
    private isVersionAffected;
    /**
     * Compare two version strings
     */
    private compareVersions;
    /**
     * Get known vulnerabilities for specific packages
     */
    private getKnownVulnerabilities;
    /**
     * Calculate overall risk score (0-100)
     */
    private calculateRiskScore;
}
//# sourceMappingURL=PluginSecurityScanner.d.ts.map