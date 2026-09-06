/**
 * authThunks.test.ts — Unit tests for auth Redux thunks.
 */
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../../store/rootReducer';

// ─── Mocks ─────────────────────────────────────────────────────────────────

jest.mock('../../lib/firebaseClient', () => ({
  signInWithGoogle: jest.fn(),
  signOut:          jest.fn(),
  getIdToken:       jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../../lib/authApi', () => ({
  createSession: jest.fn(),
  getMe:         jest.fn(),
  extractAlias:  jest.fn(),
}));

import {
  signInWithGoogle,
  signOut as signOutFirebase,
  getIdToken,
} from '../../lib/firebaseClient';
import { createSession, getMe, extractAlias } from '../../lib/authApi';
import {
  signInWithGoogleThunk,
  signOutThunk,
  restoreSessionThunk,
} from './authThunks';

const mockSignInWithGoogle = signInWithGoogle as jest.Mock;
const mockSignOut          = signOutFirebase   as jest.Mock;
const mockGetIdToken       = getIdToken        as jest.Mock;
const mockCreateSession    = createSession     as jest.Mock;
const mockGetMe            = getMe             as jest.Mock;
const mockExtractAlias     = extractAlias      as jest.Mock;

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── signInWithGoogleThunk ────────────────────────────────────────────────────

describe('signInWithGoogleThunk', () => {
  it('dispatches authSuccess on successful sign-in', async () => {
    mockSignInWithGoogle.mockResolvedValue({ getIdToken: async () => 'id-token-123' });
    mockCreateSession.mockResolvedValue({
      accountId: 'acc-1', role: 'user', hasCompletedOnboarding: true, isBanned: false,
    });
    mockGetMe.mockResolvedValue({ currentAlias: null, categoryInterests: [] });
    mockExtractAlias.mockReturnValue(null);

    const store = makeStore();
    await store.dispatch(signInWithGoogleThunk());

    const state = store.getState().auth;
    expect(state.status).toBe('authenticated');
    expect(state.user?.accountId).toBe('acc-1');
  });

  it('does NOT store email or firebaseUid in auth state', async () => {
    mockSignInWithGoogle.mockResolvedValue({ getIdToken: async () => 'token' });
    mockCreateSession.mockResolvedValue({
      accountId: 'acc-1', role: 'user', hasCompletedOnboarding: true, isBanned: false,
    });
    mockGetMe.mockResolvedValue({ currentAlias: null });
    mockExtractAlias.mockReturnValue(null);

    const store = makeStore();
    await store.dispatch(signInWithGoogleThunk());

    const user = store.getState().auth.user;
    expect(user?.firebaseUid).toBe(''); // Intentionally empty — privacy rule
    expect(JSON.stringify(user)).not.toContain('@');
  });

  it('dispatches authError when Firebase sign-in fails', async () => {
    mockSignInWithGoogle.mockRejectedValue(new Error('Popup closed'));

    const store = makeStore();
    await store.dispatch(signInWithGoogleThunk());

    expect(store.getState().auth.status).toBe('unauthenticated');
    expect(store.getState().auth.error).toBeTruthy();
  });

  it('dispatches authError when account is banned', async () => {
    mockSignInWithGoogle.mockResolvedValue({ getIdToken: async () => 'token' });
    mockCreateSession.mockResolvedValue({
      accountId: 'acc-1', role: 'user', hasCompletedOnboarding: true, isBanned: true,
    });

    const store = makeStore();
    await store.dispatch(signInWithGoogleThunk());

    expect(store.getState().auth.status).toBe('unauthenticated');
    expect(store.getState().auth.error).toBeTruthy();
  });

  it('loads alias into identity state when onboarding is complete', async () => {
    mockSignInWithGoogle.mockResolvedValue({ getIdToken: async () => 'token' });
    mockCreateSession.mockResolvedValue({
      accountId: 'acc-1', role: 'user', hasCompletedOnboarding: true, isBanned: false,
    });
    mockGetMe.mockResolvedValue({ currentAlias: { name: 'Blue Fox', avatarSeed: 'seed' } });
    mockExtractAlias.mockReturnValue({ name: 'Blue Fox', avatarSeed: 'seed', createdAt: '', expiresAt: null });

    const store = makeStore();
    await store.dispatch(signInWithGoogleThunk());

    expect(store.getState().identity.alias?.name).toBe('Blue Fox');
  });
});

// ─── signOutThunk ─────────────────────────────────────────────────────────────

describe('signOutThunk', () => {
  it('clears auth and identity state', async () => {
    mockSignOut.mockResolvedValue(undefined);

    const store = makeStore();
    await store.dispatch(signOutThunk());

    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.status).toBe('unauthenticated');
    expect(store.getState().identity.alias).toBeNull();
  });

  it('clears state even if Firebase sign-out throws', async () => {
    mockSignOut.mockRejectedValue(new Error('Network'));

    const store = makeStore();
    await store.dispatch(signOutThunk());

    expect(store.getState().auth.user).toBeNull();
  });
});

// ─── restoreSessionThunk ─────────────────────────────────────────────────────

describe('restoreSessionThunk', () => {
  it('dispatches authSignedOut when no Firebase user exists', async () => {
    mockGetIdToken.mockResolvedValue(null);

    const store = makeStore();
    await store.dispatch(restoreSessionThunk());

    expect(store.getState().auth.status).toBe('unauthenticated');
  });

  it('restores auth state when Firebase token exists', async () => {
    mockGetIdToken.mockResolvedValue('existing-token');
    mockCreateSession.mockResolvedValue({
      accountId: 'acc-2', role: 'user', hasCompletedOnboarding: true, isBanned: false,
    });
    mockGetMe.mockResolvedValue({ currentAlias: null });
    mockExtractAlias.mockReturnValue(null);

    const store = makeStore();
    await store.dispatch(restoreSessionThunk());

    expect(store.getState().auth.status).toBe('authenticated');
    expect(store.getState().auth.user?.accountId).toBe('acc-2');
  });

  it('dispatches authSignedOut on API error', async () => {
    mockGetIdToken.mockResolvedValue('token');
    mockCreateSession.mockRejectedValue(new Error('Network error'));

    const store = makeStore();
    await store.dispatch(restoreSessionThunk());

    expect(store.getState().auth.status).toBe('unauthenticated');
  });
});
