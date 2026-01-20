import { SettlementConfig } from '../types/Settlement.types';

/**
 * Auction Settlement Configuration
 * 
 * Environment variable overrides with sensible defaults
 * All thresholds configurable for different deployment environments
 */
export const settlementConfig: SettlementConfig = {
  // Appeals window duration
  appealWindowHours: parseInt(process.env.SETTLEMENT_APPEAL_WINDOW_HOURS || '48'),
  
  // Auto-finalization settings
  autoFinalizeAfterAppealWindow: process.env.SETTLEMENT_AUTO_FINALIZE === 'true',
  
  // Appeal requirements
  requireEvidenceForAppeal: process.env.SETTLEMENT_REQUIRE_EVIDENCE === 'true',
  maxAppealDescriptionLength: parseInt(process.env.SETTLEMENT_MAX_APPEAL_LENGTH || '1000'),
  maxEvidenceFiles: parseInt(process.env.SETTLEMENT_MAX_EVIDENCE_FILES || '5'),
  
  // Who can appeal
  allowedAppealRoles: (process.env.SETTLEMENT_ALLOWED_APPEAL_ROLES?.split(',') || ['BUYER', 'SELLER']) as ('BUYER' | 'SELLER' | 'OBSERVER')[]
};

/**
 * Reload settlement configuration from environment variables
 * Call this to update settings without restart
 */
export function reloadSettlementConfig(): void {
  const newConfig: SettlementConfig = {
    appealWindowHours: parseInt(process.env.SETTLEMENT_APPEAL_WINDOW_HOURS || '48'),
    autoFinalizeAfterAppealWindow: process.env.SETTLEMENT_AUTO_FINALIZE === 'true',
    requireEvidenceForAppeal: process.env.SETTLEMENT_REQUIRE_EVIDENCE === 'true',
    maxAppealDescriptionLength: parseInt(process.env.SETTLEMENT_MAX_APPEAL_LENGTH || '1000'),
    maxEvidenceFiles: parseInt(process.env.SETTLEMENT_MAX_EVIDENCE_FILES || '5'),
    allowedAppealRoles: (process.env.SETTLEMENT_ALLOWED_APPEAL_ROLES?.split(',') || ['BUYER', 'SELLER']) as ('BUYER' | 'SELLER' | 'OBSERVER')[]
  };
  
  // Update config object
  Object.assign(settlementConfig, newConfig);
  
  console.log('[Settlement] Configuration reloaded:', newConfig);
}

/**
 * Validate settlement configuration
 */
export function validateSettlementConfig(): boolean {
  const config = settlementConfig;
  
  if (config.appealWindowHours < 1) {
    console.error('[Settlement] Invalid appealWindowHours:', config.appealWindowHours);
    return false;
  }
  
  if (config.appealWindowHours > 168) { // 7 days max
    console.error('[Settlement] appealWindowHours cannot exceed 168 (7 days)');
    return false;
  }
  
  if (config.maxAppealDescriptionLength < 50) {
    console.error('[Settlement] maxAppealDescriptionLength too short:', config.maxAppealDescriptionLength);
    return false;
  }
  
  if (config.maxEvidenceFiles < 0) {
    console.error('[Settlement] maxEvidenceFiles cannot be negative:', config.maxEvidenceFiles);
    return false;
  }
  
  if (config.allowedAppealRoles.length === 0) {
    console.error('[Settlement] At least one appeal role must be allowed');
    return false;
  }
  
  return true;
}

/**
 * Get appeal window duration in milliseconds
 */
export function getAppealWindowDuration(): number {
  return settlementConfig.appealWindowHours * 60 * 60 * 1000;
}

/**
 * Check if a role is allowed to appeal
 */
export function canRoleAppeal(role: 'BUYER' | 'SELLER' | 'OBSERVER'): boolean {
  return settlementConfig.allowedAppealRoles.includes(role);
}

/**
 * Validate appeal description length
 */
export function validateAppealDescription(description: string): { valid: boolean; error?: string } {
  if (description.length === 0) {
    return { valid: false, error: 'Appeal description cannot be empty' };
  }
  
  if (description.length > settlementConfig.maxAppealDescriptionLength) {
    return { 
      valid: false, 
      error: `Appeal description cannot exceed ${settlementConfig.maxAppealDescriptionLength} characters` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate evidence files count
 */
export function validateEvidenceFiles(evidenceCount: number): { valid: boolean; error?: string } {
  if (settlementConfig.requireEvidenceForAppeal && evidenceCount === 0) {
    return { valid: false, error: 'Evidence is required for appeals' };
  }
  
  if (evidenceCount > settlementConfig.maxEvidenceFiles) {
    return { 
      valid: false, 
      error: `Cannot exceed ${settlementConfig.maxEvidenceFiles} evidence files` 
    };
  }
  
  return { valid: true };
}

// Validate configuration on startup
if (!validateSettlementConfig()) {
  throw new Error('[Settlement] Invalid configuration detected');
}
