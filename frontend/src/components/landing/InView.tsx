'use client';

import { useLayoutEffect, useRef, useState, type JSX, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { ANIMATION, IN_VIEW } from '../../constants/design';

interface InViewProps {
  children: ReactNode;
  className?: string;
}

function prefersMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
}

/**
 * Scroll entrance for landing sections.
 * Layout-effect arms the hidden state before paint, then a double rAF
 * reveals the block so slideUp always has a from-state.
 * Reduced-motion and no-JS: content stays visible.
 */
export default function InView({ children, className }: InViewProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [inView, setInView] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!prefersMotion()) {
      setArmed(true);
      setInView(true);
      return;
    }

    setArmed(true);

    let frameA = 0;
    let frameB = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        frameA = requestAnimationFrame(() => {
          frameB = requestAnimationFrame(() => {
            setInView(true);
          });
        });
      },
      { threshold: IN_VIEW.THRESHOLD, rootMargin: IN_VIEW.ROOT_MARGIN },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameA);
      cancelAnimationFrame(frameB);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-armed={armed ? 'true' : 'false'}
      data-in={inView ? 'true' : 'false'}
      className={cn(ANIMATION.LANDING_INVIEW, className)}
    >
      {children}
    </div>
  );
}
