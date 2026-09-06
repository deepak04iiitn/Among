/**
 * IntentSelector.tsx — Onboarding step 1.
 * The user selects their primary reason for joining AMONG.
 * This is purely for personalisation — it is never stored as a public profile field.
 *
 * Design: Four full-width typographic cards, editorial serif for the label,
 * subtle description below. Selected state shows an indigo left border.
 */
'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

// ─── Intent definitions ───────────────────────────────────────────────────────

interface Intent {
  readonly id:          string;
  readonly label:       string;
  readonly description: string;
}

const INTENTS: readonly Intent[] = [
  {
    id:          'share',
    label:       'Share something',
    description: "There\u2019s something I need to say \u2014 an experience I\u2019ve been carrying.",
  },
  {
    id:          'find',
    label:       'Find others',
    description: "I want to know I\u2019m not alone in what I\u2019m going through.",
  },
  {
    id:          'help',
    label:       'Help someone',
    description: "I\u2019ve been through something and I want to offer what I\u2019ve learned.",
  },
  {
    id:          'explore',
    label:       'Just explore',
    description: "I\u2019m curious about what people are carrying. I don\u2019t know yet.",
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface IntentSelectorProps {
  readonly onSelect: (intentId: string) => void;
}

export default function IntentSelector({ onSelect }: IntentSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(id: string) {
    setSelected(id);
    // Small delay so the selection is visible before navigation
    setTimeout(() => onSelect(id), 150);
  }

  return (
    <div className="w-full max-w-xl mx-auto" role="group" aria-label="Choose your reason for joining">
      <ul className="space-y-3" role="list">
        {INTENTS.map((intent) => {
          const isSelected = selected === intent.id;
          return (
            <li key={intent.id}>
              <button
                type="button"
                onClick={() => handleSelect(intent.id)}
                aria-pressed={isSelected}
                className={[
                  'w-full text-left px-6 py-5 border transition-all duration-150',
                  'rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  isSelected
                    ? 'border-l-4 border-l-accent border-t-border border-r-border border-b-border bg-accent/5'
                    : 'border-border hover:border-border-strong hover:bg-surface-alt',
                ].join(' ')}
              >
                <span className="block font-editorial text-title text-text">
                  {intent.label}
                </span>
                <span className="block mt-1 text-ui text-text-muted">
                  {intent.description}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selected && (
        <p className="mt-6 flex items-center gap-2 text-caption text-text-muted animate-in fade-in">
          <ArrowRight size={12} strokeWidth={1.5} aria-hidden />
          Continue to select your interests
        </p>
      )}
    </div>
  );
}
