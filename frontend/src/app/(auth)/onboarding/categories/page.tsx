/**
 * onboarding/categories/page.tsx — Onboarding step 2: category selection.
 *
 * The user selects 3–5 experience categories they want to see and contribute to.
 * These are stored server-side after onboarding is complete (step 3).
 * Saved to localStorage temporarily so step 3 can submit all data at once.
 */
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CategoryTile from '../../../components/identity/CategoryTile';
import { EXPERIENCE_CATEGORIES } from '../../../constants/experienceCategories';
import { ONBOARDING_CATEGORY_MIN, ONBOARDING_CATEGORY_MAX } from '../../../constants/limits';
import { ROUTES } from '../../../constants/routes';

const STORAGE_KEY = 'among_onboarding_categories';

export default function OnboardingCategoriesPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleCategory = useCallback((id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((c) => c !== id);
      }
      if (prev.length >= ONBOARDING_CATEGORY_MAX) {
        // At limit — ignore additional selections
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  function handleContinue() {
    if (selected.length < ONBOARDING_CATEGORY_MIN) return;
    // Persist selection for step 3 to submit
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    }
    router.push(ROUTES.ONBOARDING_ACCOUNT);
  }

  const tooFew  = selected.length < ONBOARDING_CATEGORY_MIN;
  const atLimit = selected.length >= ONBOARDING_CATEGORY_MAX;

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-6 py-16">
      <div className="w-full max-w-2xl">
        {/* Step indicator */}
        <p className="text-caption text-text-muted mb-8 tracking-widest uppercase">
          Step 2 of 3
        </p>

        <h1 className="font-editorial text-title-xl text-text mb-2">
          What do you carry?
        </h1>
        <p className="text-body text-text-secondary mb-2">
          Choose {ONBOARDING_CATEGORY_MIN}–{ONBOARDING_CATEGORY_MAX} experiences that feel true to your life right now.
        </p>
        <p className="text-caption text-text-muted mb-8">
          {selected.length} of {ONBOARDING_CATEGORY_MAX} selected
          {atLimit && (
            <span className="ml-2 text-accent"> — limit reached</span>
          )}
        </p>

        {/* Category grid */}
        <div
          role="group"
          aria-label="Select experience categories"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10"
        >
          {EXPERIENCE_CATEGORIES.map((category) => {
            const isSelected = selected.includes(category.id);
            const isDisabled = !isSelected && atLimit;
            return (
              <CategoryTile
                key={category.id}
                id={category.id}
                label={category.displayName}
                description={category.description}
                isSelected={isSelected}
                isDisabled={isDisabled}
                onToggle={toggleCategory}
              />
            );
          })}
        </div>

        {/* Validation feedback */}
        {tooFew && selected.length > 0 && (
          <p
            className="text-caption text-text-muted mb-4 italic"
            aria-live="polite"
          >
            Select {ONBOARDING_CATEGORY_MIN - selected.length} more to continue.
          </p>
        )}

        {/* Continue button */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={tooFew}
          className={[
            'btn-primary w-full sm:w-auto sm:min-w-48',
            tooFew ? 'opacity-40 cursor-not-allowed' : '',
          ].join(' ')}
          aria-disabled={tooFew}
        >
          Continue →
        </button>
      </div>
    </main>
  );
}
