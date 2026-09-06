import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExperienceCard from './ExperienceCard';

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...rest }: React.ComponentPropsWithoutRef<'a'> & { href: string }) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('../../constants/routes', () => ({
  ROUTES: {
    POST_DETAIL: (id: string) => `/post/${id}`,
  },
}));

const baseProps = {
  id:            'post-1',
  body:          'I lost my job and didn\'t tell anyone for three weeks.',
  categoryLabel: 'Work & Career',
  stateLabel:    'Past',
  authorAlias:   { name: 'Silver Moth', avatarSeed: 'seed123' },
  sameCount:     42,
  hasReacted:    false,
  hasSaved:      false,
  publishedAt:   new Date(Date.now() - 3600 * 1000).toISOString(), // 1h ago
};

describe('ExperienceCard', () => {
  // ─── Rendering ─────────────────────────────────────────────────────────

  it('renders the post body', () => {
    render(<ExperienceCard {...baseProps} />);
    expect(screen.getByText(baseProps.body)).toBeInTheDocument();
  });

  it('renders the category label', () => {
    render(<ExperienceCard {...baseProps} />);
    expect(screen.getByText('Work & Career')).toBeInTheDocument();
  });

  it('renders the state label', () => {
    render(<ExperienceCard {...baseProps} />);
    expect(screen.getByText('Past')).toBeInTheDocument();
  });

  it('renders the author alias', () => {
    render(<ExperienceCard {...baseProps} />);
    expect(screen.getByText(/Silver Moth/)).toBeInTheDocument();
  });

  it('renders SAME count', () => {
    render(<ExperienceCard {...baseProps} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders the connect CTA link', () => {
    render(<ExperienceCard {...baseProps} />);
    expect(screen.getByText(/Talk to someone/)).toBeInTheDocument();
  });

  // ─── SAME button ─────────────────────────────────────────────────────

  it('SAME button has aria-pressed=false when not reacted', () => {
    render(<ExperienceCard {...baseProps} />);
    const sameBtn = screen.getByRole('button', { name: /Say SAME/i });
    expect(sameBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('SAME button has aria-pressed=true when reacted', () => {
    render(<ExperienceCard {...baseProps} hasReacted />);
    const sameBtn = screen.getByRole('button', { name: /You said SAME/i });
    expect(sameBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onSame with correct args when SAME is clicked', () => {
    const onSame = jest.fn();
    render(<ExperienceCard {...baseProps} onSame={onSame} />);
    fireEvent.click(screen.getByRole('button', { name: /Say SAME/i }));
    expect(onSame).toHaveBeenCalledWith('post-1', false);
  });

  it('SAME button text is "SAME" — not an icon or heart', () => {
    render(<ExperienceCard {...baseProps} />);
    const sameBtn = screen.getByRole('button', { name: /SAME/i });
    expect(sameBtn).toHaveTextContent('SAME');
  });

  // ─── Save button ─────────────────────────────────────────────────────

  it('calls onSave when Save is clicked', () => {
    const onSave = jest.fn();
    render(<ExperienceCard {...baseProps} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /Save this experience/i }));
    expect(onSave).toHaveBeenCalledWith('post-1', false);
  });

  it('shows "Saved" when hasSaved is true', () => {
    render(<ExperienceCard {...baseProps} hasSaved />);
    expect(screen.getByRole('button', { name: /Unsave/i })).toHaveTextContent('Saved');
  });

  // ─── Secondary reactions ─────────────────────────────────────────────

  it('renders secondary reactions', () => {
    const secondaryReactions = [
      { typeId: 'understand', label: 'I understand', count: 8, hasReacted: false },
    ];
    render(<ExperienceCard {...baseProps} secondaryReactions={secondaryReactions} />);
    expect(screen.getByText(/I understand/)).toBeInTheDocument();
    expect(screen.getByText('(8)')).toBeInTheDocument();
  });

  // ─── Design invariants ───────────────────────────────────────────────

  it('is an article element', () => {
    render(<ExperienceCard {...baseProps} />);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('does NOT render an avatar (alias only, no avatar on primary card)', () => {
    render(<ExperienceCard {...baseProps} />);
    // No img role should be present on this card
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('body uses editorial font classes', () => {
    render(<ExperienceCard {...baseProps} />);
    const bodyEl = screen.getByText(baseProps.body);
    expect(bodyEl.className).toContain('font-editorial');
    expect(bodyEl.className).toContain('text-headline');
  });
});
