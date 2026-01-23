import { 
  DecisionNotFoundError, 
  InvalidDecisionStateError, 
  ValidationError,
  DecisionSourceError 
} from '../../utils/errors';

/**
 * Error Mapper - Maps service errors to HTTP responses
 * 
 * Rules:
 * - NO reinterpretation of errors
 * - NO additional logic
 * - Direct mapping only
 */

interface HttpErrorResponse {
  statusCode: number;
  body: {
    error: string;
    message: string;
    statusCode: number;
  };
}

export function mapServiceErrorToHttp(error: any): HttpErrorResponse {
  // DecisionNotFoundError → 404
  if (error instanceof DecisionNotFoundError) {
    return {
      statusCode: 404,
      body: {
        error: 'DecisionNotFound',
        message: error.message,
        statusCode: 404
      }
    };
  }

  // InvalidDecisionStateError → 400
  if (error instanceof InvalidDecisionStateError) {
    return {
      statusCode: 400,
      body: {
        error: 'InvalidDecisionState',
        message: error.message,
        statusCode: 400
      }
    };
  }

  // ValidationError → 400
  if (error instanceof ValidationError) {
    return {
      statusCode: 400,
      body: {
        error: 'ValidationError',
        message: error.message,
        statusCode: 400
      }
    };
  }

  // DecisionSourceError → 502
  if (error instanceof DecisionSourceError) {
    return {
      statusCode: 502,
      body: {
        error: 'DecisionSourceError',
        message: error.message,
        statusCode: 502
      }
    };
  }

  // Unknown error → 500
  return {
    statusCode: 500,
    body: {
      error: 'InternalServerError',
      message: error.message || 'An unexpected error occurred',
      statusCode: 500
    }
  };
}
