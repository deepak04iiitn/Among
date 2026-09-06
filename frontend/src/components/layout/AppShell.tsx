import Navigation from './Navigation';
import Footer from './Footer';

interface AppShellProps {
  children: React.ReactNode;
  /** Whether to show the site-wide footer. Default: true.
   *  Pass false for full-screen pages (alias reveal, conversations). */
  showFooter?: boolean;
  /** Whether to show the primary navigation. Default: true.
   *  Pass false for onboarding and auth flows. */
  showNav?: boolean;
  /** Additional class names for the <main> element */
  mainClassName?: string;
}

/**
 * AppShell — outer wrapper that provides navigation and footer to all app pages.
 *
 * Usage:
 * - All authenticated pages wrap their content in <AppShell>.
 * - Full-screen/modal-style pages (alias reveal) set showNav=false, showFooter=false.
 * - Public marketing pages also use AppShell with showFooter=true.
 *
 * Bottom padding `pb-20 md:pb-0` accounts for the mobile bottom nav bar height.
 */
export default function AppShell({
  children,
  showFooter = true,
  showNav    = true,
  mainClassName = '',
}: AppShellProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg)]">
      {showNav && <Navigation />}

      <main
        id="main-content"
        tabIndex={-1}
        className={[
          'flex-1',
          'pb-20 md:pb-0',  // Space for mobile bottom nav
          mainClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
}
