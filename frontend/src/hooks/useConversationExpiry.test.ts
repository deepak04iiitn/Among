/**
 * useConversationExpiry.test.ts — Unit tests for the expiry timer hook.
 */
import { renderHook, act } from '@testing-library/react';
import { useConversationExpiry } from './useConversationExpiry';
import type { ConversationDetail } from '../features/conversations/conversationsSlice';

// ─── Test data ────────────────────────────────────────────────────────────────

function makeConversation(overrides: Partial<ConversationDetail> = {}): ConversationDetail {
  return {
    id:                 'conv_1',
    contextCategoryId:  'loneliness',
    contextPostId:      null,
    state:              'active',
    myAliasSnapshot:    { aliasName: 'MyAlias', avatarSeed: 'seedM' },
    otherAliasSnapshot: { aliasName: 'OtherAlias', avatarSeed: 'seedO' },
    requestedAt:        new Date().toISOString(),
    matchedAt:          new Date().toISOString(),
    startedAt:          new Date().toISOString(),
    expiresAt:          null,
    endedAt:            null,
    endReason:          null,
    feedbackSubmitted:  false,
    transcriptVisible:  false,
    lastActivityAt:     new Date().toISOString(),
    ...overrides,
  } as ConversationDetail;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useConversationExpiry', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns no warnings for a fresh active conversation', () => {
    const conv = makeConversation({ lastActivityAt: new Date().toISOString() });
    const { result } = renderHook(() => useConversationExpiry(conv));
    expect(result.current.inactivityWarning).toBe(false);
    expect(result.current.maxDurationWarning).toBe(false);
  });

  it('returns inactivityWarning=true when past the warning threshold', () => {
    // last activity 26 minutes ago (> 25 min warning threshold)
    const lastActivityAt = new Date(Date.now() - 26 * 60 * 1000).toISOString();
    const conv = makeConversation({ lastActivityAt });
    const { result } = renderHook(() => useConversationExpiry(conv));
    expect(result.current.inactivityWarning).toBe(true);
  });

  it('returns inactivityWarning=false when below the warning threshold', () => {
    // last activity 10 minutes ago (< 25 min threshold)
    const lastActivityAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const conv = makeConversation({ lastActivityAt });
    const { result } = renderHook(() => useConversationExpiry(conv));
    expect(result.current.inactivityWarning).toBe(false);
  });

  it('returns maxDurationWarning=true when within 1 hour of expiry', () => {
    // expires in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const conv = makeConversation({ expiresAt });
    const { result } = renderHook(() => useConversationExpiry(conv));
    expect(result.current.maxDurationWarning).toBe(true);
    expect(result.current.minutesRemaining).toBeLessThanOrEqual(31);
    expect(result.current.minutesRemaining).toBeGreaterThan(28);
  });

  it('returns maxDurationWarning=false when more than 1 hour remaining', () => {
    // expires in 2 hours
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const conv = makeConversation({ expiresAt });
    const { result } = renderHook(() => useConversationExpiry(conv));
    expect(result.current.maxDurationWarning).toBe(false);
  });

  it('returns null for null conversation', () => {
    const { result } = renderHook(() => useConversationExpiry(null));
    expect(result.current.inactivityWarning).toBe(false);
    expect(result.current.maxDurationWarning).toBe(false);
    expect(result.current.minutesRemaining).toBeNull();
  });

  it('updates every 30 seconds', () => {
    const conv = makeConversation({ lastActivityAt: new Date().toISOString() });
    const { result } = renderHook(() => useConversationExpiry(conv));

    expect(result.current.inactivityWarning).toBe(false);

    // Advance time by 26 minutes → should trigger inactivity warning
    act(() => {
      jest.advanceTimersByTime(26 * 60 * 1000);
    });
    // After 26 min, hook updates every 30s, so after 26 min + 30s the timer fires
    act(() => {
      jest.advanceTimersByTime(30_000);
    });
    // Now > 25 min since last activity
    expect(result.current.inactivityWarning).toBe(true);
  });
});
