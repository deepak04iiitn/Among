import * as React from 'react';
import { cn } from '../../lib/utils';
import type { BadgeVariant } from './badge';

/**
 * AMONG Alert — left-border style, muted semantic colors.
 *
 * Never uses saturated "alert red" or "success green."
 * Tone is calm and informational — not alarming.
 *
 * Used for:
 *  - System info notices (info)
 *  - Form validation warnings (warn)
 *  - Non-critical errors (error)
 *  - Success confirmations (ok)
 *
 * NOT used for crisis resources — use CrisisResourceBanner for that.
 */

export type AlertVariant = Exclude<BadgeVariant, 'default' | 'active'>;

const variantClasses: Record<AlertVariant, string> = {
  info:  'border-[var(--color-info)]  text-[var(--color-info)]',
  warn:  'border-[var(--color-warn)]  text-[var(--color-warn)]',
  error: 'border-[var(--color-error)] text-[var(--color-error)]',
  ok:    'border-[var(--color-ok)]    text-[var(--color-ok)]',
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  /** Optional title rendered above the body */
  title?: string;
}

export function Alert({
  variant  = 'info',
  title,
  className,
  children,
  role = 'status',
  ...props
}: AlertProps) {
  return (
    <div
      role={role}
      className={cn(
        'border-l-2 pl-4 py-3 pr-4',
        'rounded-r-[var(--radius-md)]',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {title && (
        <p className="text-ui font-medium mb-1">{title}</p>
      )}
      <div className="text-body">{children}</div>
    </div>
  );
}
