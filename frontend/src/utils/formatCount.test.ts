/**
 * formatCount.test.ts — Unit tests for count formatting utilities.
 */
import {
  formatCount,
  formatPrivacySafeCount,
  isBelowPrivacyThreshold,
} from './formatCount';
import { PRIVACY_THRESHOLD_MIN_GROUP_SIZE } from '../constants/limits';

describe('formatCount', () => {
  it('shows exact number for counts below 1000', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(1)).toBe('1');
    expect(formatCount(999)).toBe('999');
  });

  it('formats 1000–9999 as Xk with 1dp', () => {
    expect(formatCount(1000)).toBe('1.0k');
    expect(formatCount(1200)).toBe('1.2k');
    expect(formatCount(9999)).toBe('10.0k'); // rounds up
  });

  it('formats 10000–999999 as whole k', () => {
    expect(formatCount(10_000)).toBe('10k');
    expect(formatCount(12_800)).toBe('12k');
    expect(formatCount(999_999)).toBe('999k');
  });

  it('formats millions as Xm', () => {
    expect(formatCount(1_000_000)).toBe('1.0m');
    expect(formatCount(1_400_000)).toBe('1.4m');
  });

  it('handles negative numbers as 0', () => {
    expect(formatCount(-5)).toBe('0');
  });
});

describe('formatPrivacySafeCount', () => {
  it('returns masked string below threshold', () => {
    const result = formatPrivacySafeCount(50);
    expect(result).toBe(`< ${PRIVACY_THRESHOLD_MIN_GROUP_SIZE}`);
  });

  it('returns masked string when count is 0', () => {
    expect(formatPrivacySafeCount(0)).toBe(`< ${PRIVACY_THRESHOLD_MIN_GROUP_SIZE}`);
  });

  it('returns masked string when count is exactly threshold - 1', () => {
    expect(formatPrivacySafeCount(PRIVACY_THRESHOLD_MIN_GROUP_SIZE - 1)).toBe(
      `< ${PRIVACY_THRESHOLD_MIN_GROUP_SIZE}`
    );
  });

  it('returns formatted count when at or above threshold', () => {
    expect(formatPrivacySafeCount(PRIVACY_THRESHOLD_MIN_GROUP_SIZE)).toBe(
      formatCount(PRIVACY_THRESHOLD_MIN_GROUP_SIZE)
    );
    expect(formatPrivacySafeCount(500)).toBe('500');
    expect(formatPrivacySafeCount(1500)).toBe('1.5k');
  });

  it('uses custom threshold', () => {
    expect(formatPrivacySafeCount(5, 10)).toBe('< 10');
    expect(formatPrivacySafeCount(10, 10)).toBe('10');
  });
});

describe('isBelowPrivacyThreshold', () => {
  it('returns true when count is below threshold', () => {
    expect(isBelowPrivacyThreshold(0)).toBe(true);
    expect(isBelowPrivacyThreshold(99)).toBe(true);
    expect(isBelowPrivacyThreshold(PRIVACY_THRESHOLD_MIN_GROUP_SIZE - 1)).toBe(true);
  });

  it('returns false at or above threshold', () => {
    expect(isBelowPrivacyThreshold(PRIVACY_THRESHOLD_MIN_GROUP_SIZE)).toBe(false);
    expect(isBelowPrivacyThreshold(500)).toBe(false);
  });

  it('works with custom threshold', () => {
    expect(isBelowPrivacyThreshold(5, 10)).toBe(true);
    expect(isBelowPrivacyThreshold(10, 10)).toBe(false);
  });
});
