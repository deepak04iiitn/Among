import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Label</Badge>);
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  it('defaults to default variant', () => {
    render(<Badge>Default</Badge>);
    const el = screen.getByText('Default');
    expect(el.className).toContain('border-[var(--color-border)]');
  });

  it('applies active variant', () => {
    render(<Badge variant="active">Active</Badge>);
    const el = screen.getByText('Active');
    expect(el.className).toContain('border-[var(--color-accent)]');
    expect(el.className).toContain('bg-[var(--color-accent-subtle)]');
  });

  it('applies error variant', () => {
    render(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error').className).toContain('border-[var(--color-error)]');
  });

  it('is pill-shaped', () => {
    render(<Badge>Pill</Badge>);
    expect(screen.getByText('Pill').className).toContain('rounded-[var(--radius-pill)]');
  });

  it('uses caption text size', () => {
    render(<Badge>Small</Badge>);
    expect(screen.getByText('Small').className).toContain('text-caption');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>);
    expect(screen.getByText('Custom').className).toContain('custom-badge');
  });
});
