/**
 * SecondaryDiscoveryList.test.tsx — Unit tests for SecondaryDiscoveryList.
 */
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { SecondaryDiscoveryList } from './SecondaryDiscoveryList';
import { SECONDARY_DISCOVERY_ITEMS } from '../../constants/limits';
import type { ApiPost } from '../../lib/discoveryApi';

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

function makePost(id: string, body = 'Test body'): ApiPost {
  return {
    id,
    authorAlias:     'TestAlias',
    authorAvatarSeed: 'seed',
    body,
    categoryIds:     ['loneliness'],
    state:           'current',
    visibilityScope: 'broad',
    status:          'published',
    publishedAt:     new Date().toISOString(),
    editableUntil:   new Date().toISOString(),
    editedAt:        null,
    reactionCounts: {
      current: 0, past: 0, considering: 0,
      same: 5, iUnderstand: 0, iLearned: 0, iDisagree: 0, tellMeMore: 0,
    },
  };
}

describe('SecondaryDiscoveryList', () => {
  it('renders up to SECONDARY_DISCOVERY_ITEMS posts', () => {
    const posts = Array.from({ length: 10 }, (_, i) => makePost(`post-${i}`));
    render(<SecondaryDiscoveryList posts={posts} />);

    // Should only render SECONDARY_DISCOVERY_ITEMS (5) items
    const bodies = screen.getAllByText('Test body');
    expect(bodies.length).toBe(SECONDARY_DISCOVERY_ITEMS);
  });

  it('renders nothing when posts array is empty', () => {
    const { container } = render(<SecondaryDiscoveryList posts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('links each post to its post detail page', () => {
    render(<SecondaryDiscoveryList posts={[makePost('post-abc')]} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toContain('post-abc');
  });

  it('shows SAME count when > 0', () => {
    render(<SecondaryDiscoveryList posts={[makePost('post-1')]} />);
    expect(screen.getByText(/SAME/i)).toBeInTheDocument();
  });

  it('does not show SAME label when count is 0', () => {
    const post = makePost('post-1');
    post.reactionCounts.same = 0;
    render(<SecondaryDiscoveryList posts={[post]} />);
    expect(screen.queryByText(/SAME/i)).not.toBeInTheDocument();
  });

  it('renders at most 5 posts regardless of input length', () => {
    const posts = Array.from({ length: 20 }, (_, i) => makePost(`p${i}`, `Body ${i}`));
    render(<SecondaryDiscoveryList posts={posts} />);
    const items = screen.getAllByText(/Body \d/);
    expect(items.length).toBe(SECONDARY_DISCOVERY_ITEMS);
  });
});
