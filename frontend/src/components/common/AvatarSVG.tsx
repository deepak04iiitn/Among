import { seedToParams, buildAvatarSvg, AVATAR_SIZE_PX, type AvatarSize } from '../../utils/avatarUtils';

interface AvatarSVGProps {
  /** The alias seed — deterministically maps to the same avatar every time */
  seed: string;
  size?: AvatarSize;
  /** Accessible label — the alias name the avatar represents */
  aliasName: string;
  className?: string;
}

/**
 * Abstract geometric avatar — rendered as inline SVG.
 *
 * - Deterministic: same seed → same avatar.
 * - No faces, no silhouettes — abstract shapes + neutral grays + optional indigo dot.
 * - Sizes: sm=24px (inline/nav), md=40px (cards), lg=96px (alias reveal).
 * - aria-label and role="img" for accessibility.
 *
 * Phase 2B spec: §7B.7
 */
export default function AvatarSVG({
  seed,
  size = 'md',
  aliasName,
  className = '',
}: AvatarSVGProps) {
  const params = seedToParams(seed);
  const px     = AVATAR_SIZE_PX[size];
  const svgStr = buildAvatarSvg(params, px);

  return (
    <div
      role="img"
      aria-label={aliasName}
      className={[
        'inline-block rounded-full overflow-hidden flex-shrink-0',
        className,
      ].join(' ')}
      style={{ width: px, height: px }}
      dangerouslySetInnerHTML={{ __html: svgStr }}
    />
  );
}
