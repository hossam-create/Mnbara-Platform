import { logger, LogLevel } from '../logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  it('should log structured info messages', () => {
    logger.info('Test message', {
      correlationId: 'test-123',
      decisionId: 'dec-456',
      source: 'INTERNAL'
    });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(logOutput.level).toBe('info');
    expect(logOutput.message).toBe('Test message');
    expect(logOutput.correlationId).toBe('test-123');
    expect(logOutput.decisionId).toBe('dec-456');
    expect(logOutput.source).toBe('INTERNAL');
    expect(logOutput.service).toBe('decision-authority-service');
    expect(logOutput.timestamp).toBeDefined();
  });

  it('should log structured error messages', () => {
    logger.error('Error occurred', {
      correlationId: 'test-123',
      error: 'Connection failed'
    });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
    expect(logOutput.level).toBe('error');
    expect(logOutput.message).toBe('Error occurred');
    expect(logOutput.error).toBe('Connection failed');
  });

  it('should log structured warning messages', () => {
    logger.warn('Warning detected', {
      operation: 'health_check',
      outcome: 'degraded'
    });

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    const logOutput = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
    expect(logOutput.level).toBe('warn');
    expect(logOutput.message).toBe('Warning detected');
    expect(logOutput.operation).toBe('health_check');
  });

  it('should include timestamp in ISO format', () => {
    logger.info('Test');

    const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(logOutput.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should include service name', () => {
    logger.info('Test');

    const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(logOutput.service).toBe('decision-authority-service');
  });

  it('should handle messages without fields', () => {
    logger.info('Simple message');

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(logOutput.message).toBe('Simple message');
    expect(logOutput.level).toBe('info');
  });
});
