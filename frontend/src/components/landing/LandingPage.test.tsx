/**
 * Landing page — structure, SEO landmarks, and internal links.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import LandingPage from '../../app/page';
import { LANDING } from '../../constants/landing';
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

jest.mock('../../components/layout/Navigation', () => ({
  __esModule: true,
  default: () => <nav aria-label="Primary navigation">nav</nav>,
}));

jest.mock('../../components/layout/Footer', () => ({
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

describe('LandingPage', () => {
  it('has exactly one h1 matching the product promise', () => {
    render(<LandingPage />);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveAttribute('aria-label', LANDING.HERO_TITLE);
  });

  it('renders the primary CTA to onboarding', () => {
    render(<LandingPage />);
    const ctas = screen.getAllByRole('link', { name: LANDING.CTA_PRIMARY_ARIA });
    expect(ctas.length).toBeGreaterThanOrEqual(1);
    expect(ctas[0]).toHaveAttribute('href', ROUTES.ONBOARDING_INTENT);
  });

  it('links to every public experience category', () => {
    render(<LandingPage />);
    for (const category of EXPERIENCE_CATEGORIES) {
      expect(
        screen.getByRole('link', { name: `Explore anonymous ${category.displayName} experiences` }),
      ).toHaveAttribute('href', ROUTES.EXPLORE_CATEGORY(category.slug));
    }
  });

  it('includes FAQ questions as headings', () => {
    render(<LandingPage />);
    for (const item of LANDING.FAQ_ITEMS) {
      expect(screen.getByRole('heading', { name: item.question })).toBeInTheDocument();
    }
  });

  it('forwards visitors to about, guidelines, help, and explore', () => {
    render(<LandingPage />);
    expect(screen.getByRole('link', { name: LANDING.MANIFESTO_ABOUT })).toHaveAttribute('href', ROUTES.ABOUT);
    expect(screen.getByRole('link', { name: LANDING.SAFETY_GUIDELINES })).toHaveAttribute('href', ROUTES.GUIDELINES);
    expect(screen.getByRole('link', { name: LANDING.FAQ_MORE })).toHaveAttribute('href', ROUTES.HELP);
    expect(screen.getAllByRole('link', { name: LANDING.CTA_SECONDARY_ARIA }).length).toBeGreaterThanOrEqual(1);
  });

  it('includes every how-it-works movement for crawlers', () => {
    render(<LandingPage />);
    expect(screen.getByRole('region', { name: LANDING.HOW_REGION })).toBeInTheDocument();
    for (const step of LANDING.HOW_STEPS) {
      expect(screen.getByRole('heading', { name: step.title })).toBeInTheDocument();
    }
  });

  it('injects WebSite, Organization, and FAQ JSON-LD', () => {
    const { container } = render(<LandingPage />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(3);
    const types = Array.from(scripts).map((node) => {
      const parsed = JSON.parse(node.innerHTML) as { '@type': string };
      return parsed['@type'];
    });
    expect(types).toEqual(expect.arrayContaining(['WebSite', 'Organization', 'FAQPage']));
  });
});

describe('PAGE_META.LANDING', () => {
  it('meets FR-SEO-2 title and description length', () => {
    expect(PAGE_META.LANDING.title.length).toBeGreaterThanOrEqual(50);
    expect(PAGE_META.LANDING.title.length).toBeLessThanOrEqual(60);
    expect(PAGE_META.LANDING.description.length).toBeGreaterThanOrEqual(140);
    expect(PAGE_META.LANDING.description.length).toBeLessThanOrEqual(160);
  });
});
