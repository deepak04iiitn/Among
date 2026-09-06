import AppShell from '../../components/layout/AppShell';
import OnboardingGuard from '../../components/auth/OnboardingGuard';

/**
 * Auth/onboarding layout — no footer, no navigation (full-viewport focus).
 * Route guard: redirects already-onboarded users to /home.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGuard>
      <AppShell showFooter={false} showNav={false}>
        {children}
      </AppShell>
    </OnboardingGuard>
  );
}
