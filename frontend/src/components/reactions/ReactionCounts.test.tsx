/**
 * ReactionCounts.test.tsx — Unit tests for ReactionCounts.
 */
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { ReactionCounts } from './ReactionCounts';
import { SECONDARY_REACTIONS } from '../../constants/reactionTypes';

const ZERO_COUNTS = {
  current: 0, past: 0, considering: 0,
  same: 0, iUnderstand: 0, iLearned: 0, iDisagree: 0, tellMeMore: 0,
};

describe('ReactionCounts', () => {
  it('renders nothing when all counts are zero', () => {
    const { container } = render(<ReactionCounts counts={ZERO_COUNTS} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays non-zero counts', () => {
    render(<ReactionCounts counts={{ ...ZERO_COUNTS, same: 15, iUnderstand: 3 }} />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('hides zero-count reactions', () => {
    render(<ReactionCounts counts={{ ...ZERO_COUNTS, same: 5 }} />);
    // "I understand" is 0 — should not appear
    expect(screen.queryByText('I understand')).not.toBeInTheDocument();
  });

  it('uses labels from constants — not hardcoded strings', () => {
    const counts = {
      ...ZERO_COUNTS,
      same: 1, iUnderstand: 2, iLearned: 3, iDisagree: 4, tellMeMore: 5,
    };
    render(<ReactionCounts counts={counts} />);

    SECONDARY_REACTIONS.forEach((reaction) => {
      expect(screen.getByText(reaction.label)).toBeInTheDocument();
    });
  });

  it('formats large counts compactly', () => {
    render(<ReactionCounts counts={{ ...ZERO_COUNTS, same: 15_000 }} />);
    expect(screen.getByText('15k')).toBeInTheDocument();
  });
});
