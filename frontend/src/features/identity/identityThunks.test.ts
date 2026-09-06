/**
 * identityThunks.test.ts — Unit tests for identity Redux thunks.
 */
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../../store/rootReducer';

jest.mock('../../lib/authApi', () => ({
  getMe:        jest.fn(),
  rotateAlias:  jest.fn(),
  extractAlias: jest.fn(),
}));

import { getMe, rotateAlias, extractAlias } from '../../lib/authApi';
import { fetchIdentityThunk, rotateAliasThunk } from './identityThunks';

const mockGetMe       = getMe        as jest.Mock;
const mockRotateAlias = rotateAlias  as jest.Mock;
const mockExtractAlias = extractAlias as jest.Mock;

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

beforeEach(() => jest.clearAllMocks());

// ─── fetchIdentityThunk ───────────────────────────────────────────────────────

describe('fetchIdentityThunk', () => {
  it('sets alias in state on success', async () => {
    mockGetMe.mockResolvedValue({ currentAlias: { name: 'Silver Moth', avatarSeed: 'moth' } });
    mockExtractAlias.mockReturnValue({ name: 'Silver Moth', avatarSeed: 'moth', createdAt: '', expiresAt: null });

    const store = makeStore();
    await store.dispatch(fetchIdentityThunk());

    expect(store.getState().identity.alias?.name).toBe('Silver Moth');
    expect(store.getState().identity.status).toBe('ready');
  });

  it('sets error state when alias is null', async () => {
    mockGetMe.mockResolvedValue({ currentAlias: null });
    mockExtractAlias.mockReturnValue(null);

    const store = makeStore();
    await store.dispatch(fetchIdentityThunk());

    expect(store.getState().identity.status).toBe('error');
    expect(store.getState().identity.error).toBeTruthy();
  });

  it('sets error state when API call throws', async () => {
    mockGetMe.mockRejectedValue(new Error('Network error'));

    const store = makeStore();
    await store.dispatch(fetchIdentityThunk());

    expect(store.getState().identity.status).toBe('error');
  });
});

// ─── rotateAliasThunk ─────────────────────────────────────────────────────────

describe('rotateAliasThunk', () => {
  it('updates alias in state on success', async () => {
    mockRotateAlias.mockResolvedValue({ aliasName: 'Tidal Wren', avatarSeed: 'wren', aliasRotationCount: 1 });

    const store = makeStore();
    await store.dispatch(rotateAliasThunk());

    expect(store.getState().identity.alias?.name).toBe('Tidal Wren');
    expect(store.getState().identity.status).toBe('ready');
  });

  it('resets revealDismissed so the user sees the new alias reveal', async () => {
    mockRotateAlias.mockResolvedValue({ aliasName: 'New Alias', avatarSeed: 'new', aliasRotationCount: 1 });

    const store = makeStore();
    await store.dispatch(rotateAliasThunk());

    expect(store.getState().identity.revealDismissed).toBe(false);
  });

  it('sets error state when rotation fails (rate limited)', async () => {
    mockRotateAlias.mockRejectedValue(new Error('ERR_ALIAS_ROTATION_RATE_LIMITED'));

    const store = makeStore();
    await store.dispatch(rotateAliasThunk());

    expect(store.getState().identity.status).toBe('error');
    expect(store.getState().identity.error).toBeTruthy();
  });
});
