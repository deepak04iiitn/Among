/**
 * identityThunks.ts — Redux thunks for alias identity management.
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  identityLoading,
  identityLoaded,
  identityError,
  identityRotating,
  identityRotated,
} from './identitySlice';
import {
  getMe,
  rotateAlias,
  extractAlias,
} from '../../lib/authApi';
import type { AppDispatch } from '../../store';

// ─── Fetch Identity ───────────────────────────────────────────────────────────

/**
 * Fetch the current user's alias from the server and load it into state.
 * Called after sign-in and after onboarding completion.
 */
export const fetchIdentityThunk = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>('identity/fetch', async (_, { dispatch }) => {
  dispatch(identityLoading());

  try {
    const profile = await getMe();
    const alias   = extractAlias(profile);

    if (alias) {
      dispatch(identityLoaded(alias));
    } else {
      dispatch(identityError('No alias found. Please complete onboarding.'));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load identity';
    dispatch(identityError(message));
  }
});

// ─── Rotate Alias ─────────────────────────────────────────────────────────────

/**
 * Request an alias rotation. On success, updates the identity slice with the
 * new alias and resets the `revealDismissed` flag so the user sees the reveal.
 *
 * Rate-limited: the server enforces a 24-hour window.
 */
export const rotateAliasThunk = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>('identity/rotate', async (_, { dispatch }) => {
  dispatch(identityRotating());

  try {
    const response = await rotateAlias();

    dispatch(
      identityRotated({
        name:       response.aliasName,
        avatarSeed: response.avatarSeed,
        createdAt:  new Date().toISOString(),
        expiresAt:  null,
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Alias rotation failed';
    dispatch(identityError(message));
  }
});
