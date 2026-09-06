import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  // ─── Rendering ───────────────────────────────────────────────────────────

  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('defaults to primary variant', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-[var(--color-text)]');
  });

  it('renders secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('border');
  });

  it('renders ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-transparent');
  });

  it('renders danger variant', () => {
    render(<Button variant="danger">Delete</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('border-[var(--color-error)]');
  });

  // ─── Sizes ───────────────────────────────────────────────────────────────

  it('applies sm size class', () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button').className).toContain('min-h-[36px]');
  });

  it('applies md size class (default)', () => {
    render(<Button>Medium</Button>);
    expect(screen.getByRole('button').className).toContain('min-h-[44px]');
  });

  it('applies lg size class', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button').className).toContain('min-h-[52px]');
  });

  // ─── Disabled ────────────────────────────────────────────────────────────

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not fire onClick when disabled', () => {
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>Disabled</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('sets aria-disabled when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  // ─── Loading ─────────────────────────────────────────────────────────────

  it('shows loading indicator when loading is true', () => {
    render(<Button loading>Submit</Button>);
    // The text "Submit" should NOT be shown while loading
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    // Button should be disabled during loading
    expect(screen.getByRole('button')).toBeDisabled();
  });

  // ─── Full width ──────────────────────────────────────────────────────────

  it('applies w-full when fullWidth is true', () => {
    render(<Button fullWidth>Full</Button>);
    expect(screen.getByRole('button').className).toContain('w-full');
  });

  // ─── Events ──────────────────────────────────────────────────────────────

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // ─── Pill shape ──────────────────────────────────────────────────────────

  it('always has pill border-radius', () => {
    render(<Button>Pill</Button>);
    expect(screen.getByRole('button').className).toContain('rounded-[var(--radius-pill)]');
  });

  // ─── Custom className ────────────────────────────────────────────────────

  it('applies custom className', () => {
    render(<Button className="my-custom">Custom</Button>);
    expect(screen.getByRole('button').className).toContain('my-custom');
  });
});
