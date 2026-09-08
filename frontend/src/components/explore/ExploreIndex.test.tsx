import React from 'react';
import { render, screen } from '@testing-library/react';
import ExploreIndex from './ExploreIndex';
import ExplorePage from '../../app/explore/page';
import { EXPLORE, EXPLORE_DOMAINS, allExploreDomainRooms, exploreChapterHref } from '../../constants/explore';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';
import { ROUTES } from '../../constants/routes';
import { PAGE_META } from '../../constants/seo';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  });
  class MockObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [];
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
    unobserve(): void {}
    observe(): void {}
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockObserver,
  });
});

jest.mock('../layout/Navigation', () => ({
  __esModule: true,
  default: () => <nav aria-label="Primary navigation">nav</nav>,
}));

jest.mock('../layout/Footer', () => ({
  __esModule: true,
  default: () => <footer>footer</footer>,
}));

jest.mock('next/link', () => {
  const Link = React.forwardRef<
    HTMLAnchorElement,
    React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>
  >(({ children, href, ...props }, ref) => (
    <a href={href} ref={ref} {...props}>{children}</a>
  ));
  Link.displayName = 'Link';
  return Link;
});

describe('ExploreIndex', () => {
  it('has exactly one h1 for the rooms', () => {
    render(<ExploreIndex />);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(EXPLORE.HEADING);
  });

  it('lists every experience room as a link', () => {
    render(<ExploreIndex />);
    for (const category of EXPERIENCE_CATEGORIES) {
      expect(
        screen.getByRole('link', { name: EXPLORE.ROOM_ARIA(category.displayName) }),
      ).toHaveAttribute('href', ROUTES.EXPLORE_CATEGORY(category.slug));
    }
  });

  it('opens as three life-domain chapters', () => {
    render(<ExploreIndex />);
    const chapters = screen.getAllByRole('heading', { level: 2 });
    expect(chapters.map((node) => node.textContent)).toEqual([
      ...EXPLORE_DOMAINS.map((domain) => domain.title),
      EXPLORE.MORE_HEADING,
    ]);
  });

  it('lists the three chapters in the title-page contents', () => {
    render(<ExploreIndex />);
    for (const domain of EXPLORE_DOMAINS) {
      expect(
        screen.getByRole('link', { name: EXPLORE.CONTENTS_ITEM_ARIA(domain.numeral, domain.title) }),
      ).toHaveAttribute('href', exploreChapterHref(domain.id));
    }
  });

  it('places every category in exactly one chapter', () => {
    const grouped = allExploreDomainRooms();
    expect(grouped).toHaveLength(EXPERIENCE_CATEGORIES.length);
    expect(new Set(grouped.map((room) => room.id))).toEqual(
      new Set(EXPERIENCE_CATEGORIES.map((room) => room.id)),
    );
  });

  it('forwards to about, guidelines, and help', () => {
    render(<ExploreIndex />);
    expect(screen.getByRole('link', { name: EXPLORE.ABOUT })).toHaveAttribute('href', ROUTES.ABOUT);
    expect(screen.getByRole('link', { name: EXPLORE.GUIDELINES })).toHaveAttribute('href', ROUTES.GUIDELINES);
    expect(screen.getByRole('link', { name: EXPLORE.HELP })).toHaveAttribute('href', ROUTES.HELP);
  });

  it('does not render a breadcrumb trail', () => {
    render(<ExploreIndex />);
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull();
  });
});

describe('ExplorePage', () => {
  it('injects ItemList JSON-LD for the rooms', () => {
    const { container } = render(<ExplorePage />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const types = Array.from(scripts).map((node) => {
      const parsed = JSON.parse(node.innerHTML) as { '@type': string };
      return parsed['@type'];
    });
    expect(types).toContain('ItemList');
    expect(types).not.toContain('BreadcrumbList');
  });
});

describe('PAGE_META.EXPLORE', () => {
  it('meets FR-SEO-2 title and description length', () => {
    expect(PAGE_META.EXPLORE.title.length).toBeGreaterThanOrEqual(50);
    expect(PAGE_META.EXPLORE.title.length).toBeLessThanOrEqual(60);
    expect(PAGE_META.EXPLORE.description.length).toBeGreaterThanOrEqual(140);
    expect(PAGE_META.EXPLORE.description.length).toBeLessThanOrEqual(160);
  });

  it('does not reuse the landing title or description', () => {
    expect(PAGE_META.EXPLORE.title).not.toBe(PAGE_META.LANDING.title);
    expect(PAGE_META.EXPLORE.description).not.toBe(PAGE_META.LANDING.description);
  });
});
