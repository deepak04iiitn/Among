import { configureStore } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { rootReducer, type RootState } from './rootReducer';
import { loggerMiddleware } from './middleware';

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

export type { RootState };
export type AppDispatch = typeof store.dispatch;

// ─── Typed hooks ─────────────────────────────────────────────────────────────
// Use these throughout the app instead of plain `useDispatch` and `useSelector`
// so TypeScript can infer RootState and AppDispatch automatically.

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
