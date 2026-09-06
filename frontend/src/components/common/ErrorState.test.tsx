import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorState from './ErrorState';

describe('ErrorState', () => {
  it('renders default message', () => {
    render(<ErrorState />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<ErrorState message="Could not load posts. Please try again." />);
    expect(screen.getByText('Could not load posts. Please try again.')).toBeInTheDocument();
  });

  it('has role="alert" for immediate screen reader announcement', () => {
    render(<ErrorState />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-live="assertive"', () => {
    render(<ErrorState />);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} />);
    const btn = screen.getByRole('button', { name: 'Try again' });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorState />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ErrorState className="my-error-class" />);
    expect(screen.getByRole('alert').className).toContain('my-error-class');
  });
});
