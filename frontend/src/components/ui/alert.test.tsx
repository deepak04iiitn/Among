import React from 'react';
import { render, screen } from '@testing-library/react';
import { Alert } from './alert';

describe('Alert', () => {
  it('renders children', () => {
    render(<Alert>Alert body</Alert>);
    expect(screen.getByText('Alert body')).toBeInTheDocument();
  });

  it('renders optional title', () => {
    render(<Alert title="Important">Body text</Alert>);
    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('has status role by default', () => {
    render(<Alert>Status</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies info variant classes', () => {
    render(<Alert variant="info">Info</Alert>);
    // Check for left border color class
    const el = screen.getByRole('status');
    expect(el.className).toContain('border-[var(--color-info)]');
  });

  it('applies error variant', () => {
    render(<Alert variant="error">Error</Alert>);
    expect(screen.getByRole('status').className).toContain('border-[var(--color-error)]');
  });

  it('applies warn variant', () => {
    render(<Alert variant="warn">Warning</Alert>);
    expect(screen.getByRole('status').className).toContain('border-[var(--color-warn)]');
  });

  it('applies ok variant', () => {
    render(<Alert variant="ok">Success</Alert>);
    expect(screen.getByRole('status').className).toContain('border-[var(--color-ok)]');
  });

  it('passes custom role', () => {
    render(<Alert role="alert">Critical</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has left border style', () => {
    render(<Alert>Left border</Alert>);
    expect(screen.getByRole('status').className).toContain('border-l-2');
  });

  it('applies custom className', () => {
    render(<Alert className="mt-4">Custom</Alert>);
    expect(screen.getByRole('status').className).toContain('mt-4');
  });
});
