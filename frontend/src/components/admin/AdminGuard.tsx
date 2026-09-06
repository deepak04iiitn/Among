/**
 * AdminGuard.tsx — Role-gated route guard for /admin/* pages.
 *
 * Redirect logic:
 *  - Unauthenticated                   → landing (/)
 *  - Authenticated, not onboarded      → /onboarding/intent
 *  - Authenticated but role is 'user'  → landing (/)
 *  - Authenticated, role 'moderator' or 'admin' → render children
 *
 * Shown during auth resolution: minimal loading state.
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';

const ADMIN_ROLES = new Set(['moderator', 'admin']);

interface AdminGuardProps {
  readonly children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { isLoading, isAuthenticated, hasCompletedOnboarding, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.LANDING);
      return;
    }

    if (!hasCompletedOnboarding) {
      router.replace(ROUTES.ONBOARDING_INTENT);
      return;
    }

    if (!user || !ADMIN_ROLES.has(user.role)) {
      router.replace(ROUTES.LANDING);
    }
  }, [isLoading, isAuthenticated, hasCompletedOnboarding, user, router]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        aria-live="polite"
        aria-label="Verifying admin access"
      >
        <span className="text-ui text-text-muted animate-pulse">Verifying access…</span>
      </div>
    );
  }

  if (!isAuthenticated || !hasCompletedOnboarding || !user || !ADMIN_ROLES.has(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav role={user.role} />
      <main className="max-w-5xl mx-auto px-6 py-12">{children}</main>
    </div>
  );
}

// ─── Admin nav bar ────────────────────────────────────────────────────────────

import Link from 'next/link';

function AdminNav({ role }: { readonly role: string }) {
  return (
    <nav
      className="border-b border-border px-6 py-4 flex items-center gap-8"
      aria-label="Admin navigation"
    >
      <span className="text-ui font-medium text-text">Admin</span>
      <Link href={ROUTES.ADMIN_REPORTS}  className="text-ui text-text-muted hover:text-text transition-colors">
        Reports
      </Link>
      <Link href={ROUTES.ADMIN_ANALYTICS} className="text-ui text-text-muted hover:text-text transition-colors">
        Analytics
      </Link>
      {role === 'admin' && (
        <>
          <Link href={ROUTES.ADMIN_CONFIG} className="text-ui text-text-muted hover:text-text transition-colors">
            Config
          </Link>
        </>
      )}
      <Link href={ROUTES.HOME} className="text-ui text-text-muted hover:text-text transition-colors ml-auto">
        ← Back to app
      </Link>
    </nav>
  );
}
