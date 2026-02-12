// ============================================
// Dispute System Error Classes
// ============================================

export class DisputeError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'DisputeError';
  }
}

export class DisputeWindowExpiredError extends DisputeError {
  constructor(disputeId: string) {
    super(
      `Dispute window has expired for dispute: ${disputeId}`,
      'DISPUTE_WINDOW_EXPIRED',
      400
    );
    this.name = 'DisputeWindowExpiredError';
  }
}

export class DuplicateDisputeError extends DisputeError {
  constructor(requestId: number) {
    super(
      `A dispute already exists for request: ${requestId}`,
      'DUPLICATE_DISPUTE',
      409
    );
    this.name = 'DuplicateDisputeError';
  }
}

export class InvalidDisputeStatusError extends DisputeError {
  constructor(currentStatus: string, expectedStatus: string[]) {
    super(
      `Invalid dispute status: ${currentStatus}. Expected one of: ${expectedStatus.join(', ')}`,
      'INVALID_DISPUTE_STATUS',
      400
    );
    this.name = 'InvalidDisputeStatusError';
  }
}

export class RefundFailedError extends DisputeError {
  constructor(disputeId: string, reason: string) {
    super(
      `Refund failed for dispute ${disputeId}: ${reason}`,
      'REFUND_FAILED',
      500
    );
    this.name = 'RefundFailedError';
  }
}

export class InvalidFileTypeError extends DisputeError {
  constructor(fileType: string, allowedTypes: string[]) {
    super(
      `Invalid file type: ${fileType}. Allowed types: ${allowedTypes.join(', ')}`,
      'INVALID_FILE_TYPE',
      400
    );
    this.name = 'InvalidFileTypeError';
  }
}

export class FileTooLargeError extends DisputeError {
  constructor(fileSize: number, maxSize: number) {
    super(
      `File size ${fileSize} bytes exceeds maximum allowed size of ${maxSize} bytes`,
      'FILE_TOO_LARGE',
      400
    );
    this.name = 'FileTooLargeError';
  }
}

export class TooManyFilesError extends DisputeError {
  constructor(fileCount: number, maxFiles: number) {
    super(
      `Too many files: ${fileCount}. Maximum allowed: ${maxFiles}`,
      'TOO_MANY_FILES',
      400
    );
    this.name = 'TooManyFilesError';
  }
}

export class DisputeNotFoundError extends DisputeError {
  constructor(disputeId: string) {
    super(
      `Dispute not found: ${disputeId}`,
      'DISPUTE_NOT_FOUND',
      404
    );
    this.name = 'DisputeNotFoundError';
  }
}

export class UnauthorizedDisputeAccessError extends DisputeError {
  constructor(userId: string, disputeId: string) {
    super(
      `User ${userId} is not authorized to access dispute ${disputeId}`,
      'UNAUTHORIZED_DISPUTE_ACCESS',
      403
    );
    this.name = 'UnauthorizedDisputeAccessError';
  }
}

export class EvidenceNotFoundError extends DisputeError {
  constructor(evidenceId: number) {
    super(
      `Evidence not found: ${evidenceId}`,
      'EVIDENCE_NOT_FOUND',
      404
    );
    this.name = 'EvidenceNotFoundError';
  }
}

export class InvalidEvidencePartyError extends DisputeError {
  constructor(party: string) {
    super(
      `Invalid evidence submission party: ${party}. Must be BUYER or SELLER`,
      'INVALID_EVIDENCE_PARTY',
      400
    );
    this.name = 'InvalidEvidencePartyError';
  }
}

export class InvalidResolutionPercentageError extends DisputeError {
  constructor(percentage: number) {
    super(
      `Invalid resolution percentage: ${percentage}. Must be between 0 and 100`,
      'INVALID_RESOLUTION_PERCENTAGE',
      400
    );
    this.name = 'InvalidResolutionPercentageError';
  }
}

export class RequestNotEligibleForDisputeError extends DisputeError {
  constructor(requestId: number, reason: string) {
    super(
      `Request ${requestId} is not eligible for dispute: ${reason}`,
      'REQUEST_NOT_ELIGIBLE',
      400
    );
    this.name = 'RequestNotEligibleForDisputeError';
  }
}
