import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import {
  FEATURE_FLAG,
  type FeatureFlag as FeatureFlagName,
} from '../../constants/featureFlags';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FeatureFlagsState {
  /** All flags keyed by FeatureFlagName — default all false (safe off) */
  flags: Record<FeatureFlagName, boolean>;
  /** Whether flags have been loaded from the server */
  loaded: boolean;
  error: string | null;
}

// ─── Default flags — all off at MVP ──────────────────────────────────────────

const defaultFlags: Record<FeatureFlagName, boolean> = Object.fromEntries(
  Object.values(FEATURE_FLAG).map((name) => [name, false])
) as Record<FeatureFlagName, boolean>;

// ─── Initial state ───────────────────────────────────────────────────────────

const initialState: FeatureFlagsState = {
  flags: defaultFlags,
  loaded: false,
  error: null,
};

// ─── Slice ───────────────────────────────────────────────────────────────────

export const featureFlagsSlice = createSlice({
  name: 'featureFlags',
  initialState,
  reducers: {
    flagsLoaded(state, action: PayloadAction<Partial<Record<FeatureFlagName, boolean>>>) {
      state.flags = { ...defaultFlags, ...action.payload };
      state.loaded = true;
      state.error = null;
    },

    flagsError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      // Keep defaults (all off) on error — safe fallback
      state.loaded = true;
    },

    /** Override a single flag — for admin tooling or local dev */
    flagOverridden(
      state,
      action: PayloadAction<{ flag: FeatureFlagName; enabled: boolean }>
    ) {
      state.flags[action.payload.flag] = action.payload.enabled;
    },
  },
});

export const { flagsLoaded, flagsError, flagOverridden } = featureFlagsSlice.actions;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectFlag = (flag: FeatureFlagName) =>
  (state: RootState): boolean => state.featureFlags.flags[flag] ?? false;

export const selectFlagsLoaded = (state: RootState): boolean => state.featureFlags.loaded;

export const selectAllFlags = (state: RootState): Record<FeatureFlagName, boolean> =>
  state.featureFlags.flags;

export default featureFlagsSlice.reducer;
