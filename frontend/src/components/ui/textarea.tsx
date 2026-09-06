'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

/**
 * AMONG Textarea — two variants:
 *
 * `standard`   : bordered, rounded-md — used in forms, settings, admin.
 * `borderless`  : no border, no background color — used in the compose flow.
 *               Feels like a blank notebook page. Cursor appears directly on
 *               the white surface. The writing IS the page.
 *
 * Both variants render in `font-editorial text-body-lg` so text looks
 * editorial as the user types it — not like a form textarea.
 */

export type TextareaVariant = 'standard' | 'borderless';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: TextareaVariant;
  /** Renders in an error state (standard variant only) */
  error?: boolean;
  /** Disable resize handle */
  noResize?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      variant   = 'standard',
      error     = false,
      noResize  = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          // Base
          'w-full',
          'font-[var(--font-editorial)] text-body-lg leading-[1.7]',
          'text-[var(--color-text)]',
          'placeholder:text-[var(--color-text-muted)]',
          'outline-none',
          'transition-[border-color] duration-[var(--duration-fast)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          noResize && 'resize-none',

          // Variant
          variant === 'standard' && [
            'rounded-[var(--radius-md)]',
            'border',
            'px-4 py-3 min-h-[120px]',
            'bg-[var(--color-bg)]',
            error
              ? 'border-[var(--color-error)] focus-visible:ring-1 focus-visible:ring-[var(--color-error)]'
              : 'border-[var(--color-border)] focus-visible:border-[var(--color-accent)] focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
          ],

          variant === 'borderless' && [
            'border-0 ring-0 focus:ring-0 bg-transparent',
            'px-0 py-0',
            'min-h-[180px]',
            'caret-[var(--color-accent)]',
          ],

          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
