import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog } from './dialog';

describe('Dialog', () => {
  const defaultProps = {
    open:     true,
    onClose:  jest.fn(),
    title:    'Test Dialog',
    children: <p>Dialog content</p>,
  };

  beforeEach(() => jest.clearAllMocks());

  // ─── Rendering ─────────────────────────────────────────────────────────

  it('renders when open is true', () => {
    render(<Dialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Dialog content')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<Dialog {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ─── Accessibility ──────────────────────────────────────────────────────

  it('has aria-modal="true"', () => {
    render(<Dialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to the title', () => {
    render(<Dialog {...defaultProps} />);
    const dialog  = screen.getByRole('dialog');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    // Title element should exist with that id
    const titleEl = document.getElementById(labelId as string);
    expect(titleEl).toBeTruthy();
    expect(titleEl?.textContent).toBe('Test Dialog');
  });

  // ─── Close behaviour ────────────────────────────────────────────────────

  it('calls onClose when close button is clicked', () => {
    render(<Dialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<Dialog {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    render(<Dialog {...defaultProps} />);
    // The overlay is the first div inside the fixed container
    const overlay = document.querySelector('[aria-hidden="true"]');
    expect(overlay).toBeTruthy();
    if (overlay) fireEvent.click(overlay);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT close on overlay click when preventOverlayClose is true', () => {
    render(<Dialog {...defaultProps} preventOverlayClose />);
    const overlay = document.querySelector('[aria-hidden="true"]');
    if (overlay) fireEvent.click(overlay);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  // ─── Design language ────────────────────────────────────────────────────

  it('has no box-shadow (border-only style)', () => {
    render(<Dialog {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    // Should have border class but not a shadow class
    expect(dialog.className).toContain('border');
    expect(dialog.className).not.toContain('shadow');
  });

  it('has rounded-xl (24px) radius', () => {
    render(<Dialog {...defaultProps} />);
    expect(screen.getByRole('dialog').className).toContain('rounded-[var(--radius-xl)]');
  });
});
