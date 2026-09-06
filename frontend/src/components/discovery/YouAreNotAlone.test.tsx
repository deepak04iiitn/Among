/**
 * YouAreNotAlone.test.tsx — Unit tests for YouAreNotAlone.
 */
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { YouAreNotAlone } from './YouAreNotAlone';
import { PRIVACY_THRESHOLD_MIN_GROUP_SIZE } from '../../constants/limits';
import type { YanaStatEntry } from '../../lib/discoveryApi';

function makeEntry(categoryId: string, count: number | null, belowThreshold: boolean): YanaStatEntry {
  return {
    categoryId,
    displayName:    categoryId === 'loneliness' ? 'Loneliness' : 'Work',
    count,
    belowThreshold,
  };
}

describe('YouAreNotAlone', () => {
  it('shows loading state when loading', () => {
    render(<YouAreNotAlone entries={[]} loading />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(<YouAreNotAlone entries={[]} />);
    expect(screen.getByText(/come back tomorrow/i)).toBeInTheDocument();
  });

  it('masks count below threshold with "Not enough data yet"', () => {
    const entry = makeEntry('loneliness', null, true);
    render(<YouAreNotAlone entries={[entry]} />);
    expect(screen.getByText(/not enough data/i)).toBeInTheDocument();
  });

  it('shows formatted count above threshold', () => {
    const count = PRIVACY_THRESHOLD_MIN_GROUP_SIZE + 50;
    const entry = makeEntry('loneliness', count, false);
    render(<YouAreNotAlone entries={[entry]} />);
    expect(screen.getByText(String(count))).toBeInTheDocument();
  });

  it('renders all entries', () => {
    const entries = [
      makeEntry('loneliness', 200, false),
      makeEntry('work', 50, true),
    ];
    render(<YouAreNotAlone entries={entries} />);
    expect(screen.getByText('Loneliness')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('does not show individual user data', () => {
    const entry = makeEntry('loneliness', 200, false);
    render(<YouAreNotAlone entries={[entry]} />);

    // No "account", "email", "uid" in DOM
    expect(screen.queryByText(/account/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/email/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/uid/i)).not.toBeInTheDocument();
  });

  it('section has accessible label', () => {
    render(<YouAreNotAlone entries={[]} />);
    expect(screen.getByRole('region', { name: /you are not alone/i })).toBeInTheDocument();
  });
});
