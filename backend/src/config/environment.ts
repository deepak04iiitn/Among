/**
 * environment.ts
 *
 * Validates and exports all environment variables at startup.
 * The app will throw and refuse to start if any required variable is missing.
 * Never access process.env directly elsewhere — always import from here.
 *
 * dotenv/config MUST be the first import so .env is populated before Zod validates.
 */
import 'dotenv/config';
import { z } from 'zod';

const EnvironmentSchema = z.object({
  // ─── Node ─────────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  // ─── MongoDB ──────────────────────────────────────────────────────────────
  MONGODB_URI: z.string().url('MONGODB_URI must be a valid URL'),

  // ─── Firebase ─────────────────────────────────────────────────────────────
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),

  // ─── CORS ─────────────────────────────────────────────────────────────────
  ALLOWED_ORIGINS: z.string().min(1).default('http://localhost:3000'),

  // ─── Logging ──────────────────────────────────────────────────────────────
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

  // ─── JWT ─────────────────────────────────────────────────────────────────
  // Must be ≥32 chars. Generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // ─── Rate limiting (in-memory) ────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

type Environment = z.infer<typeof EnvironmentSchema>;

function loadEnvironment(): Environment {
  const parsed = EnvironmentSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`\n\n❌  Environment validation failed:\n${issues}\n`);
  }

  return parsed.data;
}

export const env: Environment = loadEnvironment();
