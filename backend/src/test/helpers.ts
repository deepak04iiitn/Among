/**
 * Shared test helpers and mock factories.
 * Import from here in all test files — never recreate ad hoc.
 */
import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedUser } from '../types/auth.types';
import { USER_ROLE } from '../constants/userRoles';

// ─── Mock Request / Response / Next ──────────────────────────────────────────

export function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    body: {},
    query: {},
    params: {},
    ip: '127.0.0.1',
    user: undefined,
    ...overrides,
  } as unknown as Request;
}

export function mockResponse(): Response & {
  status: jest.Mock;
  json: jest.Mock;
  send: jest.Mock;
} {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(),
  } as unknown as Response & { status: jest.Mock; json: jest.Mock; send: jest.Mock };
  return res;
}

export function mockNext(): jest.MockedFunction<NextFunction> {
  return jest.fn() as jest.MockedFunction<NextFunction>;
}

// ─── Authenticated user factories ────────────────────────────────────────────

export function makeAuthUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    accountId: 'account-id-123',
    firebaseUid: 'firebase-uid-abc',
    role: USER_ROLE.USER,
    isBanned: false,
    hasCompletedOnboarding: true,
    ...overrides,
  };
}

export function makeAdminUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return makeAuthUser({ role: USER_ROLE.ADMIN, ...overrides });
}

export function makeModeratorUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return makeAuthUser({ role: USER_ROLE.MODERATOR, ...overrides });
}

export function makeBannedUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return makeAuthUser({ isBanned: true, ...overrides });
}

// ─── Firebase mock token ─────────────────────────────────────────────────────

export const MOCK_FIREBASE_UID = 'firebase-uid-test-123';
export const MOCK_ID_TOKEN = 'mock.firebase.id.token';

export const MOCK_DECODED_TOKEN = {
  uid: MOCK_FIREBASE_UID,
  email: 'test@example.com',
  aud: 'test-project',
  iss: 'https://securetoken.google.com/test-project',
  sub: MOCK_FIREBASE_UID,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};
