import { configureStore } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { rootReducer, type RootState } from './rootReducer';
import { loggerMiddleware } from './middleware';
import { configureApiClientAuth } from '../lib/apiClient';
import { silentTokenRefreshThunk } from '../features/auth/authThunks';
import { authSignedOut } from '../features/auth/authSlice';

/**
 * AMONG Redux store.
 * - RTK default middleware (thunk, serializability check, immutability check)
 * - Custom logger middleware (dev only)
 * - Redux DevTools enabled in development
 */
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(loggerMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Wire the apiClient to Redux so it can read and refresh the JWT
// without importing the store directly (prevents circular dependencies).
configureApiClientAuth(
  // Getter — reads current tokens from state
  () => {
    const { auth } = store.getState() as RootState;
    return {
      accessToken:    auth.accessToken,
      tokenExpiresAt: auth.tokenExpiresAt,
      refreshToken:   auth.refreshToken,
    };
  },
  // Refresher — dispatches the silent refresh thunk
  async () => {
    await (store.dispatch as AppDispatch)(silentTokenRefreshThunk());
  },
  // Sign-out — dispatches authSignedOut
  () => { store.dispatch(authSignedOut()); }
);

export type { RootState };
export type AppDispatch = typeof store.dispatch;

// ─── Typed hooks ─────────────────────────────────────────────────────────────
// Use these throughout the app instead of plain `useDispatch` and `useSelector`
// so TypeScript can infer RootState and AppDispatch automatically.

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
