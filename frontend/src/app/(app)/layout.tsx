import AppShell from '../../components/layout/AppShell';

/**
 * Authenticated app layout.
 * Wraps all protected app routes in the AppShell (Navigation + Footer).
 * Authentication enforcement is handled by middleware — not here.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
