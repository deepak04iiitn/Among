/**
 * Navigation component tests.
 * Tests accessibility landmarks, active route highlighting, and nav links.
 *
 * Strategy: mock react-redux completely so we control useSelector return values
 * directly — bypasses any circular dependency issues with the Redux store.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// ── Mock next/navigation ───────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/home'),
  useRouter:   jest.fn().mockReturnValue({ push: jest.fn() }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt?: string }) => {
    const Img = require('react').createElement('img', { alt: alt ?? '' });
    return Img;
  },
}));

// ── Mock next/link ─────────────────────────────────────────────────────────
// forwardRef here to match real next/link, which forwards its ref to the
// underlying <a> — Navigation uses this to measure link positions.
jest.mock('next/link', () => {
  const Link = React.forwardRef<
    HTMLAnchorElement,
    React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>
  >(({ children, href, ...props }, ref) => (
    <a href={href} ref={ref} {...props}>{children}</a>
  ));
  Link.displayName = 'Link';
  return Link;
});

// ── Mock react-redux — control return values directly ─────────────────────
jest.mock('react-redux', () => ({
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  ...jest.requireActual<typeof import('react-redux')>('react-redux'),
  // useSelector is called twice per render: (1) selectIsAuthenticated, (2) selectTotalUnread
  useSelector: jest.fn(),
  useDispatch: jest.fn().mockReturnValue(jest.fn()),
  // Provider not needed since we mock useSelector
  Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Imports ────────────────────────────────────────────────────────────────
import { usePathname }   from 'next/navigation';
import { useSelector }   from 'react-redux';
import Navigation        from './Navigation';

// Import selectors ONLY for unit-testing their logic
import { selectIsAuthenticated }  from '../../features/auth/authSlice';

const mockUsePathname = usePathname  as jest.Mock;
const mockUseSelector = useSelector  as unknown as jest.Mock;

/** Configure useSelector for an unauthenticated render */
function asGuest() {
  // Navigation calls useSelector in this order per render:
  // call 1 → selectIsAuthenticated → false
  // call 2 → selectUnreadCount     → 0
  mockUseSelector
    .mockReturnValueOnce(false)  // isAuthenticated
    .mockReturnValueOnce(0);     // unreadCount
}

/** Configure useSelector for an authenticated render */
function asUser(unreadCount = 0) {
  mockUseSelector
    .mockReturnValueOnce(true)       // isAuthenticated
    .mockReturnValueOnce(unreadCount); // unreadCount
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Navigation (unauthenticated)', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
  });

  it('renders a banner landmark', () => {
    asGuest();
    render(<Navigation />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders the brand wordmark', () => {
    asGuest();
    render(<Navigation />);
    // Text wordmark, not an image — see docs/theme.md §7 "Floating Capsule".
    expect(screen.getByText('Among', { exact: true })).toBeInTheDocument();
  });

  it('renders the "Enter Among" CTA for guests', () => {
    asGuest();
    render(<Navigation />);
    expect(screen.getByText(/enter among/i)).toBeInTheDocument();
  });

  it('does not render the authenticated nav links for guests', () => {
    asGuest();
    render(<Navigation />);
    expect(screen.queryByText('Conversations')).not.toBeInTheDocument();
  });
});

describe('Navigation (authenticated)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/home');
  });

  it('renders a banner landmark', () => {
    asUser();
    render(<Navigation />);
    expect(screen.getAllByRole('banner')[0]).toBeInTheDocument();
  });

  it('renders all primary nav links', () => {
    asUser();
    render(<Navigation />);
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Explore').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Conversations').length).toBeGreaterThan(0);
  });

  it('marks the active /home route with aria-current="page"', () => {
    asUser();
    render(<Navigation />);
    const homeLinks = screen.getAllByRole('link').filter(
      (l) => l.getAttribute('href') === '/home'
    );
    expect(homeLinks.some((l) => l.getAttribute('aria-current') === 'page')).toBe(true);
  });

  it('does not mark /explore as active when on /home', () => {
    asUser();
    render(<Navigation />);
    const exploreLinks = screen.getAllByRole('link').filter(
      (l) => l.getAttribute('href') === '/explore'
    );
    exploreLinks.forEach((l) => {
      expect(l.getAttribute('aria-current')).not.toBe('page');
    });
  });

  it('renders the notification bell button', () => {
    asUser();
    render(<Navigation />);
    expect(screen.getByRole('button', { name: /notification/i })).toBeInTheDocument();
  });

  it('renders the Share compose link', () => {
    asUser();
    render(<Navigation />);
    expect(screen.getAllByText('Share').length).toBeGreaterThan(0);
  });

  it('renders a log out control', () => {
    asUser();
    render(<Navigation />);
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });
});

describe('Navigation accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/home');
  });

  it('notification bell has an aria-label', () => {
    asUser();
    render(<Navigation />);
    const bell = screen.getByRole('button', { name: /notification/i });
    expect(bell).toHaveAttribute('aria-label');
  });

  it('notification aria-label mentions unread count when > 0', () => {
    asUser(3);
    render(<Navigation />);
    const bell = screen.getByRole('button', { name: /3 unread/i });
    expect(bell).toBeInTheDocument();
  });

  it('brand link has an aria-label containing "among"', () => {
    asUser();
    render(<Navigation />);
    const brandLinks = screen.getAllByRole('link').filter(
      (l) => l.getAttribute('aria-label')?.toLowerCase().includes('among')
    );
    expect(brandLinks.length).toBeGreaterThan(0);
  });
});

// ── Selector unit tests (pure functions, no React) ─────────────────────────
describe('Selectors (pure unit tests)', () => {
  const unauthState = {
    auth: { user: null, status: 'unauthenticated', idToken: null, error: null },
  };
  const authState = {
    auth: {
      user: { accountId: 'x', firebaseUid: 'y', role: 'user', isBanned: false, hasCompletedOnboarding: true },
      status: 'authenticated', idToken: 'tok', error: null,
    },
  };

  it('selectIsAuthenticated → false for unauthenticated', () => {
    expect(
      selectIsAuthenticated(unauthState as Parameters<typeof selectIsAuthenticated>[0])
    ).toBe(false);
  });

  it('selectIsAuthenticated → true for authenticated', () => {
    expect(
      selectIsAuthenticated(authState as Parameters<typeof selectIsAuthenticated>[0])
    ).toBe(true);
  });

  it('selectIsAuthenticated → false when user is null', () => {
    const state = {
      auth: { user: null, status: 'unauthenticated', idToken: null, error: null },
    };
    expect(
      selectIsAuthenticated(state as Parameters<typeof selectIsAuthenticated>[0])
    ).toBe(false);
  });
});
