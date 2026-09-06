/**
 * Breadcrumb component tests.
 */

import { render, screen } from '@testing-library/react';
import Breadcrumb, { type BreadcrumbSegment } from './Breadcrumb';

describe('Breadcrumb', () => {
  const segments: BreadcrumbSegment[] = [
    { label: 'AMONG',   href: '/' },
    { label: 'Explore', href: '/explore' },
    { label: 'Loneliness' },
  ];

  it('renders nothing when fewer than 2 segments', () => {
    const { container } = render(
      <Breadcrumb segments={[{ label: 'Only one' }]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders breadcrumb nav with correct aria-label', () => {
    render(<Breadcrumb segments={segments} />);
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' })
    ).toBeInTheDocument();
  });

  it('renders all segment labels', () => {
    render(<Breadcrumb segments={segments} />);
    expect(screen.getByText('AMONG')).toBeInTheDocument();
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Loneliness')).toBeInTheDocument();
  });

  it('renders links for segments with href', () => {
    render(<Breadcrumb segments={segments} />);
    const links = screen.getAllByRole('link');
    // First two segments have href
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/');
    expect(links[1]).toHaveAttribute('href', '/explore');
  });

  it('renders the last segment as non-link text with aria-current="page"', () => {
    render(<Breadcrumb segments={segments} />);
    const currentPage = screen.getByText('Loneliness');
    expect(currentPage).toHaveAttribute('aria-current', 'page');
    expect(currentPage.tagName).not.toBe('A');
  });

  it('renders BreadcrumbList JSON-LD script tag', () => {
    render(<Breadcrumb segments={segments} />);
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThan(0);

    const firstScript = scripts[0];
    const jsonLd = JSON.parse(firstScript?.textContent ?? '{}') as Record<string, unknown>;
    expect(jsonLd['@type']).toBe('BreadcrumbList');
    expect(Array.isArray(jsonLd['itemListElement'])).toBe(true);
  });

  it('BreadcrumbList has correct number of items', () => {
    render(<Breadcrumb segments={segments} />);
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const firstScript = scripts[0];
    const jsonLd = JSON.parse(firstScript?.textContent ?? '{}') as { itemListElement: unknown[] };
    expect(jsonLd.itemListElement).toHaveLength(segments.length);
  });

  it('first BreadcrumbList item has position 1', () => {
    render(<Breadcrumb segments={segments} />);
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const firstScript = scripts[0];
    const jsonLd = JSON.parse(firstScript?.textContent ?? '{}') as {
      itemListElement: Array<{ position: number; name: string }>;
    };
    expect(jsonLd.itemListElement[0]?.position).toBe(1);
    expect(jsonLd.itemListElement[0]?.name).toBe('AMONG');
  });

  it('renders with a custom className', () => {
    const { container } = render(
      <Breadcrumb segments={segments} className="mt-4 custom-class" />
    );
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('custom-class');
  });
});
