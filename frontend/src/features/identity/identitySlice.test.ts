import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../../store/rootReducer';
import {
  identityLoading,
  identityLoaded,
  identityError,
  identityRotating,
  identityRotated,
  revealDismissed,
  identityCleared,
  selectAlias,
  selectAliasName,
  selectAvatarSeed,
  selectIdentityStatus,
  selectRevealDismissed,
  type AliasIdentity,
} from './identitySlice';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

const mockAlias = (overrides?: Partial<AliasIdentity>): AliasIdentity => ({
  name: 'Blue Fox',
  avatarSeed: 'seed-abc',
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-02-01T00:00:00.000Z',
  ...overrides,
});

// ─── Initial state ────────────────────────────────────────────────────────────

describe('identitySlice — initial state', () => {
  it('has null alias', () => {
    const store = makeStore();
    expect(selectAlias(store.getState())).toBeNull();
  });

  it('has idle status', () => {
    const store = makeStore();
    expect(selectIdentityStatus(store.getState())).toBe('idle');
  });

  it('has revealDismissed false', () => {
    const store = makeStore();
    expect(selectRevealDismissed(store.getState())).toBe(false);
  });
});

// ─── identityLoading ─────────────────────────────────────────────────────────

describe('identityLoading', () => {
  it('sets status to loading', () => {
    const store = makeStore();
    store.dispatch(identityLoading());
    expect(selectIdentityStatus(store.getState())).toBe('loading');
  });
});

// ─── identityLoaded ──────────────────────────────────────────────────────────

describe('identityLoaded', () => {
  it('stores alias and sets status ready', () => {
    const store = makeStore();
    const alias = mockAlias();
    store.dispatch(identityLoaded(alias));
    expect(selectAlias(store.getState())).toEqual(alias);
    expect(selectIdentityStatus(store.getState())).toBe('ready');
  });

  it('selectAliasName returns alias name', () => {
    const store = makeStore();
    store.dispatch(identityLoaded(mockAlias({ name: 'Red Whale' })));
    expect(selectAliasName(store.getState())).toBe('Red Whale');
  });

  it('selectAvatarSeed returns avatar seed', () => {
    const store = makeStore();
    store.dispatch(identityLoaded(mockAlias({ avatarSeed: 'seed-xyz' })));
    expect(selectAvatarSeed(store.getState())).toBe('seed-xyz');
  });

  it('selectAliasName returns null when no alias', () => {
    const store = makeStore();
    expect(selectAliasName(store.getState())).toBeNull();
  });

  it('selectAvatarSeed returns null when no alias', () => {
    const store = makeStore();
    expect(selectAvatarSeed(store.getState())).toBeNull();
  });
});

// ─── identityError ───────────────────────────────────────────────────────────

describe('identityError', () => {
  it('sets status to error', () => {
    const store = makeStore();
    store.dispatch(identityError('Failed to load identity'));
    expect(selectIdentityStatus(store.getState())).toBe('error');
  });
});

// ─── identityRotating ────────────────────────────────────────────────────────

describe('identityRotating', () => {
  it('sets status to rotating', () => {
    const store = makeStore();
    store.dispatch(identityRotating());
    expect(selectIdentityStatus(store.getState())).toBe('rotating');
  });
});

// ─── identityRotated ─────────────────────────────────────────────────────────

describe('identityRotated', () => {
  it('replaces alias and resets revealDismissed', () => {
    const store = makeStore();
    store.dispatch(identityLoaded(mockAlias()));
    store.dispatch(revealDismissed());
    expect(selectRevealDismissed(store.getState())).toBe(true);

    const newAlias = mockAlias({ name: 'Green Bear', avatarSeed: 'seed-new' });
    store.dispatch(identityRotated(newAlias));
    expect(selectAlias(store.getState())).toEqual(newAlias);
    expect(selectIdentityStatus(store.getState())).toBe('ready');
    expect(selectRevealDismissed(store.getState())).toBe(false);
  });
});

// ─── revealDismissed ─────────────────────────────────────────────────────────

describe('revealDismissed action', () => {
  it('sets revealDismissed to true', () => {
    const store = makeStore();
    store.dispatch(revealDismissed());
    expect(selectRevealDismissed(store.getState())).toBe(true);
  });
});

// ─── identityCleared ─────────────────────────────────────────────────────────

describe('identityCleared', () => {
  it('resets all state', () => {
    const store = makeStore();
    store.dispatch(identityLoaded(mockAlias()));
    store.dispatch(revealDismissed());
    store.dispatch(identityCleared());
    expect(selectAlias(store.getState())).toBeNull();
    expect(selectIdentityStatus(store.getState())).toBe('idle');
    expect(selectRevealDismissed(store.getState())).toBe(false);
  });
});
