/**
 * useAnalytics.test.ts — Tests for the analytics React hook.
 */
import { renderHook } from '@testing-library/react';
import { useAnalytics } from './useAnalytics';
import * as analyticsClient from '../lib/analytics/analyticsClient';
import { ANALYTICS_EVENT } from '../constants/analyticsEvents';

jest.mock('../lib/analytics/analyticsClient', () => ({
  trackEvent: jest.fn(),
}));

const mockTrack = analyticsClient.trackEvent as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useAnalytics', () => {
  it('returns a track function', () => {
    const { result } = renderHook(() => useAnalytics());
    expect(typeof result.current.track).toBe('function');
  });

  it('track is fire-and-forget — does not return a promise', () => {
    const { result } = renderHook(() => useAnalytics());
    const ret = result.current.track({ eventType: ANALYTICS_EVENT.POST_CREATED });
    expect(ret).toBeUndefined();
  });

  it('calls trackEvent via setTimeout (deferred)', () => {
    const { result } = renderHook(() => useAnalytics());
    result.current.track({ eventType: ANALYTICS_EVENT.POST_CREATED });
    expect(mockTrack).not.toHaveBeenCalled(); // not yet
    jest.runAllTimers();
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'post_created' })
    );
  });

  it('track does not throw when trackEvent throws', () => {
    mockTrack.mockImplementationOnce(() => { throw new Error('fail'); });
    const { result } = renderHook(() => useAnalytics());
    expect(() => {
      result.current.track({ eventType: ANALYTICS_EVENT.POST_CREATED });
      jest.runAllTimers();
    }).not.toThrow();
  });
});
