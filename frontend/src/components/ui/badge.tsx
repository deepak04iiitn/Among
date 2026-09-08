import * as React from 'react';
import { cn } from '../../lib/utils';

/**
 * AMONG Badge — text-only pill with border.
 * No fill colors. No colorful chips. Just a quiet label.
 *
 * Variant options:
 *  - `default`  : charcoal border + muted text. Neutral metadata.
 *  - `active`   : rose border + rose text + subtle fill. Selected state.
 *  - `semantic` : maps to error / warn / ok / info for system states.
 */

export type BadgeVariant = 'default' | 'active' | 'error' | 'warn' | 'ok' | 'info';

const variantClasses: Record<BadgeVariant, string> = {
  default:  'border-[var(--color-border)]         text-[var(--color-text-secondary)] bg-transparent',
  active:   'border-[var(--color-accent)]          text-[var(--color-accent)]         bg-[var(--color-accent-subtle)]',
  error:    'border-[var(--color-error)]            text-[var(--color-error)]           bg-transparent',
  warn:     'border-[var(--color-warn)]             text-[var(--color-warn)]            bg-transparent',
  ok:       'border-[var(--color-ok)]               text-[var(--color-ok)]              bg-transparent',
  info:     'border-[var(--color-info)]             text-[var(--color-info)]            bg-transparent',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  variant   = 'default',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center',
        'rounded-[var(--radius-pill)]',
        'border',
        'px-3 py-0.5',
        'text-caption',
        'font-[var(--font-ui)]',
        'leading-none',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
