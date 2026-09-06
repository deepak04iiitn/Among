/**
 * AuthGuard.tsx — Client-side route guard for authenticated routes.
 *
 * Redirects:
 *  - Unauthenticated users → landing page (/)
 *  - Authenticated users without onboarding → /onboarding/intent
 *
 * Shows a minimal loading state while auth is being determined
 * (avoids layout flash before redirect).
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';

interface AuthGuardProps {
  readonly children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isLoading, isAuthenticated, hasCompletedOnboarding } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.LANDING);
      return;
    }

    if (!hasCompletedOnboarding) {
      router.replace(ROUTES.ONBOARDING_INTENT);
    }
  }, [isLoading, isAuthenticated, hasCompletedOnboarding, router]);

  // Show a minimal loading state while auth resolves
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        aria-live="polite"
        aria-label="Loading your account"
      >
        <span className="text-ui text-text-muted animate-pulse">Loading…</span>
      </div>
    );
  }

  // Render nothing during redirect
  if (!isAuthenticated || !hasCompletedOnboarding) {
    return null;
  }

  return <>{children}</>;
}
