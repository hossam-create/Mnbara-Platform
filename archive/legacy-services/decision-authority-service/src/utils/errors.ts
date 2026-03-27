/**
 * Custom Error Classes for Decision Authority Service
 */

export class DecisionAuthorityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecisionAuthorityError';
  }
}

export class DecisionNotFoundError extends DecisionAuthorityError {
  constructor(decisionId: string) {
    super(`Decision not found: ${decisionId}`);
    this.name = 'DecisionNotFoundError';
  }
}

export class InvalidDecisionStateError extends DecisionAuthorityError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDecisionStateError';
  }
}

export class ValidationError extends DecisionAuthorityError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DecisionSourceError extends DecisionAuthorityError {
  constructor(message: string) {
    super(message);
    this.name = 'DecisionSourceError';
  }
}
