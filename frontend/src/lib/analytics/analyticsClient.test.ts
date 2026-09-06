/**
 * analyticsClient.test.ts — Tests for frontend analytics event emitter.
 *
 * Critical invariants:
 *  - trackEvent never throws.
 *  - trackEvent does not include raw accountId or PII.
 *  - Fire-and-forget: no awaitable return value.
 *  - sendBeacon is preferred over fetch when available.
 *  - Unknown errors are silently swallowed.
 */
import { trackEvent } from './analyticsClient';
import { ANALYTICS_EVENT } from '../../constants/analyticsEvents';

const mockSendBeacon = jest.fn().mockReturnValue(true);

// Mock browser globals
Object.defineProperty(global, 'window', { value: {}, writable: true });
Object.defineProperty(global, 'navigator', {
  value: { sendBeacon: mockSendBeacon },
  writable: true,
});
Object.defineProperty(global, 'sessionStorage', {
  value: {
    getItem:    jest.fn().mockReturnValue(null),
    setItem:    jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('trackEvent', () => {
  it('never throws', () => {
    expect(() => {
      trackEvent({ eventType: ANALYTICS_EVENT.POST_CREATED });
    }).not.toThrow();
  });

  it('uses sendBeacon when available', () => {
    trackEvent({ eventType: ANALYTICS_EVENT.POST_CREATED });
    expect(mockSendBeacon).toHaveBeenCalledWith(
      '/api/analytics/events',
      expect.any(String)
    );
  });

  it('payload never includes raw accountId or email', () => {
    trackEvent({
      eventType: ANALYTICS_EVENT.POST_CREATED,
      metadata:  { postId: 'p123' },
    });
    const payloadStr = mockSendBeacon.mock.calls[0]?.[1] as string;
    expect(payloadStr).not.toContain('accountId');
    expect(payloadStr).not.toContain('email');
    expect(payloadStr).not.toContain('firebaseUid');
  });

  it('includes eventType in the payload', () => {
    trackEvent({ eventType: ANALYTICS_EVENT.REACTION_SET });
    const payloadStr = mockSendBeacon.mock.calls[0]?.[1] as string;
    expect(payloadStr).toContain('reaction_set');
  });

  it('includes sessionId in the payload', () => {
    trackEvent({ eventType: ANALYTICS_EVENT.POST_CREATED });
    const payloadStr = mockSendBeacon.mock.calls[0]?.[1] as string;
    expect(payloadStr).toContain('sessionId');
  });

  it('does not throw when sendBeacon is unavailable', () => {
    const originalNav = global.navigator;
    Object.defineProperty(global, 'navigator', {
      value: {}, writable: true,
    });
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;
    expect(() => {
      trackEvent({ eventType: ANALYTICS_EVENT.POST_CREATED });
    }).not.toThrow();
    Object.defineProperty(global, 'navigator', { value: originalNav, writable: true });
  });
});
