import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Why are you here?',
  robots: { index: false, follow: false },
};

/**
 * Onboarding — Step 1: Intent selection.
 * Phase 3.
 */
export default function OnboardingIntentPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-5">
      <div className="max-w-content w-full">
        <h1 className="font-editorial text-title-xl text-[var(--color-text)] text-balance">
          Why are you here?
        </h1>
        <p className="mt-4 text-body text-[var(--color-text-muted)]">
          Onboarding intent step — coming in Phase 3.
        </p>
      </div>
    </div>
  );
}
