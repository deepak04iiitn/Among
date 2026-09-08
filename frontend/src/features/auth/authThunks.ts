/**
 * authThunks.ts — Session management.
 *
 * Google: Firebase popup → POST /api/auth/session → backend JWT.
 * Email/password: POST /api/auth/register or /login (no Firebase) → backend JWT.
 * Refresh tokens are stored in localStorage so email sessions survive reload.
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  authLoading,
  authSuccess,
  authSignedOut,
  authError,
  backendTokenRefreshed,
} from './authSlice';
import {
  identityLoaded,
  identityCleared,
} from '../identity/identitySlice';
import {
  signInWithGoogle,
  signOut as signOutFirebase,
  getIdToken,
} from '../../lib/firebaseClient';
import {
  createSession,
  refreshSession,
  loginWithEmail as loginWithEmailApi,
  getMe,
  extractAlias,
  type SessionResponse,
} from '../../lib/authApi';
import {
  storeRefreshToken,
  readStoredRefreshToken,
  clearStoredRefreshToken,
} from '../../lib/tokenStorage';
import { AUTH_ERROR_MESSAGE, messageForAuthError } from '../../constants/auth';
import type { AppDispatch, RootState } from '../../store';

function applySession(dispatch: AppDispatch, session: SessionResponse, idToken = ''): void {
  storeRefreshToken(session.refreshToken);
  dispatch(
    authSuccess({
      user: {
        accountId:              session.accountId,
        firebaseUid:            '',
        role:                   session.role,
        isBanned:               session.isBanned,
        hasCompletedOnboarding: session.hasCompletedOnboarding,
      },
      idToken,
      accessToken:  session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn:    session.expiresIn,
    })
  );
}

async function loadIdentityIfReady(dispatch: AppDispatch, onboarded: boolean): Promise<void> {
  if (!onboarded) return;
  const profile = await getMe();
  const alias   = extractAlias(profile);
  if (alias) dispatch(identityLoaded(alias));
}

export const signInWithGoogleThunk = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>('auth/signInWithGoogle', async (_, { dispatch }) => {
  dispatch(authLoading());

  try {
    const firebaseUser = await signInWithGoogle();
    const idToken      = await firebaseUser.getIdToken();
    const session      = await createSession(idToken);

    if (session.isBanned) {
      dispatch(authError(AUTH_ERROR_MESSAGE.ACCOUNT_SUSPENDED));
      return;
    }

    applySession(dispatch, session, idToken);
    await loadIdentityIfReady(dispatch, session.hasCompletedOnboarding);
  } catch (err) {
    dispatch(authError(messageForAuthError(err)));
  }
});

export const signInWithEmailThunk = createAsyncThunk<
  void,
  { email: string; password: string },
  { dispatch: AppDispatch }
>('auth/signInWithEmail', async ({ email, password }, { dispatch }) => {
  dispatch(authLoading());

  try {
    const session = await loginWithEmailApi(email, password);

    if (session.isBanned) {
      dispatch(authError(AUTH_ERROR_MESSAGE.ACCOUNT_SUSPENDED));
      return;
    }

    applySession(dispatch, session);
    await loadIdentityIfReady(dispatch, session.hasCompletedOnboarding);
  } catch (err) {
    dispatch(authError(messageForAuthError(err)));
  }
});

export const signOutThunk = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>('auth/signOut', async (_, { dispatch }) => {
  try {
    await signOutFirebase();
  } finally {
    clearStoredRefreshToken();
    dispatch(authSignedOut());
    dispatch(identityCleared());
  }
});

export const restoreSessionThunk = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>('auth/restoreSession', async (_, { dispatch }) => {
  dispatch(authLoading());

  try {
    const storedRefresh = readStoredRefreshToken();
    if (storedRefresh) {
      const tokens = await refreshSession(storedRefresh);
      storeRefreshToken(tokens.refreshToken);
      dispatch(backendTokenRefreshed(tokens));

      const profile = await getMe();
      dispatch(
        authSuccess({
          user: {
            accountId:              profile.accountId,
            firebaseUid:            '',
            role:                   profile.role,
            isBanned:               false,
            hasCompletedOnboarding: profile.hasCompletedOnboarding,
          },
          idToken:      '',
          accessToken:  tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn:    tokens.expiresIn,
        })
      );
      await loadIdentityIfReady(dispatch, profile.hasCompletedOnboarding);
      return;
    }

    const idToken = await getIdToken();
    if (!idToken) {
      dispatch(authSignedOut());
      return;
    }

    const session = await createSession(idToken);
    if (session.isBanned) {
      dispatch(authSignedOut());
      return;
    }

    applySession(dispatch, session, idToken);
    await loadIdentityIfReady(dispatch, session.hasCompletedOnboarding);
  } catch {
    clearStoredRefreshToken();
    dispatch(authSignedOut());
  }
});

export const silentTokenRefreshThunk = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch; state: RootState }
>('auth/silentTokenRefresh', async (_, { dispatch, getState }) => {
  try {
    const currentRefreshToken =
      getState().auth.refreshToken ?? readStoredRefreshToken();

    if (!currentRefreshToken) {
      dispatch(authSignedOut());
      return;
    }

    const tokens = await refreshSession(currentRefreshToken);
    storeRefreshToken(tokens.refreshToken);
    dispatch(backendTokenRefreshed({
      accessToken:  tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn:    tokens.expiresIn,
    }));
  } catch {
    clearStoredRefreshToken();
    dispatch(authSignedOut());
    dispatch(identityCleared());
  }
});
