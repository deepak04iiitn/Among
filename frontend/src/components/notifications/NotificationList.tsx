'use client';

import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Check, MessageSquare, Heart, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  selectNotifications,
  selectUnreadCount,
  panelClosed,
} from '../../features/notifications/notificationsSlice';
import {
  markNotificationReadThunk,
  markAllNotificationsReadThunk,
} from '../../features/notifications/notificationsThunks';
import { NOTIFICATION_TYPE } from '../../constants/notificationTypes';
import type { AppDispatch } from '../../store';
import type { Notification } from '../../features/notifications/notificationsSlice';

// ─── Type-based icon mapping ──────────────────────────────────────────────────

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const cls = 'w-4 h-4 flex-shrink-0 text-[var(--color-text-muted)]';
  switch (type) {
    case NOTIFICATION_TYPE.REACTION_ON_POST:
      return <Heart size={16} strokeWidth={1.5} className={cls} aria-hidden="true" />;
    case NOTIFICATION_TYPE.NEW_MESSAGE:
      return <MessageSquare size={16} strokeWidth={1.5} className={cls} aria-hidden="true" />;
    case NOTIFICATION_TYPE.EXPIRY_WARNING:
      return <Clock size={16} strokeWidth={1.5} className={cls} aria-hidden="true" />;
    case NOTIFICATION_TYPE.MODERATION_ACTION:
      return <AlertCircle size={16} strokeWidth={1.5} className={cls} aria-hidden="true" />;
    default:
      return <Bell size={16} strokeWidth={1.5} className={cls} aria-hidden="true" />;
  }
}

// ─── Individual notification item ─────────────────────────────────────────────

interface NotificationItemProps {
  notification: Notification;
  onNavigate:   (path: string | null) => void;
}

function NotificationItem({ notification, onNavigate }: NotificationItemProps) {
  const dispatch = useDispatch<AppDispatch>();

  const handleClick = () => {
    if (!notification.read) {
      void dispatch(markNotificationReadThunk(notification.id));
    }
    onNavigate(notification.targetPath);
  };

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'w-full text-left flex items-start gap-3 p-3',
          'transition-colors duration-[var(--duration-fast)]',
          'hover:bg-[color-mix(in_srgb,var(--color-border)_40%,transparent)]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
          'rounded-[var(--radius-sm)]',
          !notification.read && 'bg-[color-mix(in_srgb,var(--color-accent)_4%,transparent)]',
        )}
        aria-label={`${notification.text}${!notification.read ? ' (unread)' : ''}`}
      >
        {/* Unread indicator */}
        {!notification.read && (
          <span
            aria-hidden="true"
            className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"
          />
        )}
        {notification.read && (
          <span aria-hidden="true" className="mt-1.5 flex-shrink-0 w-1.5 h-1.5" />
        )}

        <NotificationIcon type={notification.type} />

        <p className="flex-1 min-w-0 text-ui text-[var(--color-text)] leading-snug">
          {notification.text}
        </p>
      </button>
    </li>
  );
}

// ─── NotificationList panel ───────────────────────────────────────────────────

interface NotificationListProps {
  onNavigate?: (path: string | null) => void;
}

export default function NotificationList({ onNavigate }: NotificationListProps): React.JSX.Element {
  const dispatch      = useDispatch<AppDispatch>();
  const notifications = useSelector(selectNotifications);
  const unreadCount   = useSelector(selectUnreadCount);

  const handleNavigate = (path: string | null) => {
    dispatch(panelClosed());
    onNavigate?.(path);
  };

  return (
    <div
      className={cn(
        'w-80 max-h-[480px] overflow-y-auto',
        'bg-[var(--color-bg)] border border-[var(--color-border)]',
        'rounded-[var(--radius-lg)]',
        'shadow-none',
      )}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <span className="text-ui font-medium text-[var(--color-text)]">
          Notifications
        </span>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void dispatch(markAllNotificationsReadThunk())}
            className={cn(
              'flex items-center gap-1 text-caption text-[var(--color-accent)]',
              'hover:opacity-80 transition-opacity',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
              'rounded-[var(--radius-sm)] px-1',
            )}
            aria-label="Mark all notifications as read"
          >
            <Check size={12} strokeWidth={2} aria-hidden="true" />
            Mark all read
          </button>
        )}
      </div>

      {/* ─── List ─── */}
      {notifications.length === 0 ? (
        <p className="px-4 py-6 text-center text-caption text-[var(--color-text-muted)] font-[var(--font-ui)]">
          No new notifications.
        </p>
      ) : (
        <ul className="p-2 space-y-0.5" role="list" aria-label="Notification items">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onNavigate={handleNavigate} />
          ))}
        </ul>
      )}
    </div>
  );
}
