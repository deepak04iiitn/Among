/**
 * useAuth.ts — React hook for Firebase auth state and session restoration.
 *
 * Subscribes to Firebase `onAuthStateChanged`. On mount:
 *  - If a Firebase user exists → dispatch `restoreSessionThunk`
 *  - If no Firebase user     → dispatch `authSignedOut`
 *
 * Returns reactive auth state from the Redux store.
 */
'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { onAuthStateChanged } from '../lib/firebaseClient';
import { restoreSessionThunk } from '../features/auth/authThunks';
import { authSignedOut } from '../features/auth/authSlice';
import {
  selectAuthStatus,
  selectIsAuthenticated,
  selectHasCompletedOnboarding,
  selectAuthUser,
} from '../features/auth/authSlice';
import type { AppDispatch } from '../store';

export interface UseAuthReturn {
  /** True while auth state is being determined */
  readonly isLoading:             boolean;
  /** True when the user is authenticated */
  readonly isAuthenticated:       boolean;
  /** True when the user has finished the onboarding flow */
  readonly hasCompletedOnboarding: boolean;
  /** The authenticated user's AMONG account details, or null */
  readonly user:                  ReturnType<typeof selectAuthUser>;
}

export function useAuth(): UseAuthReturn {
  const dispatch       = useDispatch<AppDispatch>();
  const status         = useSelector(selectAuthStatus);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const hasCompletedOnboarding = useSelector(selectHasCompletedOnboarding);
  const user           = useSelector(selectAuthUser);

  useEffect(() => {
    // Subscribe to Firebase auth state changes.
    // On each change, either restore the session or clear auth state.
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        void dispatch(restoreSessionThunk());
      } else {
        dispatch(authSignedOut());
      }
    });

    // Cleanup: unsubscribe when the component unmounts
    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  return {
    isLoading:              status === 'idle' || status === 'loading',
    isAuthenticated,
    hasCompletedOnboarding,
    user,
  };
}
