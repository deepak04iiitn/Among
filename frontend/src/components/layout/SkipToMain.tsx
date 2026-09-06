/**
 * SkipToMain.tsx — Skip-to-content link for keyboard users.
 *
 * Visually hidden until focused. First focusable element on every page.
 * Links to #main-content. Satisfies WCAG 2.1 SC 2.4.1.
 *
 * Must be placed as the very first child of <body>.
 */
export default function SkipToMain() {
  return (
    <a
      href="#main-content"
      className={[
        'sr-only focus:not-sr-only',
        'focus:fixed focus:top-4 focus:left-4 focus:z-[9999]',
        'focus:bg-[var(--color-bg)] focus:border focus:border-[var(--color-border)]',
        'focus:px-4 focus:py-2 focus:rounded-[var(--radius-md)]',
        'focus:text-ui focus:text-[var(--color-text)]',
        'focus:outline focus:outline-2 focus:outline-[var(--color-accent)]',
        'transition-all',
      ].join(' ')}
    >
      Skip to main content
    </a>
  );
}
