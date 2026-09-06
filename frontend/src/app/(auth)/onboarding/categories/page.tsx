import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Choose your experiences',
  robots: { index: false, follow: false },
};

/**
 * Onboarding — Step 2: Experience category selection.
 * Phase 3.
 */
export default function OnboardingCategoriesPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-5">
      <div className="max-w-shell w-full">
        <h1 className="font-editorial text-title-xl text-[var(--color-text)] text-balance">
          Which experiences speak to you?
        </h1>
        <p className="mt-4 text-body text-[var(--color-text-muted)]">
          Onboarding categories step — coming in Phase 3.
        </p>
      </div>
    </div>
  );
}
