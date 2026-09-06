import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// ─── Types ──────────────────────────────────────────────────────────────────

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated';

export interface AuthUser {
  /** AMONG MongoDB account ID — never exposed in UI or logs */
  readonly accountId: string;
  /** Firebase UID — stored here for token refresh, never included in API responses */
  readonly firebaseUid: string;
  /** Whether the user has finished the onboarding flow */
  readonly hasCompletedOnboarding: boolean;
  /** User role — 'user' | 'moderator' | 'admin' */
  readonly role: string;
  /** Whether the account is currently banned */
  readonly isBanned: boolean;
}

export interface AuthState {
  user:    AuthUser | null;
  status:  AuthStatus;
  error:   string | null;
  /** Firebase ID token — only used to exchange for backend JWT at session creation */
  idToken:       string | null;
  /** Backend-issued access token — used on every API request */
  accessToken:   string | null;
  /** Backend-issued refresh token — used to renew access token silently */
  refreshToken:  string | null;
  /** Unix timestamp (ms) when the access token expires */
  tokenExpiresAt: number | null;
}

// ─── Initial state ───────────────────────────────────────────────────────────

const initialState: AuthState = {
  user:           null,
  status:         'idle',
  error:          null,
  idToken:        null,
  accessToken:    null,
  refreshToken:   null,
  tokenExpiresAt: null,
};

// ─── Slice ───────────────────────────────────────────────────────────────────

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Called when Firebase auth state is loading */
    authLoading(state) {
      state.status = 'loading';
      state.error = null;
    },

    /** Called after successful sign-in + account lookup */
    authSuccess(
      state,
      action: PayloadAction<{
        user:         AuthUser;
        idToken:      string;
        accessToken:  string;
        refreshToken: string;
        expiresIn:    number; // seconds
      }>
    ) {
      state.user          = action.payload.user;
      state.idToken       = action.payload.idToken;
      state.accessToken   = action.payload.accessToken;
      state.refreshToken  = action.payload.refreshToken;
      state.tokenExpiresAt = Date.now() + action.payload.expiresIn * 1000;
      state.status = 'authenticated';
      state.error  = null;
    },

    /** Called on sign-out or when no Firebase user is present */
    authSignedOut(state) {
      state.user           = null;
      state.idToken        = null;
      state.accessToken    = null;
      state.refreshToken   = null;
      state.tokenExpiresAt = null;
      state.status = 'unauthenticated';
      state.error  = null;
    },

    /** Called when auth fails (network error, banned account, etc.) */
    authError(state, action: PayloadAction<string>) {
      state.error          = action.payload;
      state.status         = 'unauthenticated';
      state.user           = null;
      state.idToken        = null;
      state.accessToken    = null;
      state.refreshToken   = null;
      state.tokenExpiresAt = null;
    },

    /** Refresh the stored Firebase ID token (kept for re-auth fallback) */
    tokenRefreshed(state, action: PayloadAction<string>) {
      state.idToken = action.payload;
    },

    /** Store a newly-obtained backend token pair after silent refresh */
    backendTokenRefreshed(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string; expiresIn: number }>
    ) {
      state.accessToken    = action.payload.accessToken;
      state.refreshToken   = action.payload.refreshToken;
      state.tokenExpiresAt = Date.now() + action.payload.expiresIn * 1000;
    },

    /** Mark onboarding as completed after the user finishes the flow */
    onboardingCompleted(state) {
      if (state.user) {
        state.user = { ...state.user, hasCompletedOnboarding: true };
      }
    },
  },
});

export const {
  authLoading,
  authSuccess,
  authSignedOut,
  authError,
  tokenRefreshed,
  backendTokenRefreshed,
  onboardingCompleted,
} = authSlice.actions;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectAuthUser   = (state: RootState): AuthUser | null => state.auth.user;
export const selectAuthStatus = (state: RootState): AuthStatus       => state.auth.status;
export const selectIdToken    = (state: RootState): string | null    => state.auth.idToken;
export const selectAccessToken  = (state: RootState): string | null  => state.auth.accessToken;
export const selectRefreshToken = (state: RootState): string | null  => state.auth.refreshToken;
export const selectTokenExpiresAt = (state: RootState): number | null => state.auth.tokenExpiresAt;
export const selectIsAuthenticated = (state: RootState): boolean =>
  state.auth.status === 'authenticated' && state.auth.user !== null;
export const selectHasCompletedOnboarding = (state: RootState): boolean =>
  state.auth.user?.hasCompletedOnboarding ?? false;

export default authSlice.reducer;
