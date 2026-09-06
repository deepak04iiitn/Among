import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create your account',
  robots: { index: false, follow: false },
};

/**
 * Onboarding — Step 3: Account creation + alias reveal.
 * Phase 3.
 */
export default function OnboardingAccountPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-5">
      <div className="max-w-content w-full">
        <h1 className="font-editorial text-title-xl text-[var(--color-text)] text-balance">
          Almost there.
        </h1>
        <p className="mt-4 text-body text-[var(--color-text-muted)]">
          Account creation — coming in Phase 3.
        </p>
      </div>
    </div>
  );
}
