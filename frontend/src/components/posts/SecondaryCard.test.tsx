import React from 'react';
import { render, screen } from '@testing-library/react';
import SecondaryCard from './SecondaryCard';

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...rest }: React.ComponentPropsWithoutRef<'a'> & { href: string }) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('../../constants/routes', () => ({
  ROUTES: { POST_DETAIL: (id: string) => `/post/${id}` },
}));

const baseProps = {
  id:            'post-2',
  body:          'The first time I told anyone I was struggling.',
  categoryLabel: 'Mental Health',
  sameCount:     23,
  publishedAt:   new Date(Date.now() - 7200 * 1000).toISOString(),
};

describe('SecondaryCard', () => {
  it('renders the body text (truncated)', () => {
    render(<SecondaryCard {...baseProps} />);
    expect(screen.getByText(baseProps.body)).toBeInTheDocument();
  });

  it('renders the category label', () => {
    render(<SecondaryCard {...baseProps} />);
    expect(screen.getByText('Mental Health')).toBeInTheDocument();
  });

  it('renders SAME count', () => {
    render(<SecondaryCard {...baseProps} />);
    expect(screen.getByText('23 SAME')).toBeInTheDocument();
  });

  it('is a link to the post detail', () => {
    render(<SecondaryCard {...baseProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/post/post-2');
  });

  it('does NOT show author alias', () => {
    render(<SecondaryCard {...baseProps} />);
    // No alias text should be present
    expect(screen.queryByText(/Shared by/)).not.toBeInTheDocument();
  });

  it('does NOT show reaction bar', () => {
    render(<SecondaryCard {...baseProps} />);
    expect(screen.queryByRole('button', { name: /SAME/i })).not.toBeInTheDocument();
  });

  it('has a resonance left border element', () => {
    const { container } = render(<SecondaryCard {...baseProps} />);
    // The resonance bar wrapper should exist
    const resonanceBars = container.querySelectorAll('[aria-hidden="true"]');
    expect(resonanceBars.length).toBeGreaterThan(0);
  });

  it('hides SAME count when sameCount is 0', () => {
    render(<SecondaryCard {...baseProps} sameCount={0} />);
    expect(screen.queryByText(/SAME/)).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<SecondaryCard {...baseProps} className="my-custom" />);
    const link = screen.getByRole('link');
    expect(link.className).toContain('my-custom');
  });
});
