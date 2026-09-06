/**
 * Deterministic abstract avatar system for AMONG.
 *
 * Avatars are generated from a seed string (the alias seed) using a seeded PRNG.
 * The same seed ALWAYS produces the same avatar — alias rotation changes the seed.
 * Colors: neutral grays only, with an optional indigo dot (#4F46E5).
 * Never: faces, silhouettes, anything suggesting age, gender, or identity.
 *
 * Phase 2B spec: §7B.7
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarParams {
  shape: 0 | 1 | 2 | 3;          // 4 abstract geometric shapes
  rotation: number;                // 0–359 degrees
  primaryGrayIndex: 0 | 1 | 2 | 3;
  secondaryGrayIndex: 0 | 1 | 2 | 3;
  hasIndigoDot: boolean;
  patternIndex: 0 | 1 | 2 | 3 | 4 | 5;
}

// ─── Color palette ────────────────────────────────────────────────────────────
// Only neutral grays + optional indigo dot — never multi-color

const GRAY_PALETTE = ['#E8E8E8', '#D0D0D0', '#999999', '#555555'] as const;
const INDIGO_DOT   = '#4F46E5';

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────
// Fast, deterministic, sufficient for avatar generation.

function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s  = s + 0x6d2b79f5 | 0;
    let z = Math.imul(s ^ (s >>> 15), 1 | s);
    z = z + Math.imul(z ^ (z >>> 7), 61 | z) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Convert a string seed into a numeric seed for mulberry32 */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h  = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ─── Parameter generation ─────────────────────────────────────────────────────

export function seedToParams(seed: string): AvatarParams {
  const rand = mulberry32(hashSeed(seed));

  return {
    shape:              Math.floor(rand() * 4) as 0 | 1 | 2 | 3,
    rotation:           Math.floor(rand() * 360),
    primaryGrayIndex:   Math.floor(rand() * 4) as 0 | 1 | 2 | 3,
    secondaryGrayIndex: Math.floor(rand() * 4) as 0 | 1 | 2 | 3,
    hasIndigoDot:       rand() > 0.5,
    patternIndex:       Math.floor(rand() * 6) as 0 | 1 | 2 | 3 | 4 | 5,
  };
}

// ─── SVG path generators ──────────────────────────────────────────────────────
// Each shape produces an SVG string for a 48×48 viewBox.
// Sizes are mapped from the AvatarSize at render time.

interface ShapeOptions {
  primary:   string;  // fill color
  secondary: string;  // fill color for secondary element
  rotation:  number;
}

function shape0(opts: ShapeOptions): string {
  // A circle with an off-center inner circle
  return `
    <circle cx="24" cy="24" r="20" fill="${opts.primary}" />
    <circle cx="${16 + (opts.rotation % 16)}" cy="${16 + (opts.rotation % 12)}" r="8" fill="${opts.secondary}" />
  `;
}

function shape1(opts: ShapeOptions): string {
  // Two overlapping rectangles at different rotations
  const r1 = opts.rotation % 45;
  const r2 = (opts.rotation + 30) % 45;
  return `
    <rect x="8" y="12" width="28" height="16" rx="3" fill="${opts.primary}"
          transform="rotate(${r1}, 24, 20)" />
    <rect x="12" y="20" width="24" height="14" rx="3" fill="${opts.secondary}"
          transform="rotate(${r2}, 24, 27)" opacity="0.85" />
  `;
}

function shape2(opts: ShapeOptions): string {
  // Triangle inside a circle
  const offset = opts.rotation % 10;
  return `
    <circle cx="24" cy="24" r="20" fill="${opts.primary}" />
    <polygon
      points="${12 + offset},${34} ${24},${12} ${36 - offset},${34}"
      fill="${opts.secondary}"
    />
  `;
}

function shape3(opts: ShapeOptions): string {
  // Abstract diagonal slash with a small square
  const angle = (opts.rotation % 60) - 30;
  return `
    <rect x="10" y="6" width="8" height="36" rx="4" fill="${opts.primary}"
          transform="rotate(${angle}, 24, 24)" />
    <rect x="22" y="16" width="12" height="12" rx="2" fill="${opts.secondary}" />
  `;
}

const SHAPE_RENDERERS = [shape0, shape1, shape2, shape3] as const;

// ─── Avatar SVG string builder ────────────────────────────────────────────────

export function buildAvatarSvg(params: AvatarParams, size: number): string {
  const primary   = GRAY_PALETTE[params.primaryGrayIndex] ?? GRAY_PALETTE[0];
  const secondary = GRAY_PALETTE[params.secondaryGrayIndex] ?? GRAY_PALETTE[1];
  const renderer  = SHAPE_RENDERERS[params.shape] ?? SHAPE_RENDERERS[0];
  const shapeSvg  = renderer({ primary, secondary, rotation: params.rotation });

  const indigoDot = params.hasIndigoDot
    ? `<circle cx="40" cy="8" r="4" fill="${INDIGO_DOT}" />`
    : '';

  return `<svg
    xmlns="http://www.w3.org/2000/svg"
    width="${size}"
    height="${size}"
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <rect width="48" height="48" rx="24" fill="${GRAY_PALETTE[0]}" />
    ${shapeSvg}
    ${indigoDot}
  </svg>`;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

export const AVATAR_SIZE_PX: Record<AvatarSize, number> = {
  sm: 24,   // inline / nav
  md: 40,   // cards, conversation context
  lg: 96,   // alias reveal
};

// ─── Public helpers ───────────────────────────────────────────────────────────

/**
 * Generate avatar SVG markup from a seed string.
 * Returns a raw SVG string suitable for dangerouslySetInnerHTML or a data URI.
 */
export function generateAvatarSvg(seed: string, size: AvatarSize = 'md'): string {
  const params = seedToParams(seed);
  const px     = AVATAR_SIZE_PX[size];
  return buildAvatarSvg(params, px);
}

/**
 * Convert a raw SVG string to a data URI for use in <img src="..."> tags.
 */
export function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg.trim());
  return `data:image/svg+xml,${encoded}`;
}
