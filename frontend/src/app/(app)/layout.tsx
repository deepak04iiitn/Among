import AppShell from '../../components/layout/AppShell';
import AuthGuard from '../../components/auth/AuthGuard';

/**
 * Authenticated app layout.
 * Wraps all protected app routes in the AppShell (Navigation + Footer).
 * Route guard: redirects unauthenticated users to landing;
 *              redirects users without onboarding to onboarding/intent.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
