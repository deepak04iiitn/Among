import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AliasIdentity {
  /** Unique alias name, e.g. "Blue Fox" — the only public identity surface */
  readonly name: string;
  /** Seed used to deterministically render the avatar SVG */
  readonly avatarSeed: string;
  /** ISO timestamp of alias creation */
  readonly createdAt: string;
  /** ISO timestamp when the alias expires */
  readonly expiresAt: string | null;
}

export type IdentityStatus = 'idle' | 'loading' | 'ready' | 'rotating' | 'error';

export interface IdentityState {
  alias: AliasIdentity | null;
  status: IdentityStatus;
  error: string | null;
  /** Whether the alias reveal overlay has been dismissed this session */
  revealDismissed: boolean;
}

// ─── Initial state ───────────────────────────────────────────────────────────

const initialState: IdentityState = {
  alias: null,
  status: 'idle',
  error: null,
  revealDismissed: false,
};

// ─── Slice ───────────────────────────────────────────────────────────────────

export const identitySlice = createSlice({
  name: 'identity',
  initialState,
  reducers: {
    identityLoading(state) {
      state.status = 'loading';
      state.error = null;
    },

    identityLoaded(state, action: PayloadAction<AliasIdentity>) {
      state.alias = action.payload;
      state.status = 'ready';
      state.error = null;
    },

    identityError(state, action: PayloadAction<string>) {
      state.status = 'error';
      state.error = action.payload;
    },

    identityRotating(state) {
      state.status = 'rotating';
      state.error = null;
    },

    identityRotated(state, action: PayloadAction<AliasIdentity>) {
      state.alias = action.payload;
      state.status = 'ready';
      state.error = null;
      // New alias = new reveal moment — reset the dismiss flag
      state.revealDismissed = false;
    },

    revealDismissed(state) {
      state.revealDismissed = true;
    },

    identityCleared(state) {
      state.alias = null;
      state.status = 'idle';
      state.error = null;
      state.revealDismissed = false;
    },
  },
});

export const {
  identityLoading,
  identityLoaded,
  identityError,
  identityRotating,
  identityRotated,
  revealDismissed,
  identityCleared,
} = identitySlice.actions;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectAlias          = (state: RootState): AliasIdentity | null => state.identity.alias;
export const selectAliasName      = (state: RootState): string | null => state.identity.alias?.name ?? null;
export const selectAvatarSeed     = (state: RootState): string | null => state.identity.alias?.avatarSeed ?? null;
export const selectIdentityStatus = (state: RootState): IdentityStatus => state.identity.status;
export const selectRevealDismissed = (state: RootState): boolean => state.identity.revealDismissed;

export default identitySlice.reducer;
