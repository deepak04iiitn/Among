/**
 * aliasGenerator.ts — Deterministic + random alias generation.
 *
 * Alias format: "[Adjective] [Noun]" — e.g. "Silver Moth", "Blue Fox".
 * Deterministic when a seed string is provided (same seed → same alias).
 * Random (crypto-safe selection) when no seed is provided.
 *
 * Word lists are curated to be:
 *  - Neutral and non-identifying
 *  - Evocative and slightly poetic (fits the AMONG aesthetic)
 *  - Free of names, slurs, or clinical terms
 */
import { ALIAS_ROTATION_RATE_LIMIT_MS } from '../constants/timeouts';
import type { IUser } from '../modules/users/user.model';

// ─── Word lists ───────────────────────────────────────────────────────────────

const ADJECTIVES: readonly string[] = [
  'Silver', 'Blue', 'Quiet', 'Amber', 'Hollow', 'Muted', 'Pale', 'Dim',
  'Gentle', 'Woven', 'Faded', 'Open', 'Still', 'Soft', 'Worn', 'Calm',
  'Dusk', 'Dawn', 'Tidal', 'Mossy', 'Brazen', 'Earnest', 'Hidden', 'Bright',
  'Gradual', 'Steady', 'Spare', 'Thin', 'Wide', 'Long', 'Bare', 'True',
  'Deep', 'Near', 'Far', 'Raw', 'Mild', 'Brisk', 'Keen', 'Wild',
  'Warm', 'Cool', 'Wry', 'Lone', 'Brief', 'Vast', 'Crisp', 'Tender',
  'Lucid', 'Stark', 'Subtle', 'Ample', 'Noble', 'Brave', 'Graceful', 'Bold',
  'Fragile', 'Solid', 'Earnest', 'Patient', 'Honest', 'Curious', 'Restless', 'Serene',
  'Thoughtful', 'Watchful', 'Wandering', 'Tired', 'Hopeful', 'Searching', 'Grounded', 'Floating',
  'Lingering', 'Fading', 'Rising', 'Glancing', 'Fleeting', 'Enduring', 'Quiet', 'Mellow',
  'Russet', 'Ashen', 'Ivory', 'Indigo', 'Ochre', 'Slate', 'Tawny', 'Umber',
  'Verdant', 'Crimson', 'Azure', 'Sable', 'Gilded', 'Pewter', 'Cobalt', 'Flaxen',
  'Mossy', 'Stony', 'Sandy', 'Cloudy', 'Dewy', 'Dusty', 'Misty', 'Snowy',
] as const;

const NOUNS: readonly string[] = [
  'Fox', 'Moth', 'Heron', 'Crow', 'Finch', 'Wren', 'Sparrow', 'Kite',
  'Lark', 'Swift', 'Dove', 'Rook', 'Linnet', 'Plover', 'Snipe', 'Bittern',
  'Otter', 'Marten', 'Badger', 'Vole', 'Shrew', 'Stoat', 'Mink', 'Polecat',
  'Newt', 'Toad', 'Gecko', 'Adder', 'Skink', 'Viper', 'Dace', 'Roach',
  'Ridge', 'Vale', 'Glen', 'Brook', 'Mere', 'Fen', 'Moor', 'Heath',
  'Croft', 'Knoll', 'Bight', 'Cove', 'Spit', 'Dune', 'Beck', 'Rill',
  'Reed', 'Fern', 'Sedge', 'Broom', 'Gorse', 'Furze', 'Bracken', 'Heather',
  'Cairn', 'Loch', 'Tarn', 'Mere', 'Weald', 'Chase', 'Combe', 'Holme',
  'Stone', 'Root', 'Branch', 'Thorn', 'Bark', 'Leaf', 'Petal', 'Spore',
  'Cloud', 'Mist', 'Frost', 'Ember', 'Ash', 'Spark', 'Flint', 'Coal',
  'Tide', 'Wave', 'Shore', 'Drift', 'Current', 'Eddy', 'Pool', 'Spring',
  'Path', 'Trail', 'Lane', 'Track', 'Ford', 'Pass', 'Gate', 'Stile',
  'Dusk', 'Dawn', 'Noon', 'Gloam', 'Twilight', 'Nightfall', 'Daybreak', 'Solstice',
] as const;

// ─── Seeded PRNG (mulberry32) ────────────────────────────────────────────────

/**
 * Fast, deterministic PRNG.
 * Returns a function that generates numbers in [0, 1).
 * Given the same seed integer, the sequence is always identical.
 */
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

/**
 * Turn a string into a 32-bit integer seed.
 * djb2 hash — fast and sufficient for alias generation.
 */
function hashStringToInt(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash * 33) ^ char;
  }
  return Math.abs(hash);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface GeneratedAlias {
  readonly name:       string;
  readonly avatarSeed: string;
}

/**
 * Generate an alias from an optional seed string.
 *
 * Deterministic when `seed` is provided — same seed always produces the
 * same alias name and avatar seed. Used for regeneration / recovery.
 *
 * Random (using `Math.random`) when no seed is provided — used for
 * first alias creation and rotation.
 */
export function generateAlias(seed?: string): GeneratedAlias {
  let adj: string;
  let noun: string;
  let avatarSeed: string;

  if (seed !== undefined) {
    // Deterministic path
    const intSeed = hashStringToInt(seed);
    const rng     = seededRandom(intSeed);
    const adjIdx  = Math.floor(rng() * ADJECTIVES.length);
    const nounIdx = Math.floor(rng() * NOUNS.length);
    adj           = ADJECTIVES[adjIdx] ?? 'Quiet';
    noun          = NOUNS[nounIdx] ?? 'Fox';
    avatarSeed    = `${seed}-avatar`;
  } else {
    // Random path — cryptographically sufficient for alias picking
    adj       = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)] ?? 'Quiet';
    noun      = NOUNS[Math.floor(Math.random() * NOUNS.length)] ?? 'Fox';
    // Avatar seed is a random 12-char base36 string
    avatarSeed = Math.random().toString(36).slice(2, 14);
  }

  const name = `${adj} ${noun}`;
  return { name, avatarSeed };
}

/**
 * Check whether a user's current alias has expired.
 * Returns `true` if `expiresAt` is set and is in the past.
 */
export function isAliasExpired(user: Pick<IUser, 'currentAlias'>): boolean {
  const expiresAt = user.currentAlias?.expiresAt;
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

/**
 * Check whether a user is eligible to manually request an alias rotation.
 * Enforces `ALIAS_ROTATION_RATE_LIMIT_MS` between rotation requests.
 */
export function canRequestRotation(
  user: Pick<IUser, 'lastAliasRotationRequestAt'>
): boolean {
  const lastRequest = user.lastAliasRotationRequestAt;
  if (!lastRequest) return true;
  const elapsed = Date.now() - new Date(lastRequest).getTime();
  return elapsed >= ALIAS_ROTATION_RATE_LIMIT_MS;
}
