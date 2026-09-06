import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// ─── Types ──────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'conversation_request'
  | 'conversation_expiry_warning'
  | 'conversation_expired'
  | 'someone_needs_you'
  | 'system';

export interface Notification {
  readonly id: string;
  readonly type: NotificationType;
  /** Generic display text — never contains message content or user PII */
  readonly text: string;
  readonly read: boolean;
  readonly createdAt: string;
  /** Deep-link target for navigation on tap */
  readonly targetPath: string | null;
}

export type NotificationsStatus = 'idle' | 'loading' | 'error';

export interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  status: NotificationsStatus;
  error: string | null;
  /** Whether the notifications panel is currently open */
  panelOpen: boolean;
}

// ─── Initial state ───────────────────────────────────────────────────────────

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  status: 'idle',
  error: null,
  panelOpen: false,
};

// ─── Slice ───────────────────────────────────────────────────────────────────

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    notificationsLoading(state) {
      state.status = 'loading';
      state.error = null;
    },

    notificationsLoaded(state, action: PayloadAction<Notification[]>) {
      state.items = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.read).length;
      state.status = 'idle';
    },

    notificationsError(state, action: PayloadAction<string>) {
      state.status = 'error';
      state.error = action.payload;
    },

    /** Prepend a new real-time notification */
    notificationReceived(state, action: PayloadAction<Notification>) {
      state.items = [action.payload, ...state.items];
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },

    notificationRead(state, action: PayloadAction<string>) {
      const idx = state.items.findIndex((n) => n.id === action.payload);
      if (idx !== -1) {
        const item = state.items[idx];
        if (item && !item.read) {
          state.items[idx] = { ...item, read: true };
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }
    },

    allNotificationsRead(state) {
      state.items = state.items.map((n) => ({ ...n, read: true }));
      state.unreadCount = 0;
    },

    panelOpened(state)  { state.panelOpen = true; },
    panelClosed(state)  { state.panelOpen = false; },
    panelToggled(state) { state.panelOpen = !state.panelOpen; },

    notificationsCleared(state) {
      state.items = [];
      state.unreadCount = 0;
      state.status = 'idle';
      state.error = null;
      state.panelOpen = false;
    },
  },
});

export const {
  notificationsLoading,
  notificationsLoaded,
  notificationsError,
  notificationReceived,
  notificationRead,
  allNotificationsRead,
  panelOpened,
  panelClosed,
  panelToggled,
  notificationsCleared,
} = notificationsSlice.actions;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectNotifications    = (state: RootState): Notification[]         => state.notifications.items;
export const selectUnreadCount      = (state: RootState): number                 => state.notifications.unreadCount;
export const selectNotificationsStatus = (state: RootState): NotificationsStatus => state.notifications.status;
export const selectPanelOpen        = (state: RootState): boolean                => state.notifications.panelOpen;

export default notificationsSlice.reducer;
