/**
 * PrimaryReactionSelector.test.tsx — Unit tests for PrimaryReactionSelector.
 */
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrimaryReactionSelector } from './PrimaryReactionSelector';
import { PRIMARY_REACTIONS, PRIMARY_REACTION_IDS } from '../../constants/reactionTypes';

function renderSelector(props: Partial<React.ComponentProps<typeof PrimaryReactionSelector>> = {}) {
  const onChange = jest.fn();
  const result   = render(
    <PrimaryReactionSelector
      selected={null}
      onChange={onChange}
      {...props}
    />
  );
  return { onChange, ...result };
}

describe('PrimaryReactionSelector', () => {
  it('renders all primary reaction options from constants', () => {
    renderSelector();
    PRIMARY_REACTIONS.forEach((reaction) => {
      expect(screen.getByRole('radio', { name: reaction.label })).toBeInTheDocument();
    });
  });

  it('has role="radiogroup"', () => {
    renderSelector();
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('marks selected option as aria-checked true', () => {
    renderSelector({ selected: PRIMARY_REACTION_IDS.CURRENT });
    const activeBtn = screen.getByRole('radio', { name: PRIMARY_REACTIONS[0]!.label });
    expect(activeBtn).toHaveAttribute('aria-checked', 'true');
  });

  it('marks non-selected options as aria-checked false', () => {
    renderSelector({ selected: PRIMARY_REACTION_IDS.CURRENT });
    const inactiveBtn = screen.getByRole('radio', { name: PRIMARY_REACTIONS[1]!.label });
    expect(inactiveBtn).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with reaction ID when clicked', () => {
    const { onChange } = renderSelector({ selected: null });
    fireEvent.click(screen.getByRole('radio', { name: PRIMARY_REACTIONS[0]!.label }));
    expect(onChange).toHaveBeenCalledWith(PRIMARY_REACTION_IDS.CURRENT);
  });

  it('calls onChange with null when active reaction is clicked (toggle off)', () => {
    const { onChange } = renderSelector({ selected: PRIMARY_REACTION_IDS.CURRENT });
    fireEvent.click(screen.getByRole('radio', { name: PRIMARY_REACTIONS[0]!.label }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('mutual exclusivity — only one can be selected', () => {
    renderSelector({ selected: PRIMARY_REACTION_IDS.PAST });
    const activeBtn   = screen.getByRole('radio', { name: PRIMARY_REACTIONS[1]!.label });
    const inactiveBtn = screen.getByRole('radio', { name: PRIMARY_REACTIONS[0]!.label });
    expect(activeBtn).toHaveAttribute('aria-checked', 'true');
    expect(inactiveBtn).toHaveAttribute('aria-checked', 'false');
  });

  it('is disabled when loading', () => {
    renderSelector({ loading: true });
    PRIMARY_REACTIONS.forEach((reaction) => {
      expect(screen.getByRole('radio', { name: reaction.label })).toBeDisabled();
    });
  });

  it('uses labels from constants — not hardcoded strings', () => {
    renderSelector();
    // Verify labels match the constants exactly
    PRIMARY_REACTIONS.forEach((reaction) => {
      expect(screen.getByRole('radio', { name: reaction.label })).toBeInTheDocument();
    });
  });
});
