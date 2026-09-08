/**
 * Footer component tests.
 * Verifies the endpaper band: landmark, statement, brand lockup,
 * platform/rooms/legal indexes, and baseline CTA.
 */

import { render, screen } from '@testing-library/react';
import Footer from './Footer';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';
import {
  FOOTER_COPY,
  FOOTER_LEGAL_LINKS,
  FOOTER_PLATFORM_LINKS,
  footerCopyright,
} from '../../constants/footer';
import { BRAND_LOGO } from '../../constants/brand';
import { ROUTES } from '../../constants/routes';

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

  it('renders the closing statement', () => {
    render(<Footer />);
    expect(screen.getByText(FOOTER_COPY.STATEMENT)).toBeInTheDocument();
  });

  it('renders a link for every experience category', () => {
    render(<Footer />);
    EXPERIENCE_CATEGORIES.forEach((cat) => {
      expect(screen.getByRole('link', { name: cat.displayName })).toBeInTheDocument();
    });
  });

  it('renders the platform links', () => {
    render(<Footer />);
    FOOTER_PLATFORM_LINKS.forEach(({ label }) => {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    });
  });

  it('renders the legal links', () => {
    render(<Footer />);
    FOOTER_LEGAL_LINKS.forEach(({ label }) => {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    });
  });

  it('renders the current year in the copyright line', () => {
    render(<Footer />);
    expect(screen.getByText(footerCopyright(new Date().getFullYear()))).toBeInTheDocument();
  });

  it('renders the homepage CTA', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: FOOTER_COPY.CTA_ARIA })).toHaveAttribute(
      'href',
      ROUTES.LANDING,
    );
  });

  it('has distinct nav landmarks for platform, rooms, and legal', () => {
    render(<Footer />);
    expect(screen.getByRole('navigation', { name: FOOTER_COPY.PLATFORM_NAV })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: FOOTER_COPY.ROOMS_NAV })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: FOOTER_COPY.LEGAL_NAV })).toBeInTheDocument();
  });

  it('uses a full-width endpaper surface', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('w-full');
    expect(footer).toHaveClass('bg-bg-subtle');
  });
});
