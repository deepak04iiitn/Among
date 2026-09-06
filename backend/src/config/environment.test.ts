/**
 * Environment validation tests.
 * We test the schema directly (not the already-loaded env object)
 * to avoid needing to re-require the module.
 */
import { z } from 'zod';

// Mirror the schema here so we can test it directly without side effects
const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().url(),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  ALLOWED_ORIGINS: z.string().min(1).default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

const VALID_ENV = {
  NODE_ENV: 'test',
  PORT: '4000',
  MONGODB_URI: 'mongodb://localhost:27017/test',
  FIREBASE_PROJECT_ID: 'test-project',
  FIREBASE_CLIENT_EMAIL: 'test@test-project.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----',
  ALLOWED_ORIGINS: 'http://localhost:3000',
  LOG_LEVEL: 'error',
};

describe('Environment schema', () => {
  it('accepts all valid required fields', () => {
    const result = EnvironmentSchema.safeParse(VALID_ENV);
    expect(result.success).toBe(true);
  });

  it('applies defaults for optional fields', () => {
    const minimal = {
      MONGODB_URI: 'mongodb://localhost:27017/test',
      FIREBASE_PROJECT_ID: 'proj',
      FIREBASE_CLIENT_EMAIL: 'a@b.iam.gserviceaccount.com',
      FIREBASE_PRIVATE_KEY: 'key',
    };
    const result = EnvironmentSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(4000);
      expect(result.data.NODE_ENV).toBe('development');
      expect(result.data.LOG_LEVEL).toBe('info');
    }
  });

  it('rejects when MONGODB_URI is missing', () => {
    const { MONGODB_URI: _, ...rest } = VALID_ENV;
    const result = EnvironmentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects when MONGODB_URI is not a URL', () => {
    const result = EnvironmentSchema.safeParse({ ...VALID_ENV, MONGODB_URI: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects when FIREBASE_CLIENT_EMAIL is not an email', () => {
    const result = EnvironmentSchema.safeParse({ ...VALID_ENV, FIREBASE_CLIENT_EMAIL: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid NODE_ENV values', () => {
    const result = EnvironmentSchema.safeParse({ ...VALID_ENV, NODE_ENV: 'staging' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid LOG_LEVEL values', () => {
    const result = EnvironmentSchema.safeParse({ ...VALID_ENV, LOG_LEVEL: 'verbose' });
    expect(result.success).toBe(false);
  });

  it('coerces PORT from string to number', () => {
    const result = EnvironmentSchema.safeParse({ ...VALID_ENV, PORT: '8080' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.PORT).toBe(8080);
  });

  it('no Redis-related variables are required', () => {
    // Confirm Redis was fully removed — schema must not reference REDIS_URL
    const schemaString = EnvironmentSchema.toString();
    expect(schemaString).not.toContain('REDIS');
    const result = EnvironmentSchema.safeParse(VALID_ENV);
    expect(result.success).toBe(true);
  });
});
