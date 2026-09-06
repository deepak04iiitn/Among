import {
  generateAlias,
  isAliasExpired,
  canRequestRotation,
} from './aliasGenerator';
import { ALIAS_ROTATION_RATE_LIMIT_MS } from '../constants/timeouts';

describe('generateAlias', () => {
  // ─── Deterministic behaviour ──────────────────────────────────────────────

  it('returns the same alias for the same seed', () => {
    const a1 = generateAlias('test-seed-42');
    const a2 = generateAlias('test-seed-42');
    expect(a1.name).toBe(a2.name);
    expect(a1.avatarSeed).toBe(a2.avatarSeed);
  });

  it('returns different aliases for different seeds', () => {
    const a1 = generateAlias('seed-alpha');
    const a2 = generateAlias('seed-beta');
    // Statistically extremely unlikely to collide
    expect(a1.name).not.toBe(a2.name);
  });

  it('deterministic path uses seed in avatarSeed', () => {
    const alias = generateAlias('my-seed');
    expect(alias.avatarSeed).toContain('my-seed');
  });

  // ─── Random behaviour ─────────────────────────────────────────────────────

  it('returns a result when called without a seed', () => {
    const alias = generateAlias();
    expect(alias.name).toBeTruthy();
    expect(alias.avatarSeed).toBeTruthy();
  });

  it('random calls produce varied results (statistical)', () => {
    const names = new Set<string>();
    for (let i = 0; i < 30; i++) {
      names.add(generateAlias().name);
    }
    // At least 10 distinct names out of 30 calls
    expect(names.size).toBeGreaterThan(10);
  });

  // ─── Format ───────────────────────────────────────────────────────────────

  it('returns "Adjective Noun" format', () => {
    for (let i = 0; i < 10; i++) {
      const { name } = generateAlias();
      const parts = name.split(' ');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toBeTruthy();
      expect(parts[1]).toBeTruthy();
    }
  });

  it('alias name contains only word characters and spaces', () => {
    for (let i = 0; i < 10; i++) {
      const { name } = generateAlias();
      expect(name).toMatch(/^[A-Za-z]+ [A-Za-z]+$/);
    }
  });
});

describe('isAliasExpired', () => {
  it('returns false when expiresAt is null', () => {
    expect(isAliasExpired({ currentAlias: { name: 'A', avatarSeed: 's', issuedAt: new Date(), expiresAt: null } })).toBe(false);
  });

  it('returns false when expiresAt is in the future', () => {
    const future = new Date(Date.now() + 60_000);
    expect(isAliasExpired({ currentAlias: { name: 'A', avatarSeed: 's', issuedAt: new Date(), expiresAt: future } })).toBe(false);
  });

  it('returns true when expiresAt is in the past', () => {
    const past = new Date(Date.now() - 60_000);
    expect(isAliasExpired({ currentAlias: { name: 'A', avatarSeed: 's', issuedAt: new Date(), expiresAt: past } })).toBe(true);
  });

  it('returns false when currentAlias is null', () => {
    expect(isAliasExpired({ currentAlias: null })).toBe(false);
  });
});

describe('canRequestRotation', () => {
  it('returns true when lastAliasRotationRequestAt is null', () => {
    expect(canRequestRotation({ lastAliasRotationRequestAt: null })).toBe(true);
  });

  it('returns false when last rotation was less than rate limit ago', () => {
    const recent = new Date(Date.now() - (ALIAS_ROTATION_RATE_LIMIT_MS / 2));
    expect(canRequestRotation({ lastAliasRotationRequestAt: recent })).toBe(false);
  });

  it('returns true when last rotation was exactly at the rate limit boundary', () => {
    const atBoundary = new Date(Date.now() - ALIAS_ROTATION_RATE_LIMIT_MS);
    expect(canRequestRotation({ lastAliasRotationRequestAt: atBoundary })).toBe(true);
  });

  it('returns true when last rotation was more than rate limit ago', () => {
    const longAgo = new Date(Date.now() - (ALIAS_ROTATION_RATE_LIMIT_MS + 60_000));
    expect(canRequestRotation({ lastAliasRotationRequestAt: longAgo })).toBe(true);
  });
});
