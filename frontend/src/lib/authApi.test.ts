/**
 * authApi.test.ts — Unit tests for the auth API client functions.
 */
import axios from 'axios';

jest.mock('../lib/apiClient', () => ({
  apiClient: {
    post:   jest.fn(),
    get:    jest.fn(),
    put:    jest.fn(),
    delete: jest.fn(),
  },
}));

import { apiClient } from '../lib/apiClient';
import {
  createSession,
  getMe,
  completeOnboarding,
  rotateAlias,
  updateCategories,
  deleteAccount,
  extractAlias,
} from './authApi';
import type { PrivateProfile } from './authApi';

const mockPost   = apiClient.post   as jest.Mock;
const mockGet    = apiClient.get    as jest.Mock;
const mockPut    = apiClient.put    as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

beforeEach(() => jest.clearAllMocks());

// ─── createSession ────────────────────────────────────────────────────────────

describe('createSession', () => {
  it('POSTs to auth/session with idToken', async () => {
    mockPost.mockResolvedValue({ data: { accountId: 'acc-1', role: 'user', hasCompletedOnboarding: false, isBanned: false } });
    const result = await createSession('test-token');
    expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('session'), { idToken: 'test-token' });
    expect(result.accountId).toBe('acc-1');
  });

  it('never returns email in the response', async () => {
    mockPost.mockResolvedValue({ data: { accountId: 'acc-1', role: 'user', hasCompletedOnboarding: false, isBanned: false } });
    const result = await createSession('token');
    expect(JSON.stringify(result)).not.toContain('email');
    expect(JSON.stringify(result)).not.toContain('firebaseUid');
  });
});

// ─── getMe ────────────────────────────────────────────────────────────────────

describe('getMe', () => {
  it('GETs the private profile endpoint', async () => {
    mockGet.mockResolvedValue({ data: { accountId: 'acc-1', role: 'user', hasCompletedOnboarding: true, categoryInterests: [], currentAlias: null, aliasRotationCount: 0, snyOptIns: [] } });
    const result = await getMe();
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('users/me'));
    expect(result.accountId).toBe('acc-1');
  });
});

// ─── completeOnboarding ───────────────────────────────────────────────────────

describe('completeOnboarding', () => {
  it('POSTs to onboarding with correct payload', async () => {
    mockPost.mockResolvedValue({ data: { accountId: 'acc-1' } });
    await completeOnboarding({ categories: ['a', 'b', 'c'], ageConfirmed: true, tosAccepted: true });
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('onboarding'),
      { categories: ['a', 'b', 'c'], ageConfirmed: true, tosAccepted: true }
    );
  });
});

// ─── rotateAlias ──────────────────────────────────────────────────────────────

describe('rotateAlias', () => {
  it('PUTs to alias/rotate', async () => {
    mockPut.mockResolvedValue({ data: { aliasName: 'New Fox', avatarSeed: 'new', aliasRotationCount: 1 } });
    const result = await rotateAlias();
    expect(mockPut).toHaveBeenCalledWith(expect.stringContaining('alias/rotate'));
    expect(result.aliasName).toBe('New Fox');
  });
});

// ─── updateCategories ─────────────────────────────────────────────────────────

describe('updateCategories', () => {
  it('PUTs to categories with array payload', async () => {
    mockPut.mockResolvedValue({ data: { success: true } });
    await updateCategories(['a', 'b', 'c']);
    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining('categories'),
      { categories: ['a', 'b', 'c'] }
    );
  });
});

// ─── deleteAccount ────────────────────────────────────────────────────────────

describe('deleteAccount', () => {
  it('DELETEs the user/me endpoint', async () => {
    mockDelete.mockResolvedValue({ data: { success: true } });
    await deleteAccount();
    expect(mockDelete).toHaveBeenCalledWith(expect.stringContaining('users/me'));
  });
});

// ─── extractAlias ─────────────────────────────────────────────────────────────

describe('extractAlias', () => {
  const baseProfile: PrivateProfile = {
    accountId:              'acc-1',
    role:                   'user',
    hasCompletedOnboarding: true,
    categoryInterests:      ['a'],
    aliasRotationCount:     0,
    snyOptIns:              [],
    currentAlias:           null,
  };

  it('returns null when currentAlias is null', () => {
    expect(extractAlias(baseProfile)).toBeNull();
  });

  it('returns alias when currentAlias is present', () => {
    const profile: PrivateProfile = {
      ...baseProfile,
      currentAlias: { name: 'Blue Fox', avatarSeed: 'fox', issuedAt: '2026-01-01', expiresAt: null },
    };
    const alias = extractAlias(profile);
    expect(alias).not.toBeNull();
    expect(alias?.name).toBe('Blue Fox');
    expect(alias?.avatarSeed).toBe('fox');
  });

  it('never includes account-identifying data in the returned alias', () => {
    const profile: PrivateProfile = {
      ...baseProfile,
      currentAlias: { name: 'Test', avatarSeed: 'seed', issuedAt: '2026-01-01', expiresAt: null },
    };
    const alias = extractAlias(profile);
    expect(JSON.stringify(alias)).not.toContain('accountId');
    expect(JSON.stringify(alias)).not.toContain('email');
  });
});

void axios; // suppress unused import
