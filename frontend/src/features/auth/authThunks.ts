/**
 * authThunks.ts — Redux thunks for Firebase authentication + session management.
 *
 * Flow:
 *  1. User clicks "Sign in with Google"
 *  2. Firebase handles OAuth; client receives ID token
 *  3. ID token sent to /api/auth/session → AMONG account created/found
 *  4. Redux auth state updated with accountId and onboarding status
 *
 * Privacy: Firebase UID is only used in the auth layer. It is never
 * dispatched to the store's public-facing `user` object in any form
 * that routes or components can read.
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  authLoading,
  authSuccess,
  authSignedOut,
  authError,
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
  getMe,
  extractAlias,
} from '../../lib/authApi';
import type { AppDispatch } from '../../store';

// ─── Sign In ─────────────────────────────────────────────────────────────────

/**
 * Sign in with Google via Firebase, then exchange the ID token for
 * an AMONG session. Dispatches `authSuccess` on completion.
 */
export const signInWithGoogleThunk = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>('auth/signInWithGoogle', async (_, { dispatch }) => {
  dispatch(authLoading());

  try {
    // Step 1: Firebase Google OAuth — get User object
    const firebaseUser = await signInWithGoogle();
    const idToken      = await firebaseUser.getIdToken();

    // Step 2: Exchange for AMONG session
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
 * Called on app load. Checks Firebase `onAuthStateChanged` for an
 * existing session and restores the Redux state if one is found.
 *
 * This thunk is dispatched from the `useAuth` hook on mount.
 */
export const restoreSessionThunk = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>('auth/restoreSession', async (_, { dispatch }) => {
  dispatch(authLoading());

  try {
    // getIdToken() returns null if no Firebase user is signed in
    const idToken = await getIdToken();

    if (!idToken) {
      dispatch(authSignedOut());
      return;
    }

    // Refresh the AMONG session
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
    // Failed to restore — treat as unauthenticated
    dispatch(authSignedOut());
  }
});
