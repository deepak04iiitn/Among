/**
 * CrisisResourceBanner.test.tsx — Unit + accessibility tests.
 *
 * Critical invariants:
 *  - `aria-live="assertive"` is always present (CLAUDE.md §6.4).
 *  - Dismiss button is disabled for the first 3 seconds.
 *  - Resources are rendered with accessible names.
 *  - No WCAG violations (jest-axe).
 */
import { render, screen, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import CrisisResourceBanner from './CrisisResourceBanner';

expect.extend(toHaveNoViolations);


const SAMPLE_RESOURCES = [
  {
    name:        'Crisis Text Line',
    description: 'Free, 24/7 support via text',
    phone:       '741741',
    available:   '24/7',
  },
];

describe('CrisisResourceBanner', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('has aria-live="assertive"', () => {
    const { container } = render(
      <CrisisResourceBanner resources={SAMPLE_RESOURCES} />
    );
    const banner = container.querySelector('[aria-live="assertive"]');
    expect(banner).not.toBeNull();
  });

  it('renders crisis resources', () => {
    render(<CrisisResourceBanner resources={SAMPLE_RESOURCES} />);
    expect(screen.getByText('Crisis Text Line')).toBeDefined();
  });

  it('dismiss button is disabled for first 3 seconds', () => {
    const onDismiss = jest.fn();
    render(<CrisisResourceBanner resources={SAMPLE_RESOURCES} onDismiss={onDismiss} />);
    const btn = screen.getByRole('button', { name: /please take a moment/i });
    expect(btn).toBeDefined();
    // aria-disabled should be true
    expect(btn.getAttribute('aria-disabled')).toBe('true');
  });

  it('dismiss button becomes enabled after 3 seconds', () => {
    const onDismiss = jest.fn();
    render(<CrisisResourceBanner resources={SAMPLE_RESOURCES} onDismiss={onDismiss} />);
    act(() => { jest.advanceTimersByTime(3100); });
    const btn = screen.getByRole('button', { name: /dismiss/i });
    // When canDismiss=true the aria-disabled attr is "false" (not absent)
    expect(btn.getAttribute('aria-disabled')).not.toBe('true');
  });

  it('passes jest-axe accessibility check', async () => {
    // Use real timers for axe's async internal operations
    jest.useRealTimers();
    const { container } = render(
      <CrisisResourceBanner resources={SAMPLE_RESOURCES} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 20000);
});
