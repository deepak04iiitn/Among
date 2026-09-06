/**
 * jwt.service.test.ts — Unit tests for JWT sign/verify logic.
 *
 * Tests:
 *  - issueTokenPair: produces valid access + refresh tokens
 *  - verifyAccessToken: accepts a valid access token, rejects wrong type
 *  - verifyRefreshToken: accepts a valid refresh token, rejects wrong type
 *  - Expired token detection
 *  - Tampered token detection
 *  - Missing/short JWT_SECRET guard
 */
import jwt from 'jsonwebtoken';
import {
  issueTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  type JwtPayload,
} from './jwt.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_SECRET = 'a'.repeat(32); // exactly 32 chars

function withSecret(secret: string | undefined, fn: () => void): void {
  const original = process.env['JWT_SECRET'];
  if (secret === undefined) {
    delete process.env['JWT_SECRET'];
  } else {
    process.env['JWT_SECRET'] = secret;
  }
  try {
    fn();
  } finally {
    if (original === undefined) {
      delete process.env['JWT_SECRET'];
    } else {
      process.env['JWT_SECRET'] = original;
    }
  }
}

beforeEach(() => {
  process.env['JWT_SECRET'] = VALID_SECRET;
});

afterEach(() => {
  delete process.env['JWT_SECRET'];
});

// ─── issueTokenPair ───────────────────────────────────────────────────────────

describe('issueTokenPair', () => {
  it('returns accessToken, refreshToken, and expiresIn', () => {
    const pair = issueTokenPair({
      accountId:            'abc123',
      role:                 'user',
      hasCompletedOnboarding: true,
    });

    expect(pair.accessToken).toBeTruthy();
    expect(pair.refreshToken).toBeTruthy();
    expect(pair.expiresIn).toBe(15 * 60);
  });

  it('access token payload contains correct claims', () => {
    const pair    = issueTokenPair({ accountId: 'id1', role: 'moderator', hasCompletedOnboarding: false });
    const decoded = jwt.decode(pair.accessToken) as JwtPayload & { exp: number };

    expect(decoded.sub).toBe('id1');
    expect(decoded.role).toBe('moderator');
    expect(decoded.onboarded).toBe(false);
    expect(decoded.type).toBe('access');
  });

  it('refresh token payload contains correct claims', () => {
    const pair    = issueTokenPair({ accountId: 'id2', role: 'admin', hasCompletedOnboarding: true });
    const decoded = jwt.decode(pair.refreshToken) as JwtPayload;

    expect(decoded.sub).toBe('id2');
    expect(decoded.type).toBe('refresh');
  });

  it('access and refresh tokens are different strings', () => {
    const pair = issueTokenPair({ accountId: 'id3', role: 'user', hasCompletedOnboarding: true });
    expect(pair.accessToken).not.toBe(pair.refreshToken);
  });

  it('throws if JWT_SECRET is missing', () => {
    withSecret(undefined, () => {
      expect(() =>
        issueTokenPair({ accountId: 'id', role: 'user', hasCompletedOnboarding: true })
      ).toThrow();
    });
  });

  it('throws if JWT_SECRET is shorter than 32 characters', () => {
    withSecret('short', () => {
      expect(() =>
        issueTokenPair({ accountId: 'id', role: 'user', hasCompletedOnboarding: true })
      ).toThrow();
    });
  });
});

// ─── verifyAccessToken ────────────────────────────────────────────────────────

describe('verifyAccessToken', () => {
  it('successfully verifies a valid access token', () => {
    const pair    = issueTokenPair({ accountId: 'usr1', role: 'user', hasCompletedOnboarding: true });
    const payload = verifyAccessToken(pair.accessToken);

    expect(payload.sub).toBe('usr1');
    expect(payload.role).toBe('user');
    expect(payload.type).toBe('access');
  });

  it('throws if a refresh token is passed to verifyAccessToken', () => {
    const pair = issueTokenPair({ accountId: 'usr2', role: 'user', hasCompletedOnboarding: true });
    expect(() => verifyAccessToken(pair.refreshToken)).toThrow();
  });

  it('throws on a tampered token', () => {
    const pair    = issueTokenPair({ accountId: 'usr3', role: 'user', hasCompletedOnboarding: true });
    const tampered = pair.accessToken.slice(0, -4) + 'XXXX';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('throws on a token signed with the wrong secret', () => {
    const wrongSecret  = 'b'.repeat(32);
    const foreignToken = jwt.sign(
      { sub: 'evil', role: 'admin', type: 'access', onboarded: true },
      wrongSecret,
      { expiresIn: '15m' }
    );
    expect(() => verifyAccessToken(foreignToken)).toThrow();
  });

  it('throws on an expired access token', () => {
    const expiredToken = jwt.sign(
      { sub: 'id', role: 'user', type: 'access', onboarded: true },
      VALID_SECRET,
      { expiresIn: 0 } // expires immediately
    );
    // Small delay to ensure the token is past its expiry
    jest.useFakeTimers();
    jest.advanceTimersByTime(2000);
    expect(() => verifyAccessToken(expiredToken)).toThrow();
    jest.useRealTimers();
  });

  it('throws on completely invalid string', () => {
    expect(() => verifyAccessToken('not.a.jwt')).toThrow();
  });
});

// ─── verifyRefreshToken ───────────────────────────────────────────────────────

describe('verifyRefreshToken', () => {
  it('successfully verifies a valid refresh token', () => {
    const pair    = issueTokenPair({ accountId: 'ref1', role: 'user', hasCompletedOnboarding: false });
    const payload = verifyRefreshToken(pair.refreshToken);

    expect(payload.sub).toBe('ref1');
    expect(payload.type).toBe('refresh');
  });

  it('throws if an access token is passed to verifyRefreshToken', () => {
    const pair = issueTokenPair({ accountId: 'ref2', role: 'user', hasCompletedOnboarding: true });
    expect(() => verifyRefreshToken(pair.accessToken)).toThrow();
  });

  it('throws on a tampered refresh token', () => {
    const pair    = issueTokenPair({ accountId: 'ref3', role: 'user', hasCompletedOnboarding: true });
    const tampered = pair.refreshToken.slice(0, -4) + 'XXXX';
    expect(() => verifyRefreshToken(tampered)).toThrow();
  });
});

// ─── Privacy invariants ───────────────────────────────────────────────────────

describe('privacy invariants', () => {
  it('JWT payload never contains firebaseUid or email', () => {
    const pair    = issueTokenPair({ accountId: 'priv1', role: 'user', hasCompletedOnboarding: true });
    const decoded = jwt.decode(pair.accessToken) as Record<string, unknown>;

    expect(decoded['firebaseUid']).toBeUndefined();
    expect(decoded['email']).toBeUndefined();
    expect(decoded['uid']).toBeUndefined();
  });
});
