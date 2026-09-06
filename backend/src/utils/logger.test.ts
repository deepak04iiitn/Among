import { logger } from './logger';

describe('logger', () => {
  it('is a winston logger instance with expected level methods', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('does not throw when logging an object', () => {
    expect(() => logger.info('test message', { key: 'value' })).not.toThrow();
  });

  it('does not throw when logging an error', () => {
    const err = new Error('test error');
    expect(() => logger.error('error occurred', { err })).not.toThrow();
  });

  it('is silent in test environment (NODE_ENV=test)', () => {
    // The logger is configured silent:true when NODE_ENV=test
    // so it should not write output; just confirm it doesn't throw
    expect(() => logger.warn('this is suppressed in test')).not.toThrow();
  });
});
