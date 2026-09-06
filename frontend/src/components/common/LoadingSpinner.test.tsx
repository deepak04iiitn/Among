import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with role="status"', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has default aria-label "Loading…"', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading…');
  });

  it('uses custom label when provided', () => {
    render(<LoadingSpinner label="Submitting your post…" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Submitting your post…');
  });

  it('renders visually hidden screen reader text', () => {
    render(<LoadingSpinner label="Please wait" />);
    const srText = screen.getByText('Please wait');
    expect(srText).toBeInTheDocument();
    expect(srText.className).toContain('sr-only');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    expect(screen.getByRole('status').className).toContain('custom-class');
  });
});
