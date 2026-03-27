/**
 * Event Logger Errors
 * SECURITY-CRITICAL: Bank-facing infrastructure
 */

/**
 * EventValidationError - Thrown when event validation fails
 * NO SILENT LOGGING - All validation failures are explicit
 */
export class EventValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventValidationError';
  }
}

/**
 * EventTaxonomyError - Thrown when event violates taxonomy rules
 */
export class EventTaxonomyError extends EventValidationError {
  constructor(message: string) {
    super(`Taxonomy violation: ${message}`);
    this.name = 'EventTaxonomyError';
  }
}

/**
 * EventContextError - Thrown when event context is invalid
 */
export class EventContextError extends EventValidationError {
  constructor(message: string) {
    super(`Context validation failed: ${message}`);
    this.name = 'EventContextError';
  }
}

/**
 * EventPermissionError - Thrown when actor lacks permission
 */
export class EventPermissionError extends EventValidationError {
  constructor(message: string) {
    super(`Permission denied: ${message}`);
    this.name = 'EventPermissionError';
  }
}
