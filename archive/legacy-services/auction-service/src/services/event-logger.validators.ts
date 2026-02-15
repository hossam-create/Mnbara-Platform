/**
 * Event Logger Validators
 * Context schema validation for each event category
 * SECURITY-CRITICAL: Bank-facing infrastructure
 */

import { EventContextError } from './event-logger.errors';

/**
 * Validate AUTH event context
 * Required: method, success
 */
export function validateAuthEventContext(context: Record<string, any>): void {
  if (!context) {
    throw new EventContextError('context is required');
  }

  if (typeof context.method !== 'string') {
    throw new EventContextError('context.method must be a string');
  }

  if (!['email', 'oauth', 'sso'].includes(context.method)) {
    throw new EventContextError(
      'context.method must be one of: email, oauth, sso'
    );
  }

  if (typeof context.success !== 'boolean') {
    throw new EventContextError('context.success must be a boolean');
  }
}

/**
 * Validate SEARCH event context
 * Required: query_type, result_count
 */
export function validateSearchEventContext(context: Record<string, any>): void {
  if (!context) {
    throw new EventContextError('context is required');
  }

  if (typeof context.query_type !== 'string') {
    throw new EventContextError('context.query_type must be a string');
  }

  if (typeof context.result_count !== 'number' || context.result_count < 0) {
    throw new EventContextError('context.result_count must be a non-negative number');
  }
}

/**
 * Validate AUCTION event context
 * Required: auction_status, reserve_met, final_price
 */
export function validateAuctionEventContext(context: Record<string, any>): void {
  if (!context) {
    throw new EventContextError('context is required');
  }

  if (typeof context.auction_status !== 'string') {
    throw new EventContextError('context.auction_status must be a string');
  }

  if (typeof context.reserve_met !== 'boolean') {
    throw new EventContextError('context.reserve_met must be a boolean');
  }

  if (typeof context.final_price !== 'number' || context.final_price < 0) {
    throw new EventContextError('context.final_price must be a non-negative number');
  }
}

/**
 * Validate BID event context
 * Required: bid_amount, is_auto_bid, triggered_extension
 */
export function validateBidEventContext(context: Record<string, any>): void {
  if (!context) {
    throw new EventContextError('context is required');
  }

  if (typeof context.bid_amount !== 'number' || context.bid_amount <= 0) {
    throw new EventContextError('context.bid_amount must be a positive number');
  }

  if (typeof context.is_auto_bid !== 'boolean') {
    throw new EventContextError('context.is_auto_bid must be a boolean');
  }

  if (typeof context.triggered_extension !== 'boolean') {
    throw new EventContextError('context.triggered_extension must be a boolean');
  }
}

/**
 * Validate ESCROW event context
 * Required: escrow_amount, release_reason, ledger_entry_id
 */
export function validateEscrowEventContext(context: Record<string, any>): void {
  if (!context) {
    throw new EventContextError('context is required');
  }

  if (typeof context.escrow_amount !== 'number' || context.escrow_amount < 0) {
    throw new EventContextError('context.escrow_amount must be a non-negative number');
  }

  if (typeof context.release_reason !== 'string') {
    throw new EventContextError('context.release_reason must be a string');
  }

  if (context.ledger_entry_id !== null && typeof context.ledger_entry_id !== 'string') {
    throw new EventContextError('context.ledger_entry_id must be a string or null');
  }
}

/**
 * Validate WALLET event context
 * Required: balance, transaction_type, status
 */
export function validateWalletEventContext(context: Record<string, any>): void {
  if (!context) {
    throw new EventContextError('context is required');
  }

  if (typeof context.balance !== 'number' || context.balance < 0) {
    throw new EventContextError('context.balance must be a non-negative number');
  }

  if (typeof context.transaction_type !== 'string') {
    throw new EventContextError('context.transaction_type must be a string');
  }

  if (typeof context.status !== 'string') {
    throw new EventContextError('context.status must be a string');
  }
}

/**
 * Validate DISPUTE event context
 * Required: dispute_reason, resolution_type, decision_maker
 */
export function validateDisputeEventContext(context: Record<string, any>): void {
  if (!context) {
    throw new EventContextError('context is required');
  }

  if (typeof context.dispute_reason !== 'string') {
    throw new EventContextError('context.dispute_reason must be a string');
  }

  if (typeof context.resolution_type !== 'string') {
    throw new EventContextError('context.resolution_type must be a string');
  }

  if (typeof context.decision_maker !== 'string') {
    throw new EventContextError('context.decision_maker must be a string');
  }
}

/**
 * Validate SYSTEM event context
 * Required: error_code, severity, component, message
 */
export function validateSystemEventContext(context: Record<string, any>): void {
  if (!context) {
    throw new EventContextError('context is required');
  }

  if (typeof context.error_code !== 'string') {
    throw new EventContextError('context.error_code must be a string');
  }

  if (typeof context.severity !== 'string') {
    throw new EventContextError('context.severity must be a string');
  }

  if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(context.severity)) {
    throw new EventContextError(
      'context.severity must be one of: LOW, MEDIUM, HIGH, CRITICAL'
    );
  }

  if (typeof context.component !== 'string') {
    throw new EventContextError('context.component must be a string');
  }

  if (typeof context.message !== 'string') {
    throw new EventContextError('context.message must be a string');
  }
}
