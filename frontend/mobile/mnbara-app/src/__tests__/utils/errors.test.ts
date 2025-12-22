import {
  ApiError,
  NetworkError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  OfflineError,
  parseError,
  getErrorMessage,
  getHttpStatusMessage,
  isRetryableError,
  formatValidationErrors,
} from '../../utils/errors';

describe('Error Classes', () => {
  describe('ApiError', () => {
    it('should create an ApiError with all properties', () => {
      const error = new ApiError('Test error', 'TEST_CODE', 400, { field: ['error'] }, true);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ field: ['error'] });
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('ApiError');
    });
  });

  describe('NetworkError', () => {
    it('should create a NetworkError with default message', () => {
      const error = new NetworkError();
      
      expect(error.message).toBe('Network error. Please check your internet connection.');
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('NetworkError');
    });
  });

  describe('OfflineError', () => {
    it('should create an OfflineError with default message', () => {
      const error = new OfflineError();
      
      expect(error.message).toBe('You are offline. Please check your connection.');
      expect(error.name).toBe('OfflineError');
    });
  });

  describe('RateLimitError', () => {
    it('should create a RateLimitError with retryAfter', () => {
      const error = new RateLimitError(30);
      
      expect(error.message).toBe('Too many requests. Please try again in 30 seconds.');
      expect(error.retryAfter).toBe(30);
    });

    it('should create a RateLimitError without retryAfter', () => {
      const error = new RateLimitError();
      
      expect(error.message).toBe('Too many requests. Please try again later.');
      expect(error.retryAfter).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with field errors', () => {
      const fields = { email: ['Invalid email'] };
      const error = new ValidationError(fields);
      
      expect(error.fields).toEqual(fields);
      expect(error.message).toBe('Please check your input and try again.');
    });
  });
});

describe('parseError', () => {
  it('should parse ApiError correctly', () => {
    const error = new ApiError('API error', 'API_CODE', 500, undefined, true);
    const parsed = parseError(error);
    
    expect(parsed.message).toBe('API error');
    expect(parsed.code).toBe('API_CODE');
    expect(parsed.status).toBe(500);
    expect(parsed.isRetryable).toBe(true);
    expect(parsed.isOffline).toBe(false);
  });

  it('should parse NetworkError correctly', () => {
    const error = new NetworkError();
    const parsed = parseError(error);
    
    expect(parsed.code).toBe('NETWORK_ERROR');
    expect(parsed.status).toBe(0);
    expect(parsed.isRetryable).toBe(true);
    expect(parsed.isOffline).toBe(false);
  });

  it('should parse OfflineError correctly', () => {
    const error = new OfflineError();
    const parsed = parseError(error);
    
    expect(parsed.code).toBe('OFFLINE');
    expect(parsed.isRetryable).toBe(true);
    expect(parsed.isOffline).toBe(true);
  });

  it('should parse RateLimitError correctly', () => {
    const error = new RateLimitError(60);
    const parsed = parseError(error);
    
    expect(parsed.code).toBe('RATE_LIMITED');
    expect(parsed.status).toBe(429);
    expect(parsed.isRetryable).toBe(true);
  });

  it('should parse ValidationError correctly', () => {
    const error = new ValidationError({ email: ['Invalid'] });
    const parsed = parseError(error);
    
    expect(parsed.code).toBe('VALIDATION_ERROR');
    expect(parsed.status).toBe(422);
    expect(parsed.details).toEqual({ email: ['Invalid'] });
    expect(parsed.isRetryable).toBe(false);
  });

  it('should parse AuthenticationError correctly', () => {
    const error = new AuthenticationError();
    const parsed = parseError(error);
    
    expect(parsed.code).toBe('TOKEN_EXPIRED');
    expect(parsed.status).toBe(401);
    expect(parsed.isRetryable).toBe(false);
  });

  it('should parse generic Error correctly', () => {
    const error = new Error('Generic error');
    const parsed = parseError(error);
    
    expect(parsed.message).toBe('Generic error');
    expect(parsed.code).toBe('UNKNOWN_ERROR');
    expect(parsed.isRetryable).toBe(false);
  });

  it('should parse unknown error type', () => {
    const parsed = parseError('string error');
    
    expect(parsed.message).toBe('An unexpected error occurred.');
    expect(parsed.code).toBe('UNKNOWN_ERROR');
  });
});

describe('getErrorMessage', () => {
  it('should return mapped message for known error codes', () => {
    expect(getErrorMessage('INVALID_CREDENTIALS')).toBe('Invalid email or password.');
    expect(getErrorMessage('TOKEN_EXPIRED')).toBe('Your session has expired. Please log in again.');
    expect(getErrorMessage('BID_TOO_LOW')).toBe('Your bid must be higher than the current bid.');
    expect(getErrorMessage('RATE_LIMITED')).toBe('Too many requests. Please wait.');
  });

  it('should return default message for unknown error codes', () => {
    expect(getErrorMessage('UNKNOWN_CODE')).toBe('An unexpected error occurred.');
  });
});

describe('getHttpStatusMessage', () => {
  it('should return mapped message for known HTTP status codes', () => {
    expect(getHttpStatusMessage(400)).toBe('Invalid request.');
    expect(getHttpStatusMessage(401)).toBe('Please log in to continue.');
    expect(getHttpStatusMessage(403)).toBe('You do not have permission.');
    expect(getHttpStatusMessage(404)).toBe('Not found.');
    expect(getHttpStatusMessage(429)).toBe('Too many requests.');
    expect(getHttpStatusMessage(500)).toBe('Server error. Please try again.');
  });

  it('should return default message for unknown status codes', () => {
    expect(getHttpStatusMessage(999)).toBe('Server error. Please try again.');
  });
});

describe('isRetryableError', () => {
  it('should return true for retryable errors', () => {
    expect(isRetryableError(new NetworkError())).toBe(true);
    expect(isRetryableError(new OfflineError())).toBe(true);
    expect(isRetryableError(new RateLimitError())).toBe(true);
    expect(isRetryableError(new ApiError('Error', 'CODE', 500, undefined, true))).toBe(true);
  });

  it('should return false for non-retryable errors', () => {
    expect(isRetryableError(new ValidationError({}))).toBe(false);
    expect(isRetryableError(new AuthenticationError())).toBe(false);
  });
});

describe('formatValidationErrors', () => {
  it('should format validation errors for display', () => {
    const details = {
      email: ['Invalid email format'],
      password: ['Must be at least 8 characters'],
    };
    
    const formatted = formatValidationErrors(details);
    
    expect(formatted).toContain('Email: Invalid email format');
    expect(formatted).toContain('Password: Must be at least 8 characters');
  });

  it('should handle camelCase field names', () => {
    const details = { firstName: ['Required'] };
    const formatted = formatValidationErrors(details);
    
    expect(formatted).toContain('First Name: Required');
  });
});
