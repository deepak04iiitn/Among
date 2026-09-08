/**
 * Footer component tests.
 * Verifies the "Letter / Typesetter" structure: landmark, letter body,
 * brand lockup, P.S. category index, and colophon stamp.
 */

import { render, screen } from '@testing-library/react';
import Footer from './Footer';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';
import {
  FOOTER_COLOPHON_LINKS,
  FOOTER_COPY,
  footerCopyright,
} from '../../constants/footer';
import { BRAND_LOGO } from '../../constants/brand';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt?: string }) => {
    const Img = require('react').createElement('img', { alt: alt ?? '' });
    return Img;
  },
}));

describe('Footer', () => {
  it('renders a contentinfo landmark', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders the brand lockup', () => {
    render(<Footer />);
    expect(screen.getByText(BRAND_LOGO.WORDMARK)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: BRAND_LOGO.LINK_ARIA })).toBeInTheDocument();
  });

  it('renders the letter body', () => {
    render(<Footer />);
    expect(screen.getByText(FOOTER_COPY.STATEMENT)).toBeInTheDocument();
  });

  it('renders a link for every experience category', () => {
    render(<Footer />);
    EXPERIENCE_CATEGORIES.forEach((cat) => {
      expect(screen.getByRole('link', { name: cat.displayName })).toBeInTheDocument();
    });
  });

  it('renders the platform and legal links', () => {
    render(<Footer />);
    FOOTER_COLOPHON_LINKS.forEach(({ label }) => {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    });
  });

  it('renders the current year in the copyright line', () => {
    render(<Footer />);
    expect(screen.getByText(footerCopyright(new Date().getFullYear()))).toBeInTheDocument();
  });

  it('has distinct nav landmarks for the P.S. index and the colophon', () => {
    render(<Footer />);
    expect(screen.getByRole('navigation', { name: FOOTER_COPY.PS_HEADING })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: FOOTER_COPY.COLOPHON_NAV })).toBeInTheDocument();
  });
});
