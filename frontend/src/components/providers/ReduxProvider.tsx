'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { store as defaultStore, type AppDispatch } from '../../store';
import type { Store } from '@reduxjs/toolkit';
import type { RootState } from '../../store/rootReducer';

interface ReduxProviderProps {
  children: React.ReactNode;
  /**
   * Allow injecting a custom store — used in unit tests.
   * Defaults to the singleton production store.
   */
  store?: Store<RootState, ReturnType<AppDispatch>>;
}

/**
 * Client-side Redux provider.
 * Must be a 'use client' component because React Context (and therefore
 * Redux Provider) cannot be used in React Server Components.
 *
 * Wrap this around the root <body> content in layout.tsx.
 */
export default function ReduxProvider({ children, store }: ReduxProviderProps) {
  // Stabilize the store reference so we don't re-create it on every render
  const storeRef = useRef<typeof defaultStore>(
    (store as typeof defaultStore | undefined) ?? defaultStore
  );

  return <Provider store={storeRef.current}>{children}</Provider>;
}
