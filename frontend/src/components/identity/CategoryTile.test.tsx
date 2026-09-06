import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryTile from './CategoryTile';

const defaultProps = {
  id:          'loneliness',
  label:       'Loneliness',
  description: 'Feeling disconnected and unseen',
  isSelected:  false,
  onToggle:    jest.fn(),
};

describe('CategoryTile', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── Rendering ─────────────────────────────────────────────────────────

  it('renders the category label', () => {
    render(<CategoryTile {...defaultProps} />);
    expect(screen.getByText('Loneliness')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<CategoryTile {...defaultProps} />);
    expect(screen.getByText('Feeling disconnected and unseen')).toBeInTheDocument();
  });

  // ─── Accessibility ──────────────────────────────────────────────────────

  it('has role="checkbox"', () => {
    render(<CategoryTile {...defaultProps} />);
    expect(screen.getByRole('checkbox', { name: /Loneliness/i })).toBeInTheDocument();
  });

  it('has aria-checked=false when not selected', () => {
    render(<CategoryTile {...defaultProps} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
  });

  it('has aria-checked=true when selected', () => {
    render(<CategoryTile {...defaultProps} isSelected />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  // ─── Interaction ───────────────────────────────────────────────────────

  it('calls onToggle with the id when clicked', () => {
    render(<CategoryTile {...defaultProps} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(defaultProps.onToggle).toHaveBeenCalledWith('loneliness');
  });

  it('does NOT call onToggle when disabled', () => {
    render(<CategoryTile {...defaultProps} isDisabled />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(defaultProps.onToggle).not.toHaveBeenCalled();
  });

  // ─── Selected state visual ─────────────────────────────────────────────

  it('has indigo border when selected', () => {
    render(<CategoryTile {...defaultProps} isSelected />);
    expect(screen.getByRole('checkbox').className).toContain('border-[var(--color-accent)]');
  });

  it('has accent-subtle background when selected', () => {
    render(<CategoryTile {...defaultProps} isSelected />);
    expect(screen.getByRole('checkbox').className).toContain('bg-[var(--color-accent-subtle)]');
  });

  it('shows indigo dot indicator when selected', () => {
    render(<CategoryTile {...defaultProps} isSelected />);
    // The dot is aria-hidden but should be present
    const dot = screen.getByRole('checkbox').querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
    expect(dot?.className).toContain('bg-[var(--color-accent)]');
  });

  it('does NOT show indigo dot when not selected', () => {
    render(<CategoryTile {...defaultProps} isSelected={false} />);
    const dot = screen.getByRole('checkbox').querySelector('[aria-hidden="true"]');
    expect(dot).not.toBeInTheDocument();
  });

  // ─── Disabled state ────────────────────────────────────────────────────

  it('is disabled when isDisabled=true', () => {
    render(<CategoryTile {...defaultProps} isDisabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('has aria-disabled when isDisabled=true', () => {
    render(<CategoryTile {...defaultProps} isDisabled />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-disabled', 'true');
  });
});
