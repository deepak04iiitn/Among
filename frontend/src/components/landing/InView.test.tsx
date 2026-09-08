import { render, screen, waitFor } from '@testing-library/react';
import InView from './InView';
import { ANIMATION } from '../../constants/design';

function mockMatchMedia(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  });
}

function mockIntersection(isIntersecting: boolean): void {
  class MockObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [];
    constructor(private readonly callback: IntersectionObserverCallback) {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
    unobserve(): void {}
    observe(): void {
      this.callback(
        [{ isIntersecting } as IntersectionObserverEntry],
        this,
      );
    }
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockObserver,
  });
}

describe('InView', () => {
  it('always renders children', () => {
    mockMatchMedia(true);
    mockIntersection(false);
    render(<InView><p>Letter</p></InView>);
    expect(screen.getByText('Letter')).toBeInTheDocument();
  });

  it('sets data-in when the block enters view', async () => {
    mockMatchMedia(true);
    mockIntersection(true);
    const { container } = render(<InView><p>In view</p></InView>);
    await waitFor(() => {
      expect(container.firstChild).toHaveAttribute('data-in', 'true');
    });
    expect(container.firstChild).toHaveAttribute('data-armed', 'true');
    expect(container.firstChild).toHaveClass(ANIMATION.LANDING_INVIEW);
  });

  it('stays out of view until the observer reports intersection', () => {
    mockMatchMedia(true);
    mockIntersection(false);
    const { container } = render(<InView><p>Waiting</p></InView>);
    expect(container.firstChild).toHaveAttribute('data-in', 'false');
    expect(container.firstChild).toHaveAttribute('data-armed', 'true');
  });

  it('shows immediately when the visitor prefers reduced motion', () => {
    mockMatchMedia(false);
    mockIntersection(false);
    const { container } = render(<InView><p>Still</p></InView>);
    expect(container.firstChild).toHaveAttribute('data-in', 'true');
    expect(container.firstChild).toHaveAttribute('data-armed', 'true');
  });
});
