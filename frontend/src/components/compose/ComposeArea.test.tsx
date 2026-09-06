import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ComposeArea from './ComposeArea';

describe('ComposeArea', () => {
  const setup = (overrides = {}) => {
    const onChange = jest.fn();
    const utils = render(
      <ComposeArea value="" onChange={onChange} {...overrides} />
    );
    const textarea = screen.getByRole('textbox', { name: /Compose your experience/i });
    return { ...utils, textarea, onChange };
  };

  // ─── Rendering ─────────────────────────────────────────────────────────

  it('renders the textarea', () => {
    const { textarea } = setup();
    expect(textarea).toBeInTheDocument();
  });

  it('has the correct accessible label', () => {
    setup();
    expect(screen.getByLabelText('Compose your experience')).toBeInTheDocument();
  });

  it('renders default placeholder', () => {
    const { textarea } = setup();
    expect(textarea).toHaveAttribute('placeholder', "Say what's on your mind…");
  });

  it('renders custom placeholder', () => {
    const { textarea } = setup({ placeholder: 'Custom placeholder' });
    expect(textarea).toHaveAttribute('placeholder', 'Custom placeholder');
  });

  // ─── Safety note ─────────────────────────────────────────────────────

  it('does NOT show safety note before focus', () => {
    setup();
    expect(screen.queryByText(/no names, locations/i)).not.toBeInTheDocument();
  });

  it('shows safety note on first focus', () => {
    const { textarea } = setup();
    fireEvent.focus(textarea);
    expect(screen.getByText(/no names, locations/i)).toBeInTheDocument();
  });

  it('safety note has role="note"', () => {
    const { textarea } = setup();
    fireEvent.focus(textarea);
    expect(screen.getByRole('note')).toBeInTheDocument();
  });

  it('hides safety note when user types (onChange fires with non-empty value)', () => {
    const onChange = jest.fn();
    render(<ComposeArea value="" onChange={onChange} />);
    const textarea = screen.getByRole('textbox');

    // First focus — safety note appears
    fireEvent.focus(textarea);
    expect(screen.getByRole('note')).toBeInTheDocument();

    // Simulate typing — triggers onChange and hides the note
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    // After typing, the note should be hidden (component hides it on first keystroke)
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  // ─── Character count ─────────────────────────────────────────────────

  it('does NOT show char count when well below limit', () => {
    setup({ value: 'Short text' });
    // Below COMPOSE_COUNTER_VISIBLE_THRESHOLD — count should not be visible
    expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();
  });

  it('shows char count when within threshold of limit', () => {
    // POST_MAX_CHARS is 3000, THRESHOLD is 200 — so we need > 2800 chars
    const nearLimitText = 'a'.repeat(2850);
    render(<ComposeArea value={nearLimitText} onChange={jest.fn()} />);
    expect(screen.getByText(/remaining/i)).toBeInTheDocument();
  });

  it('shows "over limit" when text exceeds max', () => {
    const overLimitText = 'a'.repeat(3010);
    render(<ComposeArea value={overLimitText} onChange={jest.fn()} />);
    expect(screen.getByText(/over limit/i)).toBeInTheDocument();
  });

  it('char count has aria-live polite', () => {
    const nearLimitText = 'a'.repeat(2850);
    render(<ComposeArea value={nearLimitText} onChange={jest.fn()} />);
    const counter = screen.getByText(/remaining/i).closest('[aria-live]');
    expect(counter).toHaveAttribute('aria-live', 'polite');
  });

  // ─── Events ──────────────────────────────────────────────────────────

  it('calls onChange on input', () => {
    const { textarea, onChange } = setup();
    fireEvent.change(textarea, { target: { value: 'new text' } });
    expect(onChange).toHaveBeenCalledWith('new text');
  });

  // ─── Disabled ────────────────────────────────────────────────────────

  it('is disabled when disabled prop is true', () => {
    const { textarea } = setup({ disabled: true });
    expect(textarea).toBeDisabled();
  });
});
