/**
 * CategoryBrowse.test.tsx — Unit tests for CategoryBrowse.
 */
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { CategoryBrowse, RelatedCategories } from './CategoryBrowse';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) {
    return <a href={href} {...rest}>{children}</a>;
  };
});

describe('CategoryBrowse', () => {
  it('renders all categories when no limit', () => {
    render(<CategoryBrowse />);
    EXPERIENCE_CATEGORIES.forEach((cat) => {
      expect(screen.getByText(cat.displayName)).toBeInTheDocument();
    });
  });

  it('respects limit prop', () => {
    render(<CategoryBrowse limit={3} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('each category links to correct slug URL', () => {
    render(<CategoryBrowse limit={1} />);
    const firstCat = EXPERIENCE_CATEGORIES[0]!;
    const link = screen.getByRole('link', { name: new RegExp(firstCat.displayName) });
    expect(link.getAttribute('href')).toContain(firstCat.slug);
  });

  it('marks active category with aria-current="page"', () => {
    const activeCat = EXPERIENCE_CATEGORIES[0]!;
    render(<CategoryBrowse activeCategoryId={activeCat.id} />);
    const link = screen.getByRole('link', { name: new RegExp(activeCat.displayName) });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('non-active categories do not have aria-current', () => {
    const activeCat = EXPERIENCE_CATEGORIES[0]!;
    const otherCat  = EXPERIENCE_CATEGORIES[1]!;
    render(<CategoryBrowse activeCategoryId={activeCat.id} />);
    const otherLink = screen.getByRole('link', { name: new RegExp(otherCat.displayName) });
    expect(otherLink).not.toHaveAttribute('aria-current');
  });

  it('is inside a nav element with accessible label', () => {
    render(<CategoryBrowse />);
    expect(screen.getByRole('navigation', { name: /browse all experience categories/i })).toBeInTheDocument();
  });
});

describe('RelatedCategories', () => {
  it('renders related category links from constants', () => {
    const catWithRelated = EXPERIENCE_CATEGORIES.find((c) => c.relatedCategoryIds.length > 0)!;
    render(<RelatedCategories categoryId={catWithRelated.id} />);

    catWithRelated.relatedCategoryIds.forEach((relId) => {
      const related = EXPERIENCE_CATEGORIES.find((c) => c.id === relId);
      if (related) {
        expect(screen.getByText(related.displayName)).toBeInTheDocument();
      }
    });
  });

  it('returns null for category with no related', () => {
    const noRelated = EXPERIENCE_CATEGORIES.find((c) => c.relatedCategoryIds.length === 0);
    if (!noRelated) return; // skip if all have related
    const { container } = render(<RelatedCategories categoryId={noRelated.id} />);
    expect(container.firstChild).toBeNull();
  });
});
