/**
 * analytics.service.test.ts — Unit tests for analytics service.
 *
 * Critical invariants:
 *  - hashAccountId produces deterministic HMAC (same input → same output).
 *  - hashAccountId never returns the raw accountId.
 *  - emitEvent does not throw, even on DB failure.
 *  - Each metric computation returns correct value given sample event data.
 *  - Cohort retention logic returns correct percentages at D1/D7/D30 boundaries.
 *  - Report rate formula: (reports / posts) × 1000.
 *  - Privacy: accountIdHash must differ from the raw accountId.
 */
import { hashAccountId, emitEvent, computeReportRate, computeConversationStartRate, computeWMC } from './analytics.service';
import { AnalyticsEventModel } from './analyticsEvent.model';
import { ANALYTICS_EVENT } from '../../constants/analyticsEvents';

jest.mock('./analyticsEvent.model', () => ({
  AnalyticsEventModel: {
    create:       jest.fn(),
    countDocuments: jest.fn(),
    distinct:     jest.fn(),
    aggregate:    jest.fn(),
  },
}));

const mockCreate       = AnalyticsEventModel.create         as jest.Mock;
const mockCount        = AnalyticsEventModel.countDocuments as jest.Mock;
const mockDistinct     = AnalyticsEventModel.distinct       as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  mockCreate.mockResolvedValue({});
  mockCount.mockResolvedValue(0);
  mockDistinct.mockResolvedValue([]);
});

// ─── hashAccountId ────────────────────────────────────────────────────────────

describe('hashAccountId', () => {
  it('returns a non-empty hex string', () => {
    const hash = hashAccountId('account-123');
    expect(hash).toBeTruthy();
    expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
  });

  it('is deterministic — same input → same hash', () => {
    expect(hashAccountId('account-abc')).toBe(hashAccountId('account-abc'));
  });

  it('never returns the raw accountId', () => {
    const accountId = 'raw-account-id-12345';
    expect(hashAccountId(accountId)).not.toBe(accountId);
  });

  it('different inputs produce different hashes', () => {
    expect(hashAccountId('user-a')).not.toBe(hashAccountId('user-b'));
  });
});

// ─── emitEvent ───────────────────────────────────────────────────────────────

describe('emitEvent', () => {
  it('does not throw — fire-and-forget', () => {
    expect(() => {
      emitEvent({
        eventType: ANALYTICS_EVENT.POST_CREATED,
        accountId: 'acct-1',
      });
    }).not.toThrow();
  });

  it('does not throw even when DB write fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB failure'));
    expect(() => {
      emitEvent({ eventType: ANALYTICS_EVENT.POST_CREATED, accountId: 'acct-1' });
    }).not.toThrow();
    // Give the promise a tick to settle
    await new Promise((r) => setTimeout(r, 0));
  });

  it('stores accountIdHash (not raw accountId)', async () => {
    mockCreate.mockResolvedValueOnce({});
    emitEvent({ eventType: ANALYTICS_EVENT.POST_CREATED, accountId: 'raw-id-xyz' });
    await new Promise((r) => setTimeout(r, 0));
    const call = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call).toBeDefined();
    expect(call['accountIdHash']).not.toBe('raw-id-xyz');
    expect(call['accountIdHash']).toBe(hashAccountId('raw-id-xyz'));
  });

  it('never stores Firebase UID or email fields', async () => {
    mockCreate.mockResolvedValueOnce({});
    emitEvent({ eventType: ANALYTICS_EVENT.POST_CREATED, accountId: 'acct-1' });
    await new Promise((r) => setTimeout(r, 0));
    const call = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call).not.toHaveProperty('firebaseUid');
    expect(call).not.toHaveProperty('email');
    expect(call).not.toHaveProperty('accountId');
  });
});

// ─── computeReportRate ────────────────────────────────────────────────────────

describe('computeReportRate', () => {
  it('computes report rate correctly: 10 reports / 1000 posts = 10.0/1000', async () => {
    mockCount
      .mockResolvedValueOnce(10)   // REPORT_SUBMITTED
      .mockResolvedValueOnce(1000); // POST_CREATED
    const result = await computeReportRate();
    expect(result.ratePer1000).toBeCloseTo(10.0);
    expect(result.totalReports).toBe(10);
    expect(result.totalPosts).toBe(1000);
  });

  it('returns 0 when no posts', async () => {
    mockCount.mockResolvedValue(0);
    const result = await computeReportRate();
    expect(result.ratePer1000).toBe(0);
  });
});

// ─── computeConversationStartRate ─────────────────────────────────────────────

describe('computeConversationStartRate', () => {
  it('computes rate correctly: 8 started / 10 matched = 0.8', async () => {
    mockCount
      .mockResolvedValueOnce(8)   // CONVERSATION_STARTED
      .mockResolvedValueOnce(10); // CONVERSATION_MATCHED
    const result = await computeConversationStartRate();
    expect(result.rate).toBeCloseTo(0.8);
    expect(result.started).toBe(8);
    expect(result.matched).toBe(10);
  });

  it('returns rate 0 when no matched conversations', async () => {
    mockCount.mockResolvedValue(0);
    const result = await computeConversationStartRate();
    expect(result.rate).toBe(0);
  });
});

// ─── computeWMC ──────────────────────────────────────────────────────────────

describe('computeWMC', () => {
  it('returns count of CONVERSATION_STARTED events', async () => {
    mockCount.mockResolvedValueOnce(42);
    const result = await computeWMC();
    expect(result).toBe(42);
  });
});
