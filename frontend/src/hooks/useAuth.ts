/**
 * useAuth.ts — Restore AMONG session on load.
 *
 * Email/password sessions restore from the stored refresh token.
 * Google sessions can also restore via Firebase, then exchange for a JWT.
 */
'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { onAuthStateChanged } from '../lib/firebaseClient';
import { restoreSessionThunk } from '../features/auth/authThunks';
import {
  selectAuthStatus,
  selectIsAuthenticated,
  selectHasCompletedOnboarding,
  selectAuthUser,
} from '../features/auth/authSlice';
import type { AppDispatch } from '../store';

export interface UseAuthReturn {
  readonly isLoading:              boolean;
  readonly isAuthenticated:        boolean;
  readonly hasCompletedOnboarding: boolean;
  readonly user:                   ReturnType<typeof selectAuthUser>;
}

export function useAuth(): UseAuthReturn {
  const dispatch               = useDispatch<AppDispatch>();
  const status                 = useSelector(selectAuthStatus);
  const isAuthenticated        = useSelector(selectIsAuthenticated);
  const hasCompletedOnboarding = useSelector(selectHasCompletedOnboarding);
  const user                   = useSelector(selectAuthUser);

  useEffect(() => {
    void dispatch(restoreSessionThunk());

    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        void dispatch(restoreSessionThunk());
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  return {
    isLoading: status === 'idle' || status === 'loading',
    isAuthenticated,
    hasCompletedOnboarding,
    user,
  };
}
