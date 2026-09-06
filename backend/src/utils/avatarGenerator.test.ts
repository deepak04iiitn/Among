import {
  generateAvatarData,
  getApprovedColors,
  AVATAR_SHAPE,
} from './avatarGenerator';

describe('generateAvatarData', () => {
  // ─── Determinism ─────────────────────────────────────────────────────────

  it('returns the same params for the same seed', () => {
    const d1 = generateAvatarData('my-seed');
    const d2 = generateAvatarData('my-seed');
    expect(d1).toEqual(d2);
  });

  it('returns different params for different seeds', () => {
    const d1 = generateAvatarData('seed-one');
    const d2 = generateAvatarData('seed-two');
    // Statistically essentially impossible to be fully equal
    const same =
      d1.shape === d2.shape &&
      d1.rotation === d2.rotation &&
      d1.primaryColor === d2.primaryColor &&
      d1.hasIndigoDot === d2.hasIndigoDot;
    expect(same).toBe(false);
  });

  // ─── Output shape ────────────────────────────────────────────────────────

  it('returns the original seed in the result', () => {
    const result = generateAvatarData('test-seed');
    expect(result.seed).toBe('test-seed');
  });

  it('shape is one of the valid shape constants', () => {
    const validShapes = Object.values(AVATAR_SHAPE);
    for (let i = 0; i < 20; i++) {
      const { shape } = generateAvatarData(`seed-${i}`);
      expect(validShapes).toContain(shape);
    }
  });

  it('rotation is between 0 and 359 inclusive', () => {
    for (let i = 0; i < 20; i++) {
      const { rotation } = generateAvatarData(`r-seed-${i}`);
      expect(rotation).toBeGreaterThanOrEqual(0);
      expect(rotation).toBeLessThan(360);
    }
  });

  it('patternIndex is between 0 and 5 inclusive', () => {
    for (let i = 0; i < 20; i++) {
      const { patternIndex } = generateAvatarData(`p-seed-${i}`);
      expect(patternIndex).toBeGreaterThanOrEqual(0);
      expect(patternIndex).toBeLessThanOrEqual(5);
    }
  });

  it('hasIndigoDot is a boolean', () => {
    const result = generateAvatarData('dot-test');
    expect(typeof result.hasIndigoDot).toBe('boolean');
  });

  // ─── Color palette compliance ────────────────────────────────────────────

  it('primaryColor is from the approved palette', () => {
    const approved = getApprovedColors();
    for (let i = 0; i < 20; i++) {
      const { primaryColor } = generateAvatarData(`c-seed-${i}`);
      expect(approved).toContain(primaryColor);
    }
  });

  it('secondColor is from the approved palette', () => {
    const approved = getApprovedColors();
    for (let i = 0; i < 20; i++) {
      const { secondColor } = generateAvatarData(`s-seed-${i}`);
      expect(approved).toContain(secondColor);
    }
  });

  it('colors are hex strings starting with #', () => {
    const { primaryColor, secondColor } = generateAvatarData('hex-test');
    expect(primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(secondColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  // ─── No humanoid descriptors ─────────────────────────────────────────────
  // The approved shapes are abstract — none of these words should appear
  // in any shape type value.

  it('shape type names contain no humanoid or face-like terms', () => {
    const shapeValues = Object.values(AVATAR_SHAPE);
    const humanoidTerms = ['face', 'head', 'person', 'human', 'body', 'eye', 'mouth'];
    for (const value of shapeValues) {
      for (const term of humanoidTerms) {
        expect(String(value).toLowerCase()).not.toContain(term);
      }
    }
  });

  // ─── Statistical variety ─────────────────────────────────────────────────

  it('20 random seeds produce at least 3 distinct shapes', () => {
    const shapes = new Set<number>();
    for (let i = 0; i < 20; i++) {
      shapes.add(generateAvatarData(`variety-${i}`).shape);
    }
    expect(shapes.size).toBeGreaterThanOrEqual(3);
  });
});
