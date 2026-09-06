/**
 * AdminGuard.test.tsx — Unit tests for the admin route guard.
 *
 * Critical invariants:
 *  - Unauthenticated users are redirected to landing.
 *  - Role 'user' is redirected to landing.
 *  - Role 'moderator' and 'admin' can access the dashboard.
 *  - Loading state is shown while auth resolves.
 */
import { render, screen } from '@testing-library/react';
import AdminGuard from './AdminGuard';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '../../hooks/useAuth';

const mockUseAuth = useAuth as jest.Mock;

// ─── Shared helpers ───────────────────────────────────────────────────────────

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>>) {
  mockUseAuth.mockReturnValue({
    isLoading:              false,
    isAuthenticated:        false,
    hasCompletedOnboarding: false,
    user:                   null,
    ...overrides,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

it('shows loading state while auth resolves', () => {
  mockAuth({ isLoading: true });
  render(<AdminGuard><p>Children</p></AdminGuard>);
  expect(screen.getByText(/verifying access/i)).toBeDefined();
  expect(screen.queryByText('Children')).toBeNull();
});

it('redirects unauthenticated users to landing', () => {
  mockAuth({ isLoading: false, isAuthenticated: false });
  render(<AdminGuard><p>Children</p></AdminGuard>);
  expect(mockReplace).toHaveBeenCalledWith('/');
  expect(screen.queryByText('Children')).toBeNull();
});

it('redirects role=user to landing', () => {
  mockAuth({
    isLoading:              false,
    isAuthenticated:        true,
    hasCompletedOnboarding: true,
    user:                   { accountId: 'u1', role: 'user', hasCompletedOnboarding: true, isBanned: false, firebaseUid: '' },
  });
  render(<AdminGuard><p>Children</p></AdminGuard>);
  expect(mockReplace).toHaveBeenCalledWith('/');
  expect(screen.queryByText('Children')).toBeNull();
});

it('renders children for role=moderator', () => {
  mockAuth({
    isLoading:              false,
    isAuthenticated:        true,
    hasCompletedOnboarding: true,
    user:                   { accountId: 'u2', role: 'moderator', hasCompletedOnboarding: true, isBanned: false, firebaseUid: '' },
  });
  render(<AdminGuard><p>Admin content</p></AdminGuard>);
  expect(screen.getByText('Admin content')).toBeDefined();
});

it('renders children for role=admin', () => {
  mockAuth({
    isLoading:              false,
    isAuthenticated:        true,
    hasCompletedOnboarding: true,
    user:                   { accountId: 'u3', role: 'admin', hasCompletedOnboarding: true, isBanned: false, firebaseUid: '' },
  });
  render(<AdminGuard><p>Admin content</p></AdminGuard>);
  expect(screen.getByText('Admin content')).toBeDefined();
});

it('shows config link only for admin role', () => {
  mockAuth({
    isLoading:              false,
    isAuthenticated:        true,
    hasCompletedOnboarding: true,
    user:                   { accountId: 'u4', role: 'admin', hasCompletedOnboarding: true, isBanned: false, firebaseUid: '' },
  });
  render(<AdminGuard><p>content</p></AdminGuard>);
  expect(screen.getByText('Config')).toBeDefined();
});

it('does not show config link for moderator role', () => {
  mockAuth({
    isLoading:              false,
    isAuthenticated:        true,
    hasCompletedOnboarding: true,
    user:                   { accountId: 'u5', role: 'moderator', hasCompletedOnboarding: true, isBanned: false, firebaseUid: '' },
  });
  render(<AdminGuard><p>content</p></AdminGuard>);
  expect(screen.queryByText('Config')).toBeNull();
});
