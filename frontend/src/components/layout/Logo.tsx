import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';
import { ROUTES } from '../../constants/routes';
import { BRAND_LOGO, brandLogoWidth } from '../../constants/brand';
import { COLOR, FONT, TEXT_SIZE } from '../../constants/design';
import { cn } from '../../lib/utils';

export interface LogoProps {
  /** Pixel height of the logo image (width scales proportionally). */
  height?: number;
  /** Wraps the logo in a Link — pass false to render as a plain <span> */
  href?: string | false;
  /** Extra Tailwind classes on the wrapping element */
  className?: string;
  /** Eager-load for above-the-fold placements (nav). Default: false */
  priority?: boolean;
}

/**
 * AMONG brand lockup — `/Among_Logo.png` with lowercase Comfortaa wordmark to its right.
 * Used in the header capsule and as the footer signature.
 */
export default function Logo({
  height = BRAND_LOGO.NAV_HEIGHT_PX,
  href = ROUTES.LANDING,
  className = '',
  priority = false,
}: LogoProps): JSX.Element {
  const width = brandLogoWidth(height);
  const isFooterScale = height >= BRAND_LOGO.FOOTER_HEIGHT_PX;

  const lockup = (
    <>
      <Image
        src={BRAND_LOGO.SRC}
        alt=""
        width={width}
        height={height}
        priority={priority}
        aria-hidden="true"
        className="object-contain select-none"
      />
      <span
        className={cn(
          FONT.BRAND,
          COLOR.TEXT,
          'lowercase font-medium leading-none tracking-tight',
          isFooterScale ? TEXT_SIZE.HEADLINE : TEXT_SIZE.TITLE,
        )}
      >
        {BRAND_LOGO.WORDMARK}
      </span>
    </>
  );

  const lockupClass = cn('inline-flex items-center gap-2.5', className);

  if (href === false) {
    return <span className={lockupClass}>{lockup}</span>;
  }

  return (
    <Link
      href={href}
      className={cn(
        lockupClass,
        'hover:opacity-80 transition-opacity duration-[var(--duration-fast)]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm',
      )}
      aria-label={BRAND_LOGO.LINK_ARIA}
    >
      {lockup}
    </Link>
  );
}
