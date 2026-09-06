import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StateSelector from './StateSelector';

describe('StateSelector', () => {
  const defaultProps = {
    value:    'current' as const,
    onChange: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  // ─── Rendering ─────────────────────────────────────────────────────────

  it('renders all three state options', () => {
    render(<StateSelector {...defaultProps} />);
    expect(screen.getByRole('radio', { name: 'Current' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Past' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Exploratory' })).toBeInTheDocument();
  });

  it('renders a radiogroup', () => {
    render(<StateSelector {...defaultProps} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('marks the active option as checked', () => {
    render(<StateSelector {...defaultProps} value="past" />);
    expect(screen.getByRole('radio', { name: 'Past' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Current' })).toHaveAttribute('aria-checked', 'false');
  });

  it('shows description of current selection', () => {
    render(<StateSelector {...defaultProps} value="exploratory" />);
    expect(screen.getByText('Thinking it through')).toBeInTheDocument();
  });

  // ─── Interaction ───────────────────────────────────────────────────────

  it('calls onChange when an option is clicked', () => {
    const onChange = jest.fn();
    render(<StateSelector value="current" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Past' }));
    expect(onChange).toHaveBeenCalledWith('past');
  });

  it('calls onChange with next option on ArrowRight', () => {
    const onChange = jest.fn();
    render(<StateSelector value="current" onChange={onChange} />);
    const currentBtn = screen.getByRole('radio', { name: 'Current' });
    fireEvent.keyDown(currentBtn, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('past');
  });

  it('calls onChange with previous option on ArrowLeft', () => {
    const onChange = jest.fn();
    render(<StateSelector value="past" onChange={onChange} />);
    const pastBtn = screen.getByRole('radio', { name: 'Past' });
    fireEvent.keyDown(pastBtn, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith('current');
  });

  it('wraps around from last to first on ArrowRight', () => {
    const onChange = jest.fn();
    render(<StateSelector value="exploratory" onChange={onChange} />);
    const lastBtn = screen.getByRole('radio', { name: 'Exploratory' });
    fireEvent.keyDown(lastBtn, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('current');
  });

  // ─── Disabled ──────────────────────────────────────────────────────────

  it('all options are disabled when disabled=true', () => {
    render(<StateSelector {...defaultProps} disabled />);
    const radios = screen.getAllByRole('radio');
    radios.forEach((r) => expect(r).toBeDisabled());
  });

  // ─── Design ────────────────────────────────────────────────────────────

  it('active option has inverted (dark bg) style', () => {
    render(<StateSelector {...defaultProps} value="current" />);
    const currentBtn = screen.getByRole('radio', { name: 'Current' });
    expect(currentBtn.className).toContain('bg-[var(--color-text)]');
  });
});
