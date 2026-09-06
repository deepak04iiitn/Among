import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
  // ─── Rendering ─────────────────────────────────────────────────────────

  it('renders an input element', () => {
    render(<Input aria-label="Test input" />);
    expect(screen.getByRole('textbox', { name: 'Test input' })).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text" aria-label="input" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Enter text');
  });

  it('passes value to the input', () => {
    render(<Input value="Hello" onChange={jest.fn()} aria-label="input" />);
    expect(screen.getByRole('textbox')).toHaveValue('Hello');
  });

  // ─── Shape & design ────────────────────────────────────────────────────

  it('has rounded-md border radius', () => {
    render(<Input aria-label="input" />);
    expect(screen.getByRole('textbox').className).toContain('rounded-[var(--radius-md)]');
  });

  it('has border-border styling', () => {
    render(<Input aria-label="input" />);
    expect(screen.getByRole('textbox').className).toContain('border-[var(--color-border)]');
  });

  it('meets minimum tap target height (44px)', () => {
    render(<Input aria-label="input" />);
    expect(screen.getByRole('textbox').className).toContain('min-h-[44px]');
  });

  // ─── Error state ───────────────────────────────────────────────────────

  it('applies error border when error=true', () => {
    render(<Input error aria-label="input" />);
    expect(screen.getByRole('textbox').className).toContain('border-[var(--color-error)]');
  });

  it('uses standard border when error=false', () => {
    render(<Input aria-label="input" />);
    expect(screen.getByRole('textbox').className).not.toContain('border-[var(--color-error)]');
  });

  // ─── Disabled ──────────────────────────────────────────────────────────

  it('is disabled when disabled=true', () => {
    render(<Input disabled aria-label="input" />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies disabled styles', () => {
    render(<Input disabled aria-label="input" />);
    expect(screen.getByRole('textbox').className).toContain('disabled:opacity-50');
  });

  // ─── Events ────────────────────────────────────────────────────────────

  it('calls onChange on user input', () => {
    const onChange = jest.fn();
    render(<Input onChange={onChange} aria-label="input" />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('calls onFocus when focused', () => {
    const onFocus = jest.fn();
    render(<Input onFocus={onFocus} aria-label="input" />);
    fireEvent.focus(screen.getByRole('textbox'));
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  // ─── Custom className ──────────────────────────────────────────────────

  it('applies custom className', () => {
    render(<Input className="my-input" aria-label="input" />);
    expect(screen.getByRole('textbox').className).toContain('my-input');
  });
});
