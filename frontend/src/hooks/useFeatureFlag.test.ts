/**
 * useFeatureFlag.test.ts — Unit tests for the useFeatureFlag hook.
 */
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { createElement } from 'react';
import { useFeatureFlag } from './useFeatureFlag';
import featureFlagsReducer, {
  flagOverridden,
} from '../features/featureFlags/featureFlagsSlice';

function makeStore() {
  return configureStore({ reducer: { featureFlags: featureFlagsReducer } });
}

function wrapper(store: ReturnType<typeof makeStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

describe('useFeatureFlag', () => {
  it('returns false by default for all flags (safe-off)', () => {
    const store = makeStore();
    const { result } = renderHook(() => useFeatureFlag('someoneNeedsYou'), {
      wrapper: wrapper(store),
    });
    expect(result.current).toBe(false);
  });

  it('returns true when flag is enabled', () => {
    const store = makeStore();
    store.dispatch(flagOverridden({ flag: 'someoneNeedsYou', enabled: true }));
    const { result } = renderHook(() => useFeatureFlag('someoneNeedsYou'), {
      wrapper: wrapper(store),
    });
    expect(result.current).toBe(true);
  });

  it('returns false again when flag is disabled', () => {
    const store = makeStore();
    store.dispatch(flagOverridden({ flag: 'someoneNeedsYou', enabled: true }));
    store.dispatch(flagOverridden({ flag: 'someoneNeedsYou', enabled: false }));
    const { result } = renderHook(() => useFeatureFlag('someoneNeedsYou'), {
      wrapper: wrapper(store),
    });
    expect(result.current).toBe(false);
  });

  it('works for other flags independently', () => {
    const store = makeStore();
    store.dispatch(flagOverridden({ flag: 'experienceGraphView', enabled: true }));
    const { result } = renderHook(() => useFeatureFlag('experienceGraphView'), {
      wrapper: wrapper(store),
    });
    expect(result.current).toBe(true);
  });
});
