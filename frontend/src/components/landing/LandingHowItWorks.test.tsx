import { render, screen } from '@testing-library/react';
import LandingHowItWorks from './LandingHowItWorks';
import { LANDING } from '../../constants/landing';

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

describe('LandingHowItWorks', () => {
  it('renders the section heading and every movement in full', () => {
    render(<LandingHowItWorks />);
    expect(screen.getByRole('heading', { level: 2, name: LANDING.HOW_HEADING })).toBeInTheDocument();
    for (const step of LANDING.HOW_STEPS) {
      expect(screen.getByText(step.cue)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: step.title })).toBeVisible();
      expect(screen.getByText(step.body)).toBeVisible();
    }
    expect(screen.getByText(LANDING.HOW_SAME_MARK)).toBeInTheDocument();
  });

  it('lays out each movement as a verso/recto folio', () => {
    const { container } = render(<LandingHowItWorks />);
    const folios = container.querySelectorAll('article.how-folio');
    expect(folios).toHaveLength(LANDING.HOW_STEPS.length);
    expect(folios[0]?.className).toMatch(/md:grid-cols-/);
  });
});
