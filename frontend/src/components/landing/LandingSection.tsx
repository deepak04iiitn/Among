import type { JSX, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface LandingSectionProps {
  id: string;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}

export default function LandingSection({
  id,
  ariaLabel,
  children,
  className,
}: LandingSectionProps): JSX.Element {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn('border-t border-border py-20 md:py-28 px-5 md:px-8', className)}
    >
      {children}
    </section>
  );
}
