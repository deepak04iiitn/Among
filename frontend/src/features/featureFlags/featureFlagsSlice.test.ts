import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../../store/rootReducer';
import {
  flagsLoaded,
  flagsError,
  flagOverridden,
  selectFlag,
  selectFlagsLoaded,
  selectAllFlags,
} from './featureFlagsSlice';
import { FEATURE_FLAG, type FeatureFlag as FeatureFlagName } from '../../constants/featureFlags';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

// ─── Initial state ────────────────────────────────────────────────────────────

describe('featureFlagsSlice — initial state', () => {
  it('has loaded = false', () => {
    const store = makeStore();
    expect(selectFlagsLoaded(store.getState())).toBe(false);
  });

  it('all flags are false by default (safe off)', () => {
    const store = makeStore();
    const flags = selectAllFlags(store.getState());
    Object.values(FEATURE_FLAG).forEach((flag) => {
      expect(flags[flag as FeatureFlagName]).toBe(false);
    });
  });

  it('selectFlag returns false for any flag in default state', () => {
    const store = makeStore();
    Object.values(FEATURE_FLAG).forEach((flag) => {
      expect(selectFlag(flag as FeatureFlagName)(store.getState())).toBe(false);
    });
  });
});

// ─── flagsLoaded ─────────────────────────────────────────────────────────────

describe('flagsLoaded', () => {
  it('sets loaded to true', () => {
    const store = makeStore();
    store.dispatch(flagsLoaded({}));
    expect(selectFlagsLoaded(store.getState())).toBe(true);
  });

  it('merges loaded flags with defaults — specified flag becomes true', () => {
    const store = makeStore();
    const firstFlag = Object.values(FEATURE_FLAG)[0] as FeatureFlagName;
    store.dispatch(flagsLoaded({ [firstFlag]: true }));
    expect(selectFlag(firstFlag)(store.getState())).toBe(true);
  });

  it('keeps unspecified flags as false', () => {
    const store = makeStore();
    const allFlags = Object.values(FEATURE_FLAG) as FeatureFlagName[];
    const firstFlag = allFlags[0];
    if (!firstFlag) return;
    store.dispatch(flagsLoaded({ [firstFlag]: true }));
    allFlags.slice(1).forEach((flag) => {
      expect(selectFlag(flag)(store.getState())).toBe(false);
    });
  });

  it('overrides a previously-enabled flag back to false', () => {
    const store = makeStore();
    const firstFlag = Object.values(FEATURE_FLAG)[0] as FeatureFlagName;
    store.dispatch(flagsLoaded({ [firstFlag]: true }));
    store.dispatch(flagsLoaded({ [firstFlag]: false }));
    expect(selectFlag(firstFlag)(store.getState())).toBe(false);
  });
});

// ─── flagsError ──────────────────────────────────────────────────────────────

describe('flagsError', () => {
  it('sets loaded to true even on error (safe fallback)', () => {
    const store = makeStore();
    store.dispatch(flagsError('Server unavailable'));
    expect(selectFlagsLoaded(store.getState())).toBe(true);
  });

  it('all flags remain false on error', () => {
    const store = makeStore();
    store.dispatch(flagsError('Server unavailable'));
    const flags = selectAllFlags(store.getState());
    Object.values(flags).forEach((enabled) => {
      expect(enabled).toBe(false);
    });
  });
});

// ─── flagOverridden ──────────────────────────────────────────────────────────

describe('flagOverridden', () => {
  it('overrides a single flag to true', () => {
    const store = makeStore();
    const firstFlag = Object.values(FEATURE_FLAG)[0] as FeatureFlagName;
    store.dispatch(flagOverridden({ flag: firstFlag, enabled: true }));
    expect(selectFlag(firstFlag)(store.getState())).toBe(true);
  });

  it('overrides a single flag back to false', () => {
    const store = makeStore();
    const firstFlag = Object.values(FEATURE_FLAG)[0] as FeatureFlagName;
    store.dispatch(flagOverridden({ flag: firstFlag, enabled: true }));
    store.dispatch(flagOverridden({ flag: firstFlag, enabled: false }));
    expect(selectFlag(firstFlag)(store.getState())).toBe(false);
  });

  it('does not affect other flags', () => {
    const store = makeStore();
    const allFlags = Object.values(FEATURE_FLAG) as FeatureFlagName[];
    if (allFlags.length < 2) return;
    const firstFlag = allFlags[0] as FeatureFlagName;
    const secondFlag = allFlags[1] as FeatureFlagName;
    store.dispatch(flagOverridden({ flag: firstFlag, enabled: true }));
    expect(selectFlag(secondFlag)(store.getState())).toBe(false);
  });
});
