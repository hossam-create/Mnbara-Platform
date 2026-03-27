// ============================================================
// Plugin Validator - Validates plugin manifests
// ============================================================

import { PluginManifest, PluginType, PluginCategory } from '../types/plugin.types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CompatibilityResult {
  compatible: boolean;
  reason?: string;
}

export class PluginValidator {
  private platformVersion: string;

  constructor(platformVersion: string = '1.0.0') {
    this.platformVersion = platformVersion;
  }

  /**
   * Validate plugin manifest
   */
  async validateManifest(manifest: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!manifest.name) {
      errors.push('Missing required field: name');
    } else if (!this.isValidPluginName(manifest.name)) {
      errors.push('Invalid plugin name format. Must be scoped (e.g., @mnbara/plugin-name)');
    }

    if (!manifest.version) {
      errors.push('Missing required field: version');
    } else if (!this.isValidVersion(manifest.version)) {
      errors.push('Invalid version format. Must follow semantic versioning (e.g., 1.0.0)');
    }

    if (!manifest.type) {
      errors.push('Missing required field: type');
    } else if (!Object.values(PluginType).includes(manifest.type)) {
      errors.push(`Invalid plugin type. Must be one of: ${Object.values(PluginType).join(', ')}`);
    }

    if (!manifest.category) {
      errors.push('Missing required field: category');
    } else if (!Object.values(PluginCategory).includes(manifest.category)) {
      errors.push(`Invalid plugin category. Must be one of: ${Object.values(PluginCategory).join(', ')}`);
    }

    if (!manifest.entry) {
      errors.push('Missing required field: entry');
    }

    if (!manifest.mnbara) {
      errors.push('Missing required field: mnbara');
    } else {
      if (!manifest.mnbara.minVersion) {
        errors.push('Missing required field: mnbara.minVersion');
      }
    }

    // Optional fields validation
    if (manifest.hooks && !Array.isArray(manifest.hooks)) {
      errors.push('hooks must be an array');
    }

    if (manifest.permissions && !Array.isArray(manifest.permissions)) {
      errors.push('permissions must be an array');
    }

    if (manifest.config && typeof manifest.config !== 'object') {
      errors.push('config must be an object');
    }

    if (manifest.dependencies && typeof manifest.dependencies !== 'object') {
      errors.push('dependencies must be an object');
    }

    // Warnings
    if (!manifest.description) {
      warnings.push('Missing description field (recommended)');
    }

    if (!manifest.author) {
      warnings.push('Missing author field (recommended)');
    }

    if (!manifest.license) {
      warnings.push('Missing license field (recommended)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check platform compatibility
   */
  checkCompatibility(manifest: PluginManifest): CompatibilityResult {
    if (!manifest.mnbara || !manifest.mnbara.minVersion) {
      return {
        compatible: false,
        reason: 'Missing mnbara.minVersion in manifest'
      };
    }

    const minVersion = manifest.mnbara.minVersion;
    const maxVersion = manifest.mnbara.maxVersion;

    // Check minimum version
    if (this.compareVersions(this.platformVersion, minVersion) < 0) {
      return {
        compatible: false,
        reason: `Platform version ${this.platformVersion} is below minimum required ${minVersion}`
      };
    }

    // Check maximum version if specified
    if (maxVersion && this.compareVersions(this.platformVersion, maxVersion) > 0) {
      return {
        compatible: false,
        reason: `Platform version ${this.platformVersion} exceeds maximum supported ${maxVersion}`
      };
    }

    return {
      compatible: true
    };
  }

  /**
   * Validate plugin name format
   */
  private isValidPluginName(name: string): boolean {
    // Must be scoped: @scope/name
    const scopedPattern = /^@[a-z0-9-]+\/[a-z0-9-]+$/i;
    return scopedPattern.test(name);
  }

  /**
   * Validate version format (semantic versioning)
   */
  private isValidVersion(version: string): boolean {
    const semverPattern = /^\d+\.\d+\.\d+(-[a-z0-9]+)?$/i;
    return semverPattern.test(version);
  }

  /**
   * Compare two version strings
   * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  }
}

