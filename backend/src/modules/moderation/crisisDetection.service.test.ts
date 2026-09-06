/**
 * crisisDetection.service.test.ts — Unit tests for crisis detection.
 *
 * CRITICAL coverage requirements (PRD §6.4, §9.3):
 *  - Explicit self-harm phrases ARE detected
 *  - General sadness / distress language is NOT detected (false-positive prevention)
 *  - Crisis result includes correct crisisType
 *  - Function NEVER throws — always returns a safe result
 */
import { detectCrisisContent } from './crisisDetection.service';

// ─── Self-harm detection ──────────────────────────────────────────────────────

describe('crisisDetection — self-harm intent', () => {
  const selfHarmPhrases = [
    'I am going to kill myself tonight',
    'I want to harm myself',
    'I am planning to end my life',
    'I will take my own life',
    'I\'m about to overdose on pills',
    'I have a suicide plan',
    'I don\'t want to be here anymore',
    'I am not wanting to exist anymore',
  ];

  test.each(selfHarmPhrases)('detects explicit self-harm: "%s"', (phrase) => {
    const result = detectCrisisContent(phrase);
    expect(result.isCrisis).toBe(true);
    expect(result.crisisType).toBe('self_harm');
  });
});

// ─── Harm-to-others detection ─────────────────────────────────────────────────

describe('crisisDetection — harm-to-others intent', () => {
  const harmPhrases = [
    'I am going to hurt them',
    'I want to kill someone',
    'I am planning to shoot people',
    'I will harm her when I see her',
  ];

  test.each(harmPhrases)('detects harm-to-others intent: "%s"', (phrase) => {
    const result = detectCrisisContent(phrase);
    expect(result.isCrisis).toBe(true);
    expect(result.crisisType).toBe('harm_to_others');
  });
});

// ─── General sadness / distress — must NOT trigger ───────────────────────────

describe('crisisDetection — general distress does NOT trigger (anti-false-positive)', () => {
  const distressTexts = [
    'I feel really sad and I don\'t know why.',
    'I have been struggling with depression for years.',
    'Sometimes I wish things were different in my life.',
    'I feel so lonely and hopeless about my future.',
    'I cried for hours after what happened.',
    'I am exhausted and I feel like I can\'t keep going at work.',
    'I miss him so much it hurts.',
    'I was hurt deeply by what she said.',
    'I want things to change so badly.',
    'Life feels meaningless some days.',
    'I am having a really hard time right now.',
    'I feel trapped in my situation.',
    'I used to self-harm years ago but I got help.',
    'I read about suicide prevention today at work.',
  ];

  test.each(distressTexts)('general distress is NOT crisis: "%s"', (text) => {
    const result = detectCrisisContent(text);
    expect(result.isCrisis).toBe(false);
  });
});

// ─── Safe result for clean content ───────────────────────────────────────────

describe('crisisDetection — clean content', () => {
  it('returns isCrisis: false for unrelated content', () => {
    const result = detectCrisisContent('I started a new job and I am nervous but excited.');
    expect(result.isCrisis).toBe(false);
    expect(result.crisisType).toBeNull();
  });

  it('returns isCrisis: false for empty string', () => {
    const result = detectCrisisContent('');
    expect(result.isCrisis).toBe(false);
    expect(result.crisisType).toBeNull();
  });
});

// ─── Never throws (critical safety invariant) ────────────────────────────────

describe('crisisDetection — never throws', () => {
  it('handles empty string without throwing', () => {
    expect(() => detectCrisisContent('')).not.toThrow();
  });

  it('handles very long text without throwing', () => {
    const longText = 'I feel sad. '.repeat(1000);
    expect(() => detectCrisisContent(longText)).not.toThrow();
  });

  it('handles special characters without throwing', () => {
    expect(() => detectCrisisContent('♥ 你好 مرحبا ★ ©')).not.toThrow();
  });

  it('handles null-like inputs gracefully (coerced strings)', () => {
    expect(() => detectCrisisContent(String(null))).not.toThrow();
    expect(() => detectCrisisContent(String(undefined))).not.toThrow();
  });

  it('always returns a valid CrisisResult shape', () => {
    const result = detectCrisisContent('any text here');
    expect(result).toHaveProperty('isCrisis');
    expect(result).toHaveProperty('crisisType');
    expect(typeof result.isCrisis).toBe('boolean');
    expect(result.crisisType === null || typeof result.crisisType === 'string').toBe(true);
  });
});
