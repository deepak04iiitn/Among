import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Extended tailwind-merge — teaches twMerge about AMONG's custom
 * font-size tokens (text-display, text-headline, etc.) so they are
 * treated as a `fontSize` group and never merged away by a color class.
 *
 * Without this, `cn('text-headline text-[var(--color-text)]')` would
 * drop `text-headline` because twMerge can't tell it from a color utility.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-display',
        'text-headline',
        'text-title-xl',
        'text-title',
        'text-body-lg',
        'text-body',
        'text-ui',
        'text-caption',
      ],
    },
  },
});

/** Utility for conditionally joining and merging Tailwind class names */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
