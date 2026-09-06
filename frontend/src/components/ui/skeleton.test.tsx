import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  SkeletonExperienceCard,
  SkeletonSecondaryCard,
} from './skeleton';

describe('Skeleton', () => {
  it('renders with aria-hidden', () => {
    render(<Skeleton />);
    expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('defaults to text shape', () => {
    render(<Skeleton />);
    const el = document.querySelector('[aria-hidden="true"]');
    expect(el?.className).toContain('h-4');
  });

  it('renders circle shape', () => {
    render(<Skeleton shape="circle" className="w-10 h-10" />);
    const el = document.querySelector('[aria-hidden="true"]');
    expect(el?.className).toContain('rounded-full');
  });

  it('applies custom className', () => {
    render(<Skeleton className="w-24 h-8" />);
    const el = document.querySelector('[aria-hidden="true"]');
    expect(el?.className).toContain('w-24');
  });

  it('uses border color for background', () => {
    render(<Skeleton />);
    const el = document.querySelector('[aria-hidden="true"]');
    expect(el?.className).toContain('bg-[var(--color-border)]');
  });
});

describe('SkeletonExperienceCard', () => {
  it('has accessible loading status role', () => {
    render(<SkeletonExperienceCard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<SkeletonExperienceCard />);
    expect(screen.getByLabelText('Loading experience')).toBeInTheDocument();
  });

  it('announces to screen readers', () => {
    render(<SkeletonExperienceCard />);
    expect(screen.getByText('Loading experience…')).toBeInTheDocument();
  });
});

describe('SkeletonSecondaryCard', () => {
  it('has accessible loading status role', () => {
    render(<SkeletonSecondaryCard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<SkeletonSecondaryCard />);
    expect(screen.getByLabelText('Loading post')).toBeInTheDocument();
  });

  it('announces to screen readers', () => {
    render(<SkeletonSecondaryCard />);
    expect(screen.getByText('Loading post…')).toBeInTheDocument();
  });
});
