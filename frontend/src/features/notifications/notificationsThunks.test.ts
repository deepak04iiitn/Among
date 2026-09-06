/**
 * notificationsThunks.test.ts — Unit tests for notification thunks.
 */
import * as api from '../../lib/notificationsApi';
import {
  fetchNotificationsThunk,
  markNotificationReadThunk,
  markAllNotificationsReadThunk,
} from './notificationsThunks';
import {
  notificationsLoading,
  notificationsLoaded,
  notificationsError,
  notificationRead,
  allNotificationsRead,
} from './notificationsSlice';

jest.mock('../../lib/notificationsApi');

const mockFetchUnread  = api.fetchUnreadNotifications as jest.Mock;
const mockMarkRead     = api.markNotificationRead     as jest.Mock;
const mockMarkAll      = api.markAllNotificationsRead as jest.Mock;

function makeDispatch() {
  const actions: unknown[] = [];
  const dispatch = (a: unknown) => { actions.push(a); return a; };
  return { dispatch, actions };
}

const SAMPLE_NOTIF = {
  id:            'notif-1',
  type:          'reaction_on_post' as const,
  referenceId:   'post-1',
  referenceType: 'post' as const,
  isRead:        false,
  genericText:   'Someone responded to your experience on AMONG.',
  createdAt:     new Date().toISOString(),
};

beforeEach(() => jest.resetAllMocks());

// ─── fetchNotificationsThunk ──────────────────────────────────────────────────

describe('fetchNotificationsThunk', () => {
  it('dispatches loading then loaded on success', async () => {
    mockFetchUnread.mockResolvedValueOnce({ notifications: [SAMPLE_NOTIF], cursor: null });
    const { dispatch, actions } = makeDispatch();
    await fetchNotificationsThunk()(dispatch as any);
    expect(actions[0]).toMatchObject(notificationsLoading());
    expect((actions[1] as { type: string }).type).toBe(notificationsLoaded.type);
  });

  it('maps type-based target paths correctly', async () => {
    mockFetchUnread.mockResolvedValueOnce({ notifications: [SAMPLE_NOTIF], cursor: null });
    const { dispatch, actions } = makeDispatch();
    await fetchNotificationsThunk()(dispatch as any);
    const loaded = actions[1] as { payload: Array<{ targetPath: string }> };
    expect(loaded.payload[0]!.targetPath).toContain('post-1');
  });

  it('dispatches error on API failure', async () => {
    mockFetchUnread.mockRejectedValueOnce(new Error('Network'));
    const { dispatch, actions } = makeDispatch();
    await fetchNotificationsThunk()(dispatch as any);
    expect((actions[1] as { type: string }).type).toBe(notificationsError.type);
  });
});

// ─── markNotificationReadThunk ────────────────────────────────────────────────

describe('markNotificationReadThunk', () => {
  it('dispatches notificationRead optimistically', async () => {
    mockMarkRead.mockResolvedValueOnce(undefined);
    const { dispatch, actions } = makeDispatch();
    await markNotificationReadThunk('notif-1')(dispatch as any);
    expect(actions[0]).toMatchObject(notificationRead('notif-1'));
  });

  it('tolerates API error gracefully', async () => {
    mockMarkRead.mockRejectedValueOnce(new Error('fail'));
    const { dispatch, actions } = makeDispatch();
    await expect(markNotificationReadThunk('notif-1')(dispatch as any)).resolves.not.toThrow();
    // Still dispatched optimistic update
    expect(actions[0]).toMatchObject(notificationRead('notif-1'));
  });
});

// ─── markAllNotificationsReadThunk ────────────────────────────────────────────

describe('markAllNotificationsReadThunk', () => {
  it('dispatches allNotificationsRead optimistically', async () => {
    mockMarkAll.mockResolvedValueOnce(undefined);
    const { dispatch, actions } = makeDispatch();
    await markAllNotificationsReadThunk()(dispatch as any);
    expect(actions[0]).toMatchObject(allNotificationsRead());
  });

  it('tolerates API error gracefully', async () => {
    mockMarkAll.mockRejectedValueOnce(new Error('fail'));
    const { dispatch, actions } = makeDispatch();
    await expect(markAllNotificationsReadThunk()(dispatch as any)).resolves.not.toThrow();
    expect(actions[0]).toMatchObject(allNotificationsRead());
  });
});
