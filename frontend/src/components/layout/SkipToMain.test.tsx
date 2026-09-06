/**
 * SkipToMain.test.tsx — Unit + accessibility tests for skip-to-main link.
 *
 * Invariants:
 *  - Skip link points to #main-content.
 *  - Skip link is visually hidden but focusable (WCAG 2.4.1).
 *  - Accessible text is present.
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import SkipToMain from './SkipToMain';

expect.extend(toHaveNoViolations);

describe('SkipToMain', () => {
  it('renders a link pointing to #main-content', () => {
    render(<SkipToMain />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('#main-content');
  });

  it('passes jest-axe accessibility check', async () => {
    const { container } = render(<SkipToMain />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
