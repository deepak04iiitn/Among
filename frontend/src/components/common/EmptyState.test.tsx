import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders the message text', () => {
    render(<EmptyState message="Nothing new today." />);
    expect(screen.getByText('Nothing new today.')).toBeInTheDocument();
  });

  it('has role="status" for screen reader announcements', () => {
    render(<EmptyState message="Nothing new today." />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite"', () => {
    render(<EmptyState message="Nothing new today." />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('renders subMessage when provided', () => {
    render(<EmptyState message="Nothing here." subMessage="Check back later." />);
    expect(screen.getByText('Check back later.')).toBeInTheDocument();
  });

  it('does not render subMessage when not provided', () => {
    render(<EmptyState message="Nothing here." />);
    expect(screen.queryByText('Check back later.')).not.toBeInTheDocument();
  });

  it('renders a link CTA when href is provided', () => {
    render(<EmptyState message="Nothing." cta={{ label: 'Explore', href: '/explore' }} />);
    const link = screen.getByRole('link', { name: 'Explore' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/explore');
  });

  it('renders a button CTA when onClick is provided', () => {
    const onClick = jest.fn();
    render(<EmptyState message="Nothing." cta={{ label: 'Retry', onClick }} />);
    const btn = screen.getByRole('button', { name: 'Retry' });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders no CTA when cta prop is not provided', () => {
    render(<EmptyState message="Nothing." />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<EmptyState message="Nothing." className="my-custom-class" />);
    expect(screen.getByRole('status').className).toContain('my-custom-class');
  });
});
