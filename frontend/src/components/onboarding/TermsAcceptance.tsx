/**
 * TermsAcceptance.tsx — ToS acceptance checkbox.
 *
 * Links to the guidelines and terms of service pages.
 * Required on the account creation step (not shown repeatedly).
 */
'use client';

import Link from 'next/link';
import { ROUTES } from '../../constants/routes';

interface TermsAcceptanceProps {
  readonly accepted: boolean;
  readonly onChange: (accepted: boolean) => void;
}

export default function TermsAcceptance({ accepted, onChange }: TermsAcceptanceProps) {
  return (
    <label
      className="flex items-start gap-3 cursor-pointer group"
      htmlFor="tos-acceptance"
    >
      <span className="mt-0.5 flex-shrink-0">
        <input
          id="tos-acceptance"
          type="checkbox"
          checked={accepted}
          onChange={(e) => onChange(e.target.checked)}
          className={[
            'w-4 h-4 rounded border cursor-pointer',
            'accent-accent',
            accepted ? 'border-accent' : 'border-border',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          ].join(' ')}
          aria-required="true"
          aria-checked={accepted}
        />
      </span>
      <span className="text-ui text-text-secondary group-hover:text-text transition-colors">
        I agree to the{' '}
        <Link
          href={ROUTES.GUIDELINES}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text underline underline-offset-2 hover:text-accent transition-colors"
        >
          Community Guidelines
        </Link>{' '}
        and understand how this platform handles privacy and anonymous identity.
      </span>
    </label>
  );
}
