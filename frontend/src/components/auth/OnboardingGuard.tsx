/**
 * OnboardingGuard.tsx — Client-side route guard for auth/onboarding routes.
 *
 * Redirects authenticated users who have already completed onboarding
 * to the home feed. Prevents returning users from seeing onboarding again.
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';

interface OnboardingGuardProps {
  readonly children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const { isLoading, isAuthenticated, hasCompletedOnboarding } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && hasCompletedOnboarding) {
      router.replace(ROUTES.HOME);
    }
  }, [isLoading, isAuthenticated, hasCompletedOnboarding, router]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        aria-live="polite"
        aria-label="Loading"
      >
        <span className="text-ui text-text-muted animate-pulse">Loading…</span>
      </div>
    );
  }

  if (isAuthenticated && hasCompletedOnboarding) {
    return null;
  }

  return <>{children}</>;
}
