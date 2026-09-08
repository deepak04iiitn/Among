'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, PenLine, Home, Compass, MessageSquare, User, type LucideIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectIsAuthenticated } from '../../features/auth/authSlice';
import { selectUnreadCount } from '../../features/notifications/notificationsSlice';
import { signOutThunk } from '../../features/auth/authThunks';
import { ROUTES } from '../../constants/routes';

/**
 * Primary navigation — "Floating Capsule" pattern.
 * Full spec: /docs/theme.md §7 "Navigation — Floating Capsule (locked pattern)".
 *
 * Desktop: a detached, blurred-glass pill, sticky with a top margin. An ember
 * highlight physically slides between links on hover and eases back to the
 * active route on mouse-leave. The capsule tightens once the page scrolls.
 *
 * Mobile: the same capsule shape, fixed to the bottom of the viewport,
 * collapsed to icon-only buttons with a filled ember Compose action.
 */

interface NavLink {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const APP_NAV_LINKS: NavLink[] = [
  { href: ROUTES.HOME,             label: 'Home',          Icon: Home },
  { href: ROUTES.EXPLORE,          label: 'Explore',       Icon: Compass },
  { href: ROUTES.CONVERSATIONS,    label: 'Conversations', Icon: MessageSquare },
  { href: ROUTES.YOU_ARE_NOT_ALONE, label: 'You',          Icon: User },
];

const SCROLL_COMPACT_THRESHOLD_PX = 12;

interface IndicatorRect {
  left: number;
  width: number;
}

/** Text wordmark — matches the "Afterhours" pitch exactly: italic Fraunces, no image. */
function BrandWordmark({ href }: { href: string }): React.JSX.Element {
  return (
    <Link
      href={href}
      aria-label="AMONG — go to home"
      className="font-editorial italic text-[1.375rem] leading-none text-[var(--color-text)] whitespace-nowrap hover:opacity-80 transition-opacity duration-[var(--duration-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm"
    >
      Among
    </Link>
  );
}

export default function Navigation() {
  const pathname        = usePathname();
  const router          = useRouter();
  const dispatch        = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const unreadCount     = useAppSelector(selectUnreadCount);

  const isActive = (href: string): boolean => pathname === href || pathname.startsWith(href + '/');

  async function handleSignOut(): Promise<void> {
    await dispatch(signOutThunk());
    router.push(ROUTES.LANDING);
  }

  return isAuthenticated ? (
    <>
      <AppCapsuleNav pathname={pathname} isActive={isActive} unreadCount={unreadCount} onSignOut={handleSignOut} />
      <MobileCapsuleNav isActive={isActive} />
    </>
  ) : (
    <PublicCapsuleNav />
  );
}

/* ────────────────────────── Desktop — authenticated ────────────────────────── */

function AppCapsuleNav({
  pathname,
  isActive,
  unreadCount,
  onSignOut,
}: {
  pathname: string;
  isActive: (href: string) => boolean;
  unreadCount: number;
  onSignOut: () => void;
}): React.JSX.Element {
  const containerRef              = useRef<HTMLDivElement>(null);
  const linkRefs                  = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [indicator, setIndicator] = useState<IndicatorRect>({ left: 0, width: 0 });
  const [isScrolled, setIsScrolled] = useState(false);

  const defaultHref = APP_NAV_LINKS[0]?.href ?? ROUTES.HOME;
  const activeHref  = APP_NAV_LINKS.find((link) => isActive(link.href))?.href ?? defaultHref;
  const targetHref  = hoveredHref ?? activeHref;

  const measure = (href: string): void => {
    const el = linkRefs.current[href];
    const container = containerRef.current;
    if (!el || !container) return;
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setIndicator({ left: elRect.left - containerRect.left, width: elRect.width });
  };

  useLayoutEffect(() => {
    measure(targetHref);
  }, [targetHref, pathname]);

  useEffect(() => {
    const onResize = (): void => measure(targetHref);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [targetHref]);

  useEffect(() => {
    const onScroll = (): void => setIsScrolled(window.scrollY > SCROLL_COMPACT_THRESHOLD_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      role="banner"
      className="sticky top-4 z-40 hidden md:flex justify-center px-5 transition-[top] duration-300"
    >
      <div
        className={[
          'flex items-center gap-5 rounded-pill border border-[var(--color-border-strong)]',
          'backdrop-blur-[14px] backdrop-saturate-150',
          'shadow-[0_6px_20px_-6px_rgba(0,0,0,0.5)]',
          'transition-[padding,background-color] duration-300 w-full max-w-[1600px]',
          isScrolled
            ? 'pl-5 pr-3 py-1.5 bg-[var(--color-surface-glass-strong)]'
            : 'pl-6 pr-3 py-2.5 bg-[var(--color-surface-glass)]',
        ].join(' ')}
      >
        <BrandWordmark href={ROUTES.HOME} />

        <nav
          aria-label="Primary navigation"
          ref={containerRef}
          onMouseLeave={() => setHoveredHref(null)}
          className="relative flex items-center gap-0.5 flex-1"
        >
          <span
            aria-hidden="true"
            className="absolute top-0 bottom-0 rounded-pill border border-[var(--color-accent)] bg-[var(--color-accent-subtle)] transition-[left,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
            style={{ left: indicator.left, width: indicator.width }}
          />
          {APP_NAV_LINKS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                ref={(el) => {
                  linkRefs.current[href] = el;
                }}
                aria-current={active ? 'page' : undefined}
                onMouseEnter={() => setHoveredHref(href)}
                className={[
                  'relative z-10 px-3.5 py-2 rounded-pill text-ui transition-colors whitespace-nowrap',
                  active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
                ].join(' ')}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={unreadCount > 0 ? `Notifications — ${unreadCount} unread` : 'Notifications'}
            className="relative p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/[0.04] transition-colors rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          >
            <Bell size={18} strokeWidth={1.5} aria-hidden="true" />
            {unreadCount > 0 && (
              <span aria-hidden="true" className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
            )}
          </button>

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
            onClick={onSignOut}
            className="text-ui text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors min-h-[44px] px-2"
            aria-label="Log out of AMONG"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

/* ────────────────────────── Mobile — authenticated ────────────────────────── */

function MobileCapsuleNav({ isActive }: { isActive: (href: string) => boolean }): React.JSX.Element {
  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-4 inset-x-0 z-40 flex justify-center px-5"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className={[
          'flex items-center gap-1 p-1.5 rounded-pill border border-[var(--color-border-strong)]',
          'bg-[var(--color-surface-glass-strong)] backdrop-blur-[14px] backdrop-saturate-150',
          'shadow-[0_6px_20px_-6px_rgba(0,0,0,0.5)]',
        ].join(' ')}
      >
        {APP_NAV_LINKS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              className={[
                'flex items-center justify-center w-11 h-11 rounded-full transition-colors',
                active ? 'text-[var(--color-accent)] bg-[var(--color-accent-subtle)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              ].join(' ')}
            >
              <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          );
        })}

        <Link
          href={ROUTES.COMPOSE}
          aria-label="Share a new experience"
          className="flex items-center justify-center w-11 h-11 rounded-full bg-[var(--color-accent)] text-[#20140A] transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          <PenLine size={18} strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
    </nav>
  );
}

/* ────────────────────────── Logged-out ────────────────────────── */

function PublicCapsuleNav(): React.JSX.Element {
  return (
    <header role="banner" className="sticky top-4 z-40 px-5 md:px-8">
      <div
        className={[
          'flex items-center justify-between gap-6 pl-8 pr-4 py-3.5 rounded-pill border border-[var(--color-border-strong)]',
          'bg-[var(--color-surface-glass)] backdrop-blur-[14px] backdrop-saturate-150',
          'shadow-[0_6px_20px_-6px_rgba(0,0,0,0.5)] w-full max-w-[1600px] mx-auto',
        ].join(' ')}
      >
        <BrandWordmark href={ROUTES.LANDING} />

        <div className="flex items-center gap-6">
          <Link
            href={ROUTES.EXPLORE}
            className="text-body text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors hidden sm:block"
          >
            Explore
          </Link>
          <Link href={ROUTES.ONBOARDING_INTENT} className="btn-primary text-body py-3 px-7">
            Enter Among →
          </Link>
        </div>
      </div>
    </header>
  );
}
