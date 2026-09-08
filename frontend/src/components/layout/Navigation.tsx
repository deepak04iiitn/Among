'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, PenLine, Home, Compass, MessageSquare, User, type LucideIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectIsAuthenticated } from '../../features/auth/authSlice';
import { selectUnreadCount } from '../../features/notifications/notificationsSlice';
import { signOutThunk } from '../../features/auth/authThunks';
import { ROUTES } from '../../constants/routes';
import Logo from './Logo';

/**
 * Primary navigation.
 *
 * Desktop: top bar — text-only links, compose pill, notification bell.
 * Mobile: fixed bottom bar — thin-stroke icons + labels.
 *
 * Design spec: the nav is almost invisible — it never competes with content.
 * Active route: font-medium, no color change — weight is the only signal.
 */

interface NavLink {
  href: string;
  label: string;
  /** lucide-react icon — mobile only */
  Icon: LucideIcon;
}

const APP_NAV_LINKS: NavLink[] = [
  { href: ROUTES.HOME,           label: 'Home',          Icon: Home },
  { href: ROUTES.EXPLORE,        label: 'Explore',       Icon: Compass },
  { href: ROUTES.CONVERSATIONS,  label: 'Conversations', Icon: MessageSquare },
  { href: ROUTES.YOU_ARE_NOT_ALONE, label: 'You',        Icon: User },
];

export default function Navigation() {
  const pathname         = usePathname();
  const router           = useRouter();
  const dispatch         = useAppDispatch();
  const isAuthenticated  = useAppSelector(selectIsAuthenticated);
  const unreadCount      = useAppSelector(selectUnreadCount);

  const isActive = (href: string): boolean => pathname === href || pathname.startsWith(href + '/');

  async function handleSignOut(): Promise<void> {
    await dispatch(signOutThunk());
    router.push(ROUTES.LANDING);
  }

  // Public nav (unauthenticated)
  if (!isAuthenticated) {
    return (
      <header
        role="banner"
        className="sticky top-0 z-40 bg-[var(--color-bg)] border-b border-[var(--color-border)]"
      >
        <div className="content-column h-14 flex items-center justify-between">
          {/* Brand */}
          <Logo href={ROUTES.LANDING} height={24} />

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            <Link
              href={ROUTES.EXPLORE}
              className="text-ui text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors hidden sm:block"
            >
              Explore
            </Link>
            <Link
              href={ROUTES.LANDING}
              className="btn-primary text-ui py-2 px-5"
            >
              Enter Among
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* ── Desktop top navigation ── */}
      <header
        role="banner"
        className="sticky top-0 z-40 bg-[var(--color-bg)] border-b border-[var(--color-border)] hidden md:block"
      >
        <div className="content-column max-w-shell h-14 flex items-center justify-between">
          {/* Brand */}
          <Logo href={ROUTES.HOME} height={24} className="mr-8" />

          {/* Primary nav links — text only, weight signals active */}
          <nav aria-label="Primary navigation" className="flex items-center gap-6 flex-1">
            {APP_NAV_LINKS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'text-ui transition-colors',
                    active
                      ? 'text-[var(--color-text)] font-medium'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
                  ].join(' ')}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side: notification + compose */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button
              type="button"
              aria-label={
                unreadCount > 0
                  ? `Notifications — ${unreadCount} unread`
                  : 'Notifications'
              }
              className="relative p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
            >
              <Bell size={18} strokeWidth={1.5} aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"
                />
              )}
            </button>

            {/* Compose — the single visually emphasized nav element */}
            <Link
              href={ROUTES.COMPOSE}
              aria-label="Share a new experience"
              className="btn-secondary flex items-center gap-1.5 py-1.5 px-4 text-ui"
            >
              <PenLine size={14} strokeWidth={1.5} aria-hidden="true" />
              Share
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="text-ui text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors min-h-[44px] px-2"
              aria-label="Log out of AMONG"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom navigation ── */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-bg)] border-t border-[var(--color-border)] safe-area-inset-bottom"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {APP_NAV_LINKS.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                className={[
                  'flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center',
                  'transition-colors text-caption',
                  active
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                ].join(' ')}
              >
                <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}

          {/* Compose — slightly larger, pill-shaped, center-weighted */}
          <Link
            href={ROUTES.COMPOSE}
            aria-label="Share a new experience"
            className="flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center
                       text-caption text-[var(--color-text-muted)] hover:text-[var(--color-text)]
                       transition-colors"
          >
            <PenLine size={20} strokeWidth={1.5} aria-hidden="true" />
            <span>Share</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
