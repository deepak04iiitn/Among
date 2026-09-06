/**
 * notificationsThunks.ts — Async logic for notification operations.
 */
import * as api from '../../lib/notificationsApi';
import {
  notificationsLoading,
  notificationsLoaded,
  notificationsError,
  notificationRead,
  allNotificationsRead,
} from './notificationsSlice';
import type { AppDispatch, RootState } from '../../store';
import type { Notification } from './notificationsSlice';
import type { ApiNotification } from '../../lib/notificationsApi';
import { ROUTES } from '../../constants/routes';
import { NOTIFICATION_TYPE } from '../../constants/notificationTypes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTargetPath(n: ApiNotification): string | null {
  switch (n.type) {
    case NOTIFICATION_TYPE.REACTION_ON_POST:
      return ROUTES.POST_DETAIL(n.referenceId);
    case NOTIFICATION_TYPE.NEW_MESSAGE:
    case NOTIFICATION_TYPE.EXPIRY_WARNING:
      return ROUTES.CONVERSATION_DETAIL(n.referenceId);
    case NOTIFICATION_TYPE.SNY_PROMPT:
      return ROUTES.SOMEONE_NEEDS_YOU;
    case NOTIFICATION_TYPE.MODERATION_ACTION:
      return ROUTES.SETTINGS;
    default:
      return null;
  }
}

function toStoreNotification(n: ApiNotification): Notification {
  return {
    id:         n.id,
    type:       n.type as Notification['type'],
    text:       n.genericText,
    read:       n.isRead,
    createdAt:  n.createdAt,
    targetPath: buildTargetPath(n),
  };
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export function fetchNotificationsThunk() {
  return async (dispatch: AppDispatch) => {
    dispatch(notificationsLoading());
    try {
      const page = await api.fetchUnreadNotifications();
      dispatch(notificationsLoaded(page.notifications.map(toStoreNotification)));
    } catch {
      dispatch(notificationsError('Unable to load notifications.'));
    }
  };
}

export function markNotificationReadThunk(notificationId: string) {
  return async (dispatch: AppDispatch) => {
    // Optimistic update first
    dispatch(notificationRead(notificationId));
    try {
      await api.markNotificationRead(notificationId);
    } catch {
      // Tolerate — already marked in UI
    }
  };
}

export function markAllNotificationsReadThunk() {
  return async (dispatch: AppDispatch) => {
    dispatch(allNotificationsRead());
    try {
      await api.markAllNotificationsRead();
    } catch {
      // Tolerate — already marked in UI
    }
  };
}

/**
 * Poll for new notifications every `intervalMs` milliseconds.
 * Returns a cleanup function that stops the polling.
 */
export function startNotificationPolling(intervalMs: number = 30_000) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const poll = () => {
      // Only poll if there could be unread items
      const { status } = getState().notifications;
      if (status !== 'loading') {
        void dispatch(fetchNotificationsThunk() as any);
      }
    };

    const handle = setInterval(poll, intervalMs);
    return () => clearInterval(handle);
  };
}
