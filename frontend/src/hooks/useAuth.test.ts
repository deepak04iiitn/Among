/**
 * useAuth.test.ts — Unit tests for the useAuth hook.
 */
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { rootReducer } from '../store/rootReducer';

// ─── Mocks ─────────────────────────────────────────────────────────────────

const mockOnAuthStateChanged = jest.fn();
const mockDispatch = jest.fn((action) => action);

jest.mock('../lib/firebaseClient', () => ({
  onAuthStateChanged: (cb: (user: unknown) => void) => {
    mockOnAuthStateChanged(cb);
    return jest.fn(); // unsubscribe
  },
}));

jest.mock('../features/auth/authThunks', () => ({
  restoreSessionThunk: () => ({ type: 'auth/restoreSession/pending' }),
}));

import { useAuth } from './useAuth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeWrapper(store: any) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store, children });
  };
}

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns isLoading=true initially (status=idle)', () => {
    const store   = configureStore({ reducer: rootReducer });
    const wrapper = makeWrapper(store);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it('calls onAuthStateChanged on mount', () => {
    const store   = configureStore({ reducer: rootReducer });
    const wrapper = makeWrapper(store);

    renderHook(() => useAuth(), { wrapper });

    expect(mockOnAuthStateChanged).toHaveBeenCalledTimes(1);
  });

  it('dispatches restoreSessionThunk when firebase user is present', () => {
    const store   = configureStore({ reducer: rootReducer });
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const wrapper = makeWrapper(store);

    renderHook(() => useAuth(), { wrapper });

    // Simulate Firebase auth state change with a user
    act(() => {
      const callback = mockOnAuthStateChanged.mock.calls[0]?.[0] as (user: unknown) => void;
      callback({ uid: 'firebase-uid' });
    });

    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('does not sign out when firebase user is null', () => {
    const store   = configureStore({ reducer: rootReducer });
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const wrapper = makeWrapper(store);

    renderHook(() => useAuth(), { wrapper });
    const callsAfterMount = dispatchSpy.mock.calls.length;

    act(() => {
      const callback = mockOnAuthStateChanged.mock.calls[0]?.[0] as (user: null) => void;
      callback(null);
    });

    expect(dispatchSpy.mock.calls.length).toBe(callsAfterMount);
  });

  it('returns isAuthenticated=false when user is null', () => {
    const store   = configureStore({ reducer: rootReducer });
    const wrapper = makeWrapper(store);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
  });
});

void mockDispatch;
