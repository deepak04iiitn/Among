import {
  seedToParams,
  buildAvatarSvg,
  generateAvatarSvg,
  svgToDataUri,
  AVATAR_SIZE_PX,
  type AvatarParams,
} from './avatarUtils';

describe('avatarUtils', () => {
  describe('seedToParams', () => {
    it('returns an AvatarParams object with valid values', () => {
      const params = seedToParams('test-seed');
      expect([0, 1, 2, 3]).toContain(params.shape);
      expect(params.rotation).toBeGreaterThanOrEqual(0);
      expect(params.rotation).toBeLessThan(360);
      expect([0, 1, 2, 3]).toContain(params.primaryGrayIndex);
      expect([0, 1, 2, 3]).toContain(params.secondaryGrayIndex);
      expect(typeof params.hasIndigoDot).toBe('boolean');
      expect([0, 1, 2, 3, 4, 5]).toContain(params.patternIndex);
    });

    it('is deterministic — same seed produces same params', () => {
      const p1 = seedToParams('blue-fox');
      const p2 = seedToParams('blue-fox');
      expect(p1).toEqual(p2);
    });

    it('different seeds produce different params', () => {
      const p1 = seedToParams('seed-a');
      const p2 = seedToParams('seed-b');
      // With very high probability, at least one field differs
      const same = JSON.stringify(p1) === JSON.stringify(p2);
      expect(same).toBe(false);
    });

    it('handles empty string seed', () => {
      expect(() => seedToParams('')).not.toThrow();
    });

    it('handles long seed strings', () => {
      const longSeed = 'a'.repeat(1000);
      expect(() => seedToParams(longSeed)).not.toThrow();
    });

    it('handles unicode characters in seed', () => {
      expect(() => seedToParams('🦊 Blue Fox 🌙')).not.toThrow();
    });
  });

  describe('buildAvatarSvg', () => {
    const params: AvatarParams = {
      shape:              0,
      rotation:           45,
      primaryGrayIndex:   0,
      secondaryGrayIndex: 2,
      hasIndigoDot:       true,
      patternIndex:       1,
    };

    it('returns a string containing SVG markup', () => {
      const svg = buildAvatarSvg(params, 40);
      expect(typeof svg).toBe('string');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    it('sets width and height to the provided size', () => {
      const svg = buildAvatarSvg(params, 96);
      expect(svg).toContain('width="96"');
      expect(svg).toContain('height="96"');
    });

    it('includes indigo dot when hasIndigoDot is true', () => {
      const svg = buildAvatarSvg({ ...params, hasIndigoDot: true }, 40);
      expect(svg).toContain('#4F46E5');
    });

    it('does not include indigo dot when hasIndigoDot is false', () => {
      const svg = buildAvatarSvg({ ...params, hasIndigoDot: false }, 40);
      expect(svg).not.toContain('#4F46E5');
    });

    it('is deterministic for the same params and size', () => {
      const svg1 = buildAvatarSvg(params, 40);
      const svg2 = buildAvatarSvg(params, 40);
      expect(svg1).toBe(svg2);
    });

    it('includes aria-hidden attribute', () => {
      const svg = buildAvatarSvg(params, 40);
      expect(svg).toContain('aria-hidden="true"');
    });

    it('includes focusable="false"', () => {
      const svg = buildAvatarSvg(params, 40);
      expect(svg).toContain('focusable="false"');
    });
  });

  describe('generateAvatarSvg', () => {
    it('generates SVG for a given seed', () => {
      const svg = generateAvatarSvg('silver-moth');
      expect(svg).toContain('<svg');
    });

    it('uses the correct size for sm', () => {
      const svg = generateAvatarSvg('seed', 'sm');
      expect(svg).toContain(`width="${AVATAR_SIZE_PX.sm}"`);
    });

    it('uses the correct size for md (default)', () => {
      const svg = generateAvatarSvg('seed');
      expect(svg).toContain(`width="${AVATAR_SIZE_PX.md}"`);
    });

    it('uses the correct size for lg', () => {
      const svg = generateAvatarSvg('seed', 'lg');
      expect(svg).toContain(`width="${AVATAR_SIZE_PX.lg}"`);
    });
  });

  describe('svgToDataUri', () => {
    it('returns a data URI string', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"></svg>';
      const uri = svgToDataUri(svg);
      expect(uri).toMatch(/^data:image\/svg\+xml,/);
    });

    it('URL-encodes the SVG content', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"></svg>';
      const uri = svgToDataUri(svg);
      expect(uri).not.toContain('<svg');
      expect(uri).toContain('%3Csvg');
    });
  });

  describe('AVATAR_SIZE_PX', () => {
    it('has correct pixel values', () => {
      expect(AVATAR_SIZE_PX.sm).toBe(24);
      expect(AVATAR_SIZE_PX.md).toBe(40);
      expect(AVATAR_SIZE_PX.lg).toBe(96);
    });
  });

  describe('determinism guarantee', () => {
    it('20 different seeds produce 20 visually distinct SVGs', () => {
      const seeds = Array.from({ length: 20 }, (_, i) => `seed-${i}`);
      const svgs = seeds.map((s) => generateAvatarSvg(s));
      const unique = new Set(svgs);
      expect(unique.size).toBe(20);
    });
  });
});
