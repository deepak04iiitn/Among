/**
 * ExpiryWarning.test.tsx — Unit tests for the ExpiryWarning component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ExpiryWarning from './ExpiryWarning';

describe('ExpiryWarning', () => {
  it('renders inactivity warning with minutes remaining', () => {
    render(<ExpiryWarning type="inactivity" minutesRemaining={5} />);
    expect(screen.getByText(/5 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/Send a message to keep it going/i)).toBeInTheDocument();
  });

  it('renders max_duration warning', () => {
    render(<ExpiryWarning type="max_duration" minutesRemaining={60} />);
    expect(screen.getByText(/60 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/remaining in this conversation/i)).toBeInTheDocument();
  });

  it('handles null minutesRemaining gracefully', () => {
    render(<ExpiryWarning type="inactivity" minutesRemaining={null} />);
    expect(screen.getByText(/a few minutes/)).toBeInTheDocument();
  });

  it('uses singular "minute" for 1 minute remaining', () => {
    render(<ExpiryWarning type="inactivity" minutesRemaining={1} />);
    // "1 minute" text is in a <span> — find it directly
    const span = screen.getByText('1 minute');
    expect(span).toBeInTheDocument();
  });

  it('has role status for accessibility', () => {
    render(<ExpiryWarning type="inactivity" minutesRemaining={5} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
