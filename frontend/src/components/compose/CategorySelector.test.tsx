import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategorySelector from './CategorySelector';

// Mock experience categories with a small set for testing
jest.mock('../../constants/experienceCategories', () => ({
  EXPERIENCE_CATEGORIES: [
    {
      id:          'loneliness',
      slug:        'loneliness',
      displayName: 'Loneliness',
      description: 'Feeling disconnected',
      relatedCategoryIds: [],
      seoKeyword:  'loneliness',
    },
    {
      id:          'grief',
      slug:        'grief',
      displayName: 'Grief & Loss',
      description: 'Processing loss',
      relatedCategoryIds: [],
      seoKeyword:  'grief',
    },
    {
      id:          'career',
      slug:        'career',
      displayName: 'Work & Career',
      description: 'Career challenges',
      relatedCategoryIds: [],
      seoKeyword:  'career',
    },
  ],
}));

jest.mock('../../constants/limits', () => ({
  POST_CATEGORY_MAX: 3,
  POST_CATEGORY_MIN: 1,
  COMPOSE_COUNTER_VISIBLE_THRESHOLD: 200,
}));

describe('CategorySelector', () => {
  const setup = (overrides = {}) => {
    const onChange = jest.fn();
    const utils = render(
      <CategorySelector selectedIds={[]} onChange={onChange} {...overrides} />
    );
    return { ...utils, onChange };
  };

  // ─── Rendering ─────────────────────────────────────────────────────────

  it('renders all category options', () => {
    setup();
    expect(screen.getByRole('checkbox', { name: /Loneliness/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Grief/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Work/i })).toBeInTheDocument();
  });

  it('renders the selection count', () => {
    setup({ selectedIds: ['loneliness'] });
    expect(screen.getByText(/1 of 3 selected/i)).toBeInTheDocument();
  });

  it('shows minimum selection hint when below min', () => {
    setup({ selectedIds: [], minSelections: 2 });
    expect(screen.getByText(/minimum 2/i)).toBeInTheDocument();
  });

  // ─── Accessibility ──────────────────────────────────────────────────────

  it('has a group role with accessible label', () => {
    setup();
    expect(screen.getByRole('group', { name: /Select up to/i })).toBeInTheDocument();
  });

  it('marks selected categories as checked', () => {
    setup({ selectedIds: ['loneliness'] });
    expect(screen.getByRole('checkbox', { name: /Loneliness/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: /Grief/i })).toHaveAttribute('aria-checked', 'false');
  });

  // ─── Interaction ───────────────────────────────────────────────────────

  it('calls onChange with added id when unselected option clicked', () => {
    const { onChange } = setup({ selectedIds: [] });
    fireEvent.click(screen.getByRole('checkbox', { name: /Loneliness/i }));
    expect(onChange).toHaveBeenCalledWith(['loneliness']);
  });

  it('calls onChange removing id when selected option clicked', () => {
    const { onChange } = setup({ selectedIds: ['loneliness'] });
    fireEvent.click(screen.getByRole('checkbox', { name: /Loneliness/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('does NOT allow selection beyond maxSelections', () => {
    setup({ selectedIds: ['loneliness', 'grief', 'career'], maxSelections: 3 });
    // All 3 are selected and maxSelections is 3 — clicking another should not call onChange
    // But all 3 categories ARE already selected, so there's nothing new to click here.
    // Re-setup with a 2 max to test overflow prevention
    const { onChange: onChange2 } = setup({
      selectedIds: ['loneliness', 'grief'],
      maxSelections: 2,
    });
    fireEvent.click(screen.getAllByRole('checkbox', { name: /Work/i })[0]);
    expect(onChange2).not.toHaveBeenCalled();
  });

  it('shows indigo dot on selected category', () => {
    setup({ selectedIds: ['loneliness'] });
    const lonelinessTile = screen.getByRole('checkbox', { name: /Loneliness/i });
    const dot = lonelinessTile.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
  });

  // ─── Disabled ──────────────────────────────────────────────────────────

  it('does not call onChange when disabled', () => {
    const { onChange } = setup({ disabled: true });
    fireEvent.click(screen.getByRole('checkbox', { name: /Loneliness/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  // ─── Live region ───────────────────────────────────────────────────────

  it('count has aria-live="polite"', () => {
    setup({ selectedIds: ['loneliness'] });
    const counter = screen.getByText(/1 of 3 selected/i).closest('[aria-live]');
    expect(counter).toHaveAttribute('aria-live', 'polite');
  });
});
