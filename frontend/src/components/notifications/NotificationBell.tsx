'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { cn } from '../../lib/utils';
import {
  selectUnreadCount,
  selectPanelOpen,
  panelToggled,
  panelClosed,
} from '../../features/notifications/notificationsSlice';
import { fetchNotificationsThunk } from '../../features/notifications/notificationsThunks';
import NotificationList from './NotificationList';
import type { AppDispatch } from '../../store';

/**
 * NotificationBell — nav icon with unread count badge.
 *
 * - Shows unread count badge (max 9+).
 * - Opens/closes the NotificationList panel.
 * - Polls for new notifications on mount and on panel open.
 * - Keyboard: Enter/Space opens panel; Escape closes it.
 * - Focus: trap closes on outside click or Escape.
 *
 * WCAG AA: aria-label, aria-expanded, aria-haspopup, focus management.
 */
interface NotificationBellProps {
  onNavigate?: (path: string | null) => void;
  className?:  string;
}

export default function NotificationBell({
  onNavigate,
  className,
}: NotificationBellProps): React.JSX.Element {
  const dispatch    = useDispatch<AppDispatch>();
  const unreadCount = useSelector(selectUnreadCount);
  const panelOpen   = useSelector(selectPanelOpen);
  const panelRef    = React.useRef<HTMLDivElement>(null);
  const buttonRef   = React.useRef<HTMLButtonElement>(null);

  // Fetch notifications on mount
  React.useEffect(() => {
    void dispatch(fetchNotificationsThunk());
  }, [dispatch]);

  // Close on outside click
  React.useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        dispatch(panelClosed());
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen, dispatch]);

  // Close on Escape
  React.useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch(panelClosed());
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [panelOpen, dispatch]);

  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);
  const ariaLabel  = unreadCount > 0
    ? `Notifications — ${unreadCount} unread`
    : 'Notifications';

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={panelOpen}
        aria-haspopup="true"
        onClick={() => dispatch(panelToggled())}
        className={cn(
          'relative flex items-center justify-center',
          'w-10 h-10 rounded-full',
          'text-[var(--color-text-muted)]',
          'hover:text-[var(--color-text)]',
          'transition-colors duration-[var(--duration-fast)]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
        )}
      >
        <Bell size={20} strokeWidth={1.5} aria-hidden="true" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className={cn(
              'absolute top-1.5 right-1.5',
              'flex items-center justify-center',
              'min-w-[16px] h-4 px-1',
              'bg-[var(--color-accent)] text-[var(--color-bg)]',
              'text-[10px] font-medium leading-none',
              'rounded-full',
            )}
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {panelOpen && (
        <div
          ref={panelRef}
          className={cn(
            'absolute right-0 top-full mt-2 z-40',
            'animate-[slideUp_200ms_var(--ease-out)_both]',
          )}
          role="presentation"
        >
          <NotificationList {...(onNavigate ? { onNavigate } : {})} />
        </div>
      )}
    </div>
  );
}
