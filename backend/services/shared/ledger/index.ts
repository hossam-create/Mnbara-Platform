/**
 * Immutable Ledger Module
 * 
 * Exports all ledger-related types and services for use across the platform.
 */

// Types
export {
  LedgerEntryType,
  LedgerEntryStatus,
  CreateLedgerEntryInput,
  LedgerEntryResponse,
  LedgerVerificationResult,
  LedgerInvalidEntry,
  LedgerQueryFilters,
  LedgerSummary
} from './ledger.types';

// Service
export { ImmutableLedgerService } from './immutable-ledger.service';
export { default } from './immutable-ledger.service';
