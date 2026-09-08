'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

/**
 * AMONG Button — pill-shaped, editorial, three variants.
 *
 * Variants:
 *  - `primary`  : inverted pill — espresso fill, cream type. The primary CTA.
 *  - `secondary`: ghost pill — border only, fills on hover. Secondary actions.
 *  - `ghost`    : no border, text only. Tertiary / navigation actions.
 *  - `danger`   : muted red border + text. Destructive actions (e.g. account delete).
 *
 * All variants are pill-shaped (`rounded-pill`) — this is a signature shape.
 * No rounded-md buttons in AMONG.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize    = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-[var(--color-text)] text-[var(--color-bg)]',
    'hover:opacity-85',
    'focus-visible:outline-[var(--color-accent)]',
  ].join(' '),
  secondary: [
    'border border-[var(--color-border)] bg-transparent text-[var(--color-text)]',
    'hover:bg-[var(--color-text)] hover:text-[var(--color-bg)] hover:border-[var(--color-text)]',
    'focus-visible:outline-[var(--color-accent)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--color-text-secondary)]',
    'hover:text-[var(--color-text)]',
    'focus-visible:outline-[var(--color-accent)]',
  ].join(' '),
  danger: [
    'border border-[var(--color-error)] bg-transparent text-[var(--color-error)]',
    'hover:bg-[var(--color-error)] hover:text-[var(--color-bg)]',
    'focus-visible:outline-[var(--color-error)]',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm:  'px-4   py-1.5  text-[0.8125rem]  min-h-[36px]',
  md:  'px-6   py-2.5  text-ui           min-h-[44px]',
  lg:  'px-8   py-3.5  text-body         min-h-[52px]',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?:    ButtonSize;
  /** Show loading state — replaces content with a spinner dot pulse */
  loading?: boolean;
  /** Stretch to fill its container */
  fullWidth?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant   = 'primary',
      size      = 'md',
      loading   = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled ?? loading}
        aria-disabled={disabled ?? loading}
        className={cn(
          // Base
          'inline-flex items-center justify-center gap-2',
          'rounded-[var(--radius-pill)]',
          'font-medium font-[var(--font-ui)]',
          'transition-all duration-[var(--duration-fast)]',
          'active:scale-[0.97]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
          'select-none cursor-pointer',
          // Disabled / loading
          (disabled ?? loading) && 'opacity-50 pointer-events-none cursor-not-allowed',
          // Full width
          fullWidth && 'w-full',
          // Variant + size
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          // Three-dot pulse loader — calm, non-bouncy
          <span
            aria-hidden="true"
            className="flex items-center gap-1"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-current animate-[skeletonPulse_1.4s_ease-in-out_infinite]"
                style={{ animationDelay: `${i * 180}ms` }}
              />
            ))}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
