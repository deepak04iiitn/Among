/**
 * authThunks.ts — Redux thunks for Firebase authentication + session management.
 *
 * Flow:
 *  1. User clicks "Sign in with Google"
 *  2. Firebase handles OAuth; client receives Firebase ID token (one-time use)
 *  3. Firebase ID token sent to POST /api/auth/session
 *  4. Backend verifies Firebase token, issues backend JWT pair (access + refresh)
 *  5. Redux auth state updated; apiClient uses backend JWT on all subsequent calls
 *  6. Access token silently refreshed via POST /api/auth/refresh before expiry
 *
 * Privacy: Firebase UID is only used in the auth layer. It is never dispatched
 * to the store's public-facing `user` object in any form that routes or
 * components can read.
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
  getMe,
  extractAlias,
} from '../../lib/authApi';
import type { AppDispatch, RootState } from '../../store';

// ─── Sign In ─────────────────────────────────────────────────────────────────

/**
 * Sign in with Google via Firebase, then exchange the Firebase ID token
 * for a backend JWT pair. Dispatches `authSuccess` on completion.
 */
export const signInWithGoogleThunk = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>('auth/signInWithGoogle', async (_, { dispatch }) => {
  dispatch(authLoading());

  try {
    // Step 1: Firebase Google OAuth — get Firebase ID token
    const firebaseUser = await signInWithGoogle();
    const idToken      = await firebaseUser.getIdToken();

    // Step 2: Exchange Firebase token for AMONG backend JWT pair (one-time)
    const session = await createSession(idToken);

    if (session.isBanned) {
      dispatch(authError('Your account has been suspended.'));
      return;
    }

    dispatch(
      authSuccess({
        user: {
          accountId:              session.accountId,
          firebaseUid:            '', // Deliberately empty — not exposed in state
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

    // Step 3: Load identity if onboarding is complete
    if (session.hasCompletedOnboarding) {
      const profile = await getMe();
      const alias   = extractAlias(profile);
      if (alias) {
        dispatch(identityLoaded(alias));
      }
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
    dispatch(authError(message));
  }
});

// ─── Sign Out ────────────────────────────────────────────────────────────────

/**
 * Sign out of Firebase and clear all auth + identity state.
 */
export const signOutThunk = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>('auth/signOut', async (_, { dispatch }) => {
  try {
    await signOutFirebase();
  } finally {
    dispatch(authSignedOut());
    dispatch(identityCleared());
  }
});

// ─── Restore Session ─────────────────────────────────────────────────────────

/**
 * Called on app load. Checks Firebase `onAuthStateChanged` for an existing
 * session, re-exchanges for a fresh backend JWT pair, and restores Redux state.
 */
export const restoreSessionThunk = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>('auth/restoreSession', async (_, { dispatch }) => {
  dispatch(authLoading());

  try {
    // Get Firebase ID token — null if user is not signed in
    const idToken = await getIdToken();

    if (!idToken) {
      dispatch(authSignedOut());
      return;
    }

    // Re-exchange Firebase token for a fresh backend JWT pair on every app load
    const session = await createSession(idToken);

    if (session.isBanned) {
      dispatch(authSignedOut());
      return;
    }

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

    // Restore identity if onboarding is complete
    if (session.hasCompletedOnboarding) {
      const profile = await getMe();
      const alias   = extractAlias(profile);
      if (alias) {
        dispatch(identityLoaded(alias));
      }
    }
  } catch {
    dispatch(authSignedOut());
  }
});

// ─── Silent Token Refresh ─────────────────────────────────────────────────────

/**
 * Silently renew the backend access token using the stored refresh token.
 * Called by the apiClient interceptor when the access token is about to expire
 * (or has expired). Falls back to signing out on refresh token failure.
 */
export const silentTokenRefreshThunk = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch; state: RootState }
>('auth/silentTokenRefresh', async (_, { dispatch, getState }) => {
  try {
    const { auth } = getState();
    const currentRefreshToken = auth.refreshToken;

    if (!currentRefreshToken) {
      dispatch(authSignedOut());
      return;
    }

    const tokens = await refreshSession(currentRefreshToken);

    dispatch(backendTokenRefreshed({
      accessToken:  tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn:    tokens.expiresIn,
    }));
  } catch {
    // Refresh token expired or invalid — force sign-out
    dispatch(authSignedOut());
    dispatch(identityCleared());
  }
});
