import AppShell from '../../components/layout/AppShell';

/**
 * Auth/onboarding layout — no footer, navigation is simplified.
 * The onboarding flow takes the full viewport for focus.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell showFooter={false} showNav={false}>
      {children}
    </AppShell>
  );
}
