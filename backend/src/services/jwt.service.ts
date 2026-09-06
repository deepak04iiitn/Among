/**
 * jwt.service.ts — Backend JWT issuance and verification.
 *
 * Flow:
 *  1. Client presents Firebase ID token to POST /api/auth/session.
 *  2. Backend verifies Firebase token (once), looks up the AMONG account.
 *  3. Backend signs and returns its own short-lived JWT (accessToken)
 *     and a longer-lived refreshToken.
 *  4. Client uses the backend JWT on all subsequent requests.
 *     → No Firebase SDK call on every API request.
 *
 * Token contents (claims):
 *  - sub:       AMONG internal account ID (MongoDB ObjectId string)
 *  - role:      user | moderator | admin
 *  - onboarded: boolean
 *
 * Security:
 *  - Firebase UID is NEVER included in the JWT payload.
 *  - Access token expires in 15 minutes.
 *  - Refresh token expires in 30 days.
 *  - JWT_SECRET must be at least 32 characters.
 */
import jwt from 'jsonwebtoken';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  /** AMONG internal account ID — never Firebase UID */
  sub:       string;
  role:      string;
  onboarded: boolean;
  type:      'access' | 'refresh';
}

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number; // seconds
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_TTL  = '15m';
const REFRESH_TOKEN_TTL = '30d';
const ACCESS_TTL_SECS   = 15 * 60;

// ─── Sign ─────────────────────────────────────────────────────────────────────

/**
 * Issue an access + refresh token pair for an AMONG account.
 * Called only from the session endpoint (after Firebase token is verified).
 */
export function issueTokenPair(opts: {
  accountId:            string;
  role:                 string;
  hasCompletedOnboarding: boolean;
}): TokenPair {
  const secret = getJwtSecret();

  const basePayload = {
    sub:       opts.accountId,
    role:      opts.role,
    onboarded: opts.hasCompletedOnboarding,
  };

  const accessToken = jwt.sign(
    { ...basePayload, type: 'access' },
    secret,
    { expiresIn: ACCESS_TOKEN_TTL }
  );

  const refreshToken = jwt.sign(
    { ...basePayload, type: 'refresh' },
    secret,
    { expiresIn: REFRESH_TOKEN_TTL }
  );

  return { accessToken, refreshToken, expiresIn: ACCESS_TTL_SECS };
}

// ─── Verify ───────────────────────────────────────────────────────────────────

/**
 * Verify a backend-issued JWT and return the payload.
 * Throws on invalid/expired tokens — let the middleware handle the error.
 */
export function verifyAccessToken(token: string): JwtPayload {
  const secret  = getJwtSecret();
  const decoded = jwt.verify(token, secret) as JwtPayload;

  if (decoded.type !== 'access') {
    throw new jwt.JsonWebTokenError('Invalid token type');
  }

  return decoded;
}

/**
 * Verify a refresh token and return the payload.
 * Throws on invalid/expired tokens.
 */
export function verifyRefreshToken(token: string): JwtPayload {
  const secret  = getJwtSecret();
  const decoded = jwt.verify(token, secret) as JwtPayload;

  if (decoded.type !== 'refresh') {
    throw new jwt.JsonWebTokenError('Invalid token type');
  }

  return decoded;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getJwtSecret(): string {
  // Read directly from process.env at call time (not from the cached env object)
  // so that the secret can be changed in tests without reloading the module.
  const secret = process.env['JWT_SECRET'];
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }
  return secret;
}
