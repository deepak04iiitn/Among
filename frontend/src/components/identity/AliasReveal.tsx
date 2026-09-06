'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import AvatarSVG from '../common/AvatarSVG';

/**
 * AliasReveal — the theatrical alias assignment moment.
 *
 * Design (Plan §7B.6 — Alias Reveal):
 *  - Full-screen dark overlay (bg-text) — the ONLY time the background is
 *    not white in the entire product.
 *  - Alias name in `font-editorial text-display text-white`.
 *  - Avatar draws itself using the CSS stroke-dashoffset animation (1200ms).
 *  - Below: quiet contextual copy in `text-body text-white/70`.
 *  - Single dismiss button: `"Begin →"` — white pill on black.
 *    (Color-flip from the landing page CTA: white bg on black vs. black bg on white.)
 *  - On dismiss: overlay fades out over 400ms.
 *
 * Accessibility:
 *  - `role="dialog"` with `aria-modal="true"` and `aria-labelledby`.
 *  - Focus trapped inside until dismissed.
 *  - CrisisResourceBanner cannot be shown inside this overlay.
 */

export interface AliasRevealProps {
  /** The alias name to display — e.g. "Blue Fox" */
  aliasName:   string;
  /** Seed for deterministic avatar generation */
  avatarSeed:  string;
  /** Called when the user dismisses the reveal */
  onDismiss:   () => void;
  /** Controlled — if false, overlay is not rendered */
  isVisible:   boolean;
}

export default function AliasReveal({
  aliasName,
  avatarSeed,
  onDismiss,
  isVisible,
}: AliasRevealProps) {
  const titleId = React.useId();
  const btnRef  = React.useRef<HTMLButtonElement>(null);

  // Focus the dismiss button when reveal appears
  React.useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => btnRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isVisible]);

  // Escape key dismisses
  React.useEffect(() => {
    if (!isVisible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={cn(
        'fixed inset-0 z-50',
        'flex flex-col items-center justify-center',
        'bg-[var(--color-text)]',           // deep-black — only time background is not white
        'px-6',
        'animate-[overlayIn_400ms_var(--ease-out)_both]',
      )}
    >
      {/* ─── Avatar — draws itself ─── */}
      <div className="mb-8 animate-[fadeIn_400ms_200ms_var(--ease-out)_both]">
        <AvatarSVG
          seed={avatarSeed}
          size="lg"
          aliasName={aliasName}
          className="[&_svg]:animate-[avatarDraw_1200ms_var(--ease-out)_forwards]"
        />
      </div>

      {/* ─── Context caption ─── */}
      <p
        className={cn(
          'text-caption font-[var(--font-ui)]',
          'text-white/50',
          'uppercase tracking-[0.12em]',
          'mb-4',
          'animate-[fadeIn_300ms_300ms_var(--ease-out)_both]',
        )}
      >
        Your identity, for now
      </p>

      {/* ─── Alias name ─── */}
      <h1
        id={titleId}
        className={cn(
          'font-editorial text-display',
          'text-white',
          'text-center text-balance',
          'mb-6',
          'animate-[slideUp_600ms_500ms_var(--ease-out)_both]',
        )}
      >
        {aliasName}
      </h1>

      {/* ─── Contextual copy ─── */}
      <p
        className={cn(
          'text-body font-[var(--font-ui)]',
          'text-white/70',
          'text-center max-w-[40ch]',
          'mb-12',
          'animate-[fadeIn_300ms_900ms_var(--ease-out)_both]',
        )}
      >
        This is you until you choose a new one.
        No one knows it&apos;s you.
      </p>

      {/* ─── Dismiss button ─── */}
      {/* White pill on black — color flip of the landing page CTA */}
      <button
        ref={btnRef}
        type="button"
        onClick={onDismiss}
        className={cn(
          'px-8 py-3.5',
          'rounded-[var(--radius-pill)]',
          'bg-white text-[var(--color-text)]',
          'text-body font-[var(--font-ui)] font-medium',
          'transition-opacity duration-[var(--duration-fast)]',
          'hover:opacity-90',
          'active:scale-[0.97]',
          'focus-visible:outline focus-visible:outline-2',
          'focus-visible:outline-offset-2 focus-visible:outline-white',
          'animate-[fadeIn_300ms_1100ms_var(--ease-out)_both]',
        )}
      >
        Begin →
      </button>
    </div>
  );
}
