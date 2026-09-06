/**
 * PrivacySafeCount.tsx — Displays a reaction count with the privacy threshold applied.
 *
 * PRD §6.2: counts below PRIVACY_THRESHOLD_MIN_GROUP_SIZE must display
 * "< {threshold}" — never the exact count.
 */
import * as React from 'react';
import { formatPrivacySafeCount, isBelowPrivacyThreshold } from '../../utils/formatCount';
import { PRIVACY_THRESHOLD_MIN_GROUP_SIZE } from '../../constants/limits';

export interface PrivacySafeCountProps {
  count:     number;
  threshold?: number;
  className?: string;
  /** aria-label suffix — e.g. "Same reactions" */
  label?:    string;
}

export function PrivacySafeCount({
  count,
  threshold = PRIVACY_THRESHOLD_MIN_GROUP_SIZE,
  className = '',
  label,
}: PrivacySafeCountProps) {
  const masked  = isBelowPrivacyThreshold(count, threshold);
  const display = formatPrivacySafeCount(count, threshold);

  const ariaLabel = label
    ? `${display} ${label}${masked ? ' (approximate)' : ''}`
    : display;

  return (
    <span
      className={className}
      aria-label={ariaLabel}
      title={masked ? `Exact count not shown to protect anonymity` : undefined}
    >
      {display}
    </span>
  );
}
