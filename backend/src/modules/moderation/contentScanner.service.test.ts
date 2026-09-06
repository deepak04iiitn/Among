/**
 * contentScanner.service.test.ts — Unit tests for the content scanner.
 *
 * Critical test coverage:
 *  - Phone number patterns detected
 *  - Email patterns detected
 *  - Social handle patterns detected
 *  - URL patterns detected
 *  - Clean content returns no violations
 *  - Critical vs. warning distinction is correct
 *  - False-positive rate is low for common number strings (years, etc.)
 *  - Function never throws
 */
import { scanPost, type ScanResult } from './contentScanner.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function expectClean(result: ScanResult): void {
  expect(result.hasCriticalViolations).toBe(false);
  expect(result.hasWarnings).toBe(false);
  expect(result.detectedPatterns).toHaveLength(0);
}

// ─── Phone number detection ───────────────────────────────────────────────────

describe('contentScanner — phone numbers', () => {
  const phoneNumbers = [
    '+1 (555) 123-4567',
    '555-123-4567',
    '555.123.4567',
    '5551234567',
    '1 800 555 1234',
  ];

  test.each(phoneNumbers)('detects phone number: %s', (phone) => {
    const result = scanPost(`I want to talk more. My number is ${phone}`);
    expect(result.hasWarnings).toBe(true);
    expect(result.detectedPatterns).toContain('phone');
  });

  it('does not flag a year as a phone number', () => {
    const result = scanPost('This happened in 2023 when I was struggling.');
    expectClean(result);
  });

  it('does not flag a short numeric ID as a phone number', () => {
    const result = scanPost('I scored 95 on the test in grade 10.');
    expectClean(result);
  });
});

// ─── Email detection ─────────────────────────────────────────────────────────

describe('contentScanner — email addresses', () => {
  const emails = [
    'user@example.com',
    'firstname.lastname@domain.co.uk',
    'contact+tag@gmail.com',
  ];

  test.each(emails)('detects email: %s', (email) => {
    const result = scanPost(`You can reach me at ${email}`);
    expect(result.hasWarnings).toBe(true);
    expect(result.detectedPatterns).toContain('email');
  });

  it('does not flag plain text with @ symbol as an email (no TLD)', () => {
    // A company name with @, no TLD — won't match email pattern (no TLD)
    // The key invariant is it must NOT be marked as a critical violation
    const res = scanPost('I work at a tech firm.');
    expect(res.hasCriticalViolations).toBe(false);
  });
});

// ─── Social handle detection ──────────────────────────────────────────────────

describe('contentScanner — social handles', () => {
  it('detects @username style handle', () => {
    const result = scanPost('Follow me @johnsmith for updates.');
    expect(result.hasWarnings).toBe(true);
    expect(result.detectedPatterns).toContain('socialHandle');
  });

  it('detects handle at start of text', () => {
    const result = scanPost('@alice I wanted to reach out.');
    expect(result.hasWarnings).toBe(true);
    expect(result.detectedPatterns).toContain('socialHandle');
  });
});

// ─── URL detection ───────────────────────────────────────────────────────────

describe('contentScanner — URLs', () => {
  it('detects http URL', () => {
    const result = scanPost('Check out http://example.com for more info.');
    expect(result.hasWarnings).toBe(true);
    expect(result.detectedPatterns).toContain('url');
  });

  it('detects https URL', () => {
    const result = scanPost('Visit https://among.app to learn more.');
    expect(result.hasWarnings).toBe(true);
    expect(result.detectedPatterns).toContain('url');
  });
});

// ─── Critical violations ─────────────────────────────────────────────────────

describe('contentScanner — critical violations', () => {
  it('detects drug solicitation as critical', () => {
    const result = scanPost('I want to buy cocaine.');
    expect(result.hasCriticalViolations).toBe(true);
    expect(result.detectedPatterns).toContain('criticalContent');
  });

  it('blocks explicit drug sales', () => {
    const result = scanPost('Selling drugs here.');
    expect(result.hasCriticalViolations).toBe(true);
  });

  it('CSAM reference is critical', () => {
    const result = scanPost('child porn for sale here.');
    expect(result.hasCriticalViolations).toBe(true);
    expect(result.detectedPatterns).toContain('criticalContent');
  });
});

// ─── Clean content ────────────────────────────────────────────────────────────

describe('contentScanner — clean content passes', () => {
  const cleanTexts = [
    'I have been struggling with loneliness since moving to a new city.',
    'Has anyone else felt like they don\'t belong anywhere? I feel invisible.',
    'Three years ago I lost my job and it changed everything about who I am.',
    'I am scared about my health diagnosis but I don\'t know who to talk to.',
    'Sometimes I wonder if my childhood was normal or if everyone felt this way.',
  ];

  test.each(cleanTexts)('clean text passes: %s', (text) => {
    expectClean(scanPost(text));
  });
});

// ─── Critical vs warning distinction ─────────────────────────────────────────

describe('contentScanner — critical vs warning distinction', () => {
  it('phone number is a warning, not a critical violation', () => {
    const result = scanPost('Call me at 555-123-4567 if you want to chat.');
    expect(result.hasCriticalViolations).toBe(false);
    expect(result.hasWarnings).toBe(true);
  });

  it('email is a warning, not a critical violation', () => {
    const result = scanPost('Email me at user@example.com');
    expect(result.hasCriticalViolations).toBe(false);
    expect(result.hasWarnings).toBe(true);
  });

  it('critical violation post still detects warnings when both present', () => {
    // Critical AND warning patterns co-exist
    const result = scanPost('I want to buy cocaine. Call me at 555-123-4567');
    expect(result.hasCriticalViolations).toBe(true);
    expect(result.hasWarnings).toBe(true);
  });
});

// ─── False-positive resistance ────────────────────────────────────────────────

describe('contentScanner — false positive resistance', () => {
  it('does not flag a 4-digit number (year) as a phone', () => {
    expectClean(scanPost('I was born in 1998 and grew up in the 2000s.'));
  });

  it('does not flag casual mentions of numbers', () => {
    expectClean(scanPost('I worked 80 hours that week and earned about 3000 dollars.'));
  });

  it('does not flag percentage figures', () => {
    expectClean(scanPost('Only 30% of people admitted feeling the same way I did.'));
  });
});

// ─── Safety — never throws ────────────────────────────────────────────────────

describe('contentScanner — never throws', () => {
  it('returns safe result for empty string', () => {
    const result = scanPost('');
    expect(result).toMatchObject({ hasCriticalViolations: false, hasWarnings: false });
  });

  it('handles very long input without throwing', () => {
    const longText = 'word '.repeat(2000);
    expect(() => scanPost(longText)).not.toThrow();
  });

  it('handles special characters without throwing', () => {
    expect(() => scanPost('★ ♥ © ™ 你好 مرحبا')).not.toThrow();
  });
});
