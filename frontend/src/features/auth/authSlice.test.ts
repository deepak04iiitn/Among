import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../../store/rootReducer';
import {
  authLoading,
  authSuccess,
  authSignedOut,
  authError,
  tokenRefreshed,
  onboardingCompleted,
  selectAuthUser,
  selectIsAuthenticated,
  selectHasCompletedOnboarding,
  type AuthUser,
} from './authSlice';

const mockUser: AuthUser = {
  accountId:               'acc123',
  firebaseUid:             'fb_uid_456',
  hasCompletedOnboarding:  false,
  role:                    'user',
  isBanned:                false,
};

/** Helper: build a full authSuccess payload with dummy JWT fields. */
function successPayload(idToken = 'tok') {
  return {
    user:         mockUser,
    idToken,
    accessToken:  'mock.access.token',
    refreshToken: 'mock.refresh.token',
    expiresIn:    900,
  };
}

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

describe('authSlice', () => {
  it('starts with idle status and no user', () => {
    const store = makeStore();
    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.status).toBe('idle');
    expect(state.idToken).toBeNull();
    expect(state.error).toBeNull();
  });

  it('sets loading status on authLoading', () => {
    const store = makeStore();
    store.dispatch(authLoading());
    expect(store.getState().auth.status).toBe('loading');
    expect(store.getState().auth.error).toBeNull();
  });

  it('sets authenticated status on authSuccess', () => {
    const store = makeStore();
    store.dispatch(authSuccess(successPayload('tok_abc')));
    const state = store.getState().auth;
    expect(state.status).toBe('authenticated');
    expect(state.user).toEqual(mockUser);
    expect(state.idToken).toBe('tok_abc');
    expect(state.error).toBeNull();
  });

  it('clears user on authSignedOut', () => {
    const store = makeStore();
    store.dispatch(authSuccess(successPayload()));
    store.dispatch(authSignedOut());
    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.idToken).toBeNull();
    expect(state.status).toBe('unauthenticated');
  });

  it('sets error and clears user on authError', () => {
    const store = makeStore();
    store.dispatch(authSuccess(successPayload()));
    store.dispatch(authError('ERR_ACCOUNT_BANNED'));
    const state = store.getState().auth;
    expect(state.error).toBe('ERR_ACCOUNT_BANNED');
    expect(state.user).toBeNull();
    expect(state.status).toBe('unauthenticated');
  });

  it('updates idToken without changing user on tokenRefreshed', () => {
    const store = makeStore();
    store.dispatch(authSuccess(successPayload('old_tok')));
    store.dispatch(tokenRefreshed('new_tok'));
    const state = store.getState().auth;
    expect(state.idToken).toBe('new_tok');
    expect(state.user).toEqual(mockUser);
  });

  it('marks onboarding completed without changing other user fields', () => {
    const store = makeStore();
    store.dispatch(authSuccess(successPayload()));
    store.dispatch(onboardingCompleted());
    const state = store.getState().auth;
    expect(state.user?.hasCompletedOnboarding).toBe(true);
    expect(state.user?.accountId).toBe('acc123');
  });

  it('selectIsAuthenticated returns false when idle', () => {
    const store = makeStore();
    expect(selectIsAuthenticated({ auth: store.getState().auth } as Parameters<typeof selectIsAuthenticated>[0])).toBe(false);
  });

  it('selectIsAuthenticated returns true after authSuccess', () => {
    const store = makeStore();
    store.dispatch(authSuccess(successPayload()));
    expect(selectIsAuthenticated({ auth: store.getState().auth } as Parameters<typeof selectIsAuthenticated>[0])).toBe(true);
  });

  it('selectHasCompletedOnboarding returns false for new user', () => {
    const store = makeStore();
    store.dispatch(authSuccess(successPayload()));
    expect(
      selectHasCompletedOnboarding({ auth: store.getState().auth } as Parameters<typeof selectHasCompletedOnboarding>[0])
    ).toBe(false);
  });

  it('selectHasCompletedOnboarding returns true after onboardingCompleted', () => {
    const store = makeStore();
    store.dispatch(authSuccess(successPayload()));
    store.dispatch(onboardingCompleted());
    expect(
      selectHasCompletedOnboarding({ auth: store.getState().auth } as Parameters<typeof selectHasCompletedOnboarding>[0])
    ).toBe(true);
  });

  it('onboardingCompleted is a no-op when user is null', () => {
    const store = makeStore();
    // No user signed in
    store.dispatch(onboardingCompleted());
    expect(store.getState().auth.user).toBeNull();
  });

  describe('privacy invariant', () => {
    it('authUser object does not include email field', () => {
      const store = makeStore();
      store.dispatch(authSuccess(successPayload()));
      const user = selectAuthUser({ auth: store.getState().auth } as Parameters<typeof selectAuthUser>[0]);
      expect(user).not.toHaveProperty('email');
    });
  });
});
