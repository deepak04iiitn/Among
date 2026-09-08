/**
 * onboarding/intent/page.tsx — Onboarding step 1: intent selection.
 *
 * The user picks why they're here. Pure UX personalisation — this choice
 * shapes category recommendations but is never a public-facing data point.
 *
 * SEO: Not crawlable (see robots.txt). No indexable metadata needed.
 */
'use client';

import { useRouter } from 'next/navigation';
import IntentSelector from '../../../../components/onboarding/IntentSelector';
import { ROUTES } from '../../../../constants/routes';

export default function OnboardingIntentPage() {
  const router = useRouter();

  function handleIntentSelected(_intentId: string) {
    // Intent is stored in local state only — not persisted to the server.
    // It shapes category ordering on the next step.
    router.push(ROUTES.ONBOARDING_CATEGORIES);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl">
        {/* Step indicator */}
        <p className="text-caption text-text-muted mb-8 tracking-widest uppercase">
          Step 1 of 3
        </p>

        <h1 className="font-editorial text-title-xl text-text mb-3">
          What brings you here?
        </h1>
        <p className="text-body text-text-secondary mb-10">
          This helps us surface the right experiences for you. You can always change it later.
        </p>

        <IntentSelector onSelect={handleIntentSelected} />
      </div>
    </main>
  );
}
