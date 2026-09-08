/**
 * avatarGenerator.ts — Deterministic abstract geometric avatar parameters.
 *
 * Backend counterpart to `frontend/src/utils/avatarUtils.ts`.
 * Generates the same abstract params from the same seed so the
 * frontend can render a deterministic SVG without a round-trip.
 *
 * Color palette: dried-rose accent + warm linen neutrals (no rainbow palette).
 * Shapes: abstract geometric — NO faces, NO silhouettes, NO human-suggestive forms.
 */

// ─── Approved color palette ───────────────────────────────────────────────────
// Warm fills from docs/theme.md §7 Avatars + optional single rose accent dot.

const APPROVED_FILL_COLORS: readonly string[] = [
  '#E0D6C8', // color-border
  '#C9B9A8', // color-border-strong
  '#6F6960', // color-text-muted
  '#4F4A44', // color-text-secondary
] as const;

const ACCENT_DOT = '#9B5360'; // color-accent

// ─── Shape types ──────────────────────────────────────────────────────────────
// All abstract — never any humanoid or face-like forms.

export const AVATAR_SHAPE = {
  CIRCLE_OFFSET:      0, // Circle with off-center inner circle
  DOUBLE_RECT:        1, // Two overlapping rectangles at different rotations
  TRIANGLE_IN_CIRCLE: 2, // Triangle inside a circle
  DIAGONAL_SLASH:     3, // Abstract diagonal slash with small square
} as const;

export type AvatarShape = (typeof AVATAR_SHAPE)[keyof typeof AVATAR_SHAPE];

// ─── Output type ─────────────────────────────────────────────────────────────

export interface AvatarData {
  readonly shape:        AvatarShape;
  readonly rotation:     number;   // 0–359 degrees
  readonly primaryColor: string;   // from APPROVED_FILL_COLORS
  readonly secondColor:  string;   // from APPROVED_FILL_COLORS
  readonly hasIndigoDot: boolean;
  readonly patternIndex: number;   // 0–5 — determines minor variation within shape
  readonly seed:         string;   // the original seed — for caching / re-generation
}

// ─── Seeded PRNG (mulberry32 — matches aliasGenerator.ts) ────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToInt(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash * 33) ^ char;
  }
  return Math.abs(hash);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate deterministic abstract avatar parameters from a seed string.
 * Same seed → same params → same rendered SVG.
 * Different seeds → statistically distinguishable results.
 */
export function generateAvatarData(seed: string): AvatarData {
  const intSeed = hashStringToInt(seed);
  const rng     = seededRandom(intSeed);

  const shapeCount   = Object.keys(AVATAR_SHAPE).length;
  const shape        = Math.floor(rng() * shapeCount) as AvatarShape;
  const rotation     = Math.floor(rng() * 360);
  const primaryIdx   = Math.floor(rng() * APPROVED_FILL_COLORS.length);
  const secondIdx    = Math.floor(rng() * APPROVED_FILL_COLORS.length);
  const hasIndigoDot = rng() > 0.6; // 40% chance of rose accent dot
  const patternIndex = Math.floor(rng() * 6);

  return {
    shape,
    rotation,
    primaryColor: APPROVED_FILL_COLORS[primaryIdx] ?? '#E0D6C8',
    secondColor:  APPROVED_FILL_COLORS[secondIdx]  ?? '#C9B9A8',
    hasIndigoDot,
    patternIndex,
    seed,
  };
}

/**
 * Returns all approved fill colors — used for testing that generated
 * colors are from the allowed palette.
 */
export function getApprovedColors(): readonly string[] {
  return [...APPROVED_FILL_COLORS, ACCENT_DOT];
}
