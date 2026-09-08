'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

/**
 * AMONG Input — rounded-md, border-border, rose focus ring.
 *
 * Design: understated and invisible — just a text field.
 * Focus: single-pixel rose ring (`focus-visible:ring-1 ring-accent`) — no
 *        heavy colored flood, no border-color change on focus.
 * Error: `border-error` ring-error for validation states.
 */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Renders the input in an error state */
  error?: boolean;
  /** Optional accessible label ID (matches a <label htmlFor>) */
  labelId?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          // Layout & shape
          'w-full rounded-[var(--radius-md)]',
          // Typography
          'font-[var(--font-ui)] text-body text-[var(--color-text)]',
          // Spacing (44px min-height for tap target)
          'px-4 py-3 min-h-[44px]',
          // Colors
          'bg-[var(--color-bg)]',
          'placeholder:text-[var(--color-text-muted)]',
          // Border
          'border',
          error
            ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]'
            : 'border-[var(--color-border)] focus-visible:ring-[var(--color-accent)]',
          // Focus
          'outline-none',
          'focus-visible:border-[var(--color-accent)] focus-visible:ring-1',
          // Transitions
          'transition-[border-color,box-shadow] duration-[var(--duration-fast)]',
          // Disabled
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
