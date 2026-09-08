import Link from 'next/link';
import { cn } from '../../lib/utils';

/**
 * The AMONG brand mark — a plain italic text wordmark, never an image.
 *
 * /Among_Logo.png is a stacked icon-over-wordmark asset sized for a much
 * taller placement; scaled to nav/footer height it's both illegible and
 * gradient-colored, which the Afterhours theme explicitly forbids.
 * See /docs/theme.md §7 "Navigation — Floating Capsule (locked pattern)".
 */
export interface BrandWordmarkProps {
  href: string;
  className?: string;
}

export default function BrandWordmark({ href, className }: BrandWordmarkProps) {
  return (
    <Link
      href={href}
      aria-label="AMONG — go to home"
      className={cn(
        'font-editorial italic leading-none text-[var(--color-text)] whitespace-nowrap',
        'hover:opacity-80 transition-opacity duration-[var(--duration-fast)]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm',
        className,
      )}
    >
      Among
    </Link>
  );
}
