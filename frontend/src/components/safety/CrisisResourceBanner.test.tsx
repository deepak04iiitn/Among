import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CrisisResourceBanner from './CrisisResourceBanner';

const sampleResources = [
  {
    name:        'Crisis Text Line',
    description: 'Text-based crisis support',
    phone:       '741741',
    url:         'https://www.crisistextline.org',
    available:   '24/7',
  },
  {
    name:        'National Suicide Prevention Lifeline',
    description: 'Voice and chat crisis counseling',
    phone:       '988',
    available:   '24/7',
  },
];

describe('CrisisResourceBanner', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  // ─── Rendering ─────────────────────────────────────────────────────────

  it('renders all resources', () => {
    render(<CrisisResourceBanner resources={sampleResources} />);
    expect(screen.getByText('Crisis Text Line')).toBeInTheDocument();
    expect(screen.getByText('National Suicide Prevention Lifeline')).toBeInTheDocument();
  });

  it('renders phone numbers as links', () => {
    render(<CrisisResourceBanner resources={sampleResources} />);
    const phoneLink = screen.getByRole('link', { name: /Call Crisis Text Line/i });
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink).toHaveAttribute('href', 'tel:741741');
  });

  it('renders website links with target="_blank"', () => {
    render(<CrisisResourceBanner resources={sampleResources} />);
    const websiteLink = screen.getByRole('link', { name: /Visit Crisis Text Line website/i });
    expect(websiteLink).toHaveAttribute('target', '_blank');
    expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the supportive header copy (not alarmist tone)', () => {
    render(<CrisisResourceBanner resources={sampleResources} />);
    expect(screen.getByText(/You don't have to go through this alone/i)).toBeInTheDocument();
    expect(screen.getByText(/whenever you're ready/i)).toBeInTheDocument();
  });

  // ─── Accessibility ──────────────────────────────────────────────────────

  it('has aria-live="assertive"', () => {
    render(<CrisisResourceBanner resources={sampleResources} />);
    const banner = screen.getByRole('complementary');
    expect(banner).toHaveAttribute('aria-live', 'assertive');
  });

  it('has aria-atomic="true"', () => {
    render(<CrisisResourceBanner resources={sampleResources} />);
    const banner = screen.getByRole('complementary');
    expect(banner).toHaveAttribute('aria-atomic', 'true');
  });

  it('has accessible label', () => {
    render(<CrisisResourceBanner resources={sampleResources} />);
    expect(screen.getByLabelText('Support resources available')).toBeInTheDocument();
  });

  // ─── Dismiss behaviour — minimum 3 second visibility ────────────────────

  it('renders dismiss button when onDismiss is provided', () => {
    render(<CrisisResourceBanner resources={sampleResources} onDismiss={jest.fn()} />);
    expect(screen.getByRole('button', { name: /Dismiss|Please take a moment/i })).toBeInTheDocument();
  });

  it('dismiss button is NOT enabled before 3 seconds', () => {
    render(<CrisisResourceBanner resources={sampleResources} onDismiss={jest.fn()} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-disabled', 'true');
  });

  it('dismiss button IS enabled after 3 seconds', () => {
    render(<CrisisResourceBanner resources={sampleResources} onDismiss={jest.fn()} />);
    act(() => { jest.advanceTimersByTime(3000); });
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-disabled', 'false');
  });

  it('does NOT call onDismiss before 3 seconds even if clicked', () => {
    const onDismiss = jest.fn();
    render(<CrisisResourceBanner resources={sampleResources} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('calls onDismiss after 3 seconds when clicked', () => {
    const onDismiss = jest.fn();
    render(<CrisisResourceBanner resources={sampleResources} onDismiss={onDismiss} />);
    act(() => { jest.advanceTimersByTime(3000); });
    fireEvent.click(screen.getByRole('button'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does NOT render dismiss button when onDismiss is not provided', () => {
    render(<CrisisResourceBanner resources={sampleResources} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // ─── Design invariants ──────────────────────────────────────────────────

  it('has border but NO red/alarming background', () => {
    render(<CrisisResourceBanner resources={sampleResources} />);
    const banner = screen.getByRole('complementary');
    // Should use border color, not a saturated error color as background
    expect(banner.className).toContain('bg-[var(--color-bg)]');
    expect(banner.className).not.toContain('bg-[var(--color-error)]');
  });
});
