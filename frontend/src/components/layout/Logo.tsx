import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '../../constants/routes';

interface LogoProps {
  /** Pixel height of the logo image (width scales proportionally). Default: 28 */
  height?: number;
  /** Wraps the logo in a Link — pass false to render as a plain <span> */
  href?: string | false;
  /** Extra Tailwind classes on the wrapping element */
  className?: string;
}

/**
 * AMONG brand logo — uses the actual logo image from /public.
 * Renders as a Next.js <Image> with correct intrinsic dimensions.
 * Wraps in a <Link> by default; pass href={false} to suppress the link.
 */
export default function Logo({ height = 28, href = ROUTES.LANDING, className = '' }: LogoProps) {
  // The source image is 612×408 px (~3:2 ratio, icon-over-wordmark lockup). Compute width from height.
  const aspectRatio = 612 / 408;
  const width = Math.round(height * aspectRatio);

  const img = (
    <Image
      src="/Among_Logo.png"
      alt="AMONG"
      width={width}
      height={height}
      priority
      className="object-contain select-none"
    />
  );

  if (href === false) {
    return (
      <span className={`inline-flex items-center ${className}`} aria-label="AMONG">
        {img}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center hover:opacity-75 transition-opacity duration-[var(--duration-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm ${className}`}
      aria-label="AMONG — go to home"
    >
      {img}
    </Link>
  );
}
