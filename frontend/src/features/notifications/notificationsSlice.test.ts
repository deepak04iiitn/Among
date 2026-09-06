import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../../store/rootReducer';
import {
  notificationsLoading,
  notificationsLoaded,
  notificationsError,
  notificationReceived,
  notificationRead,
  allNotificationsRead,
  panelOpened,
  panelClosed,
  panelToggled,
  notificationsCleared,
  selectNotifications,
  selectUnreadCount,
  selectNotificationsStatus,
  selectPanelOpen,
  type Notification,
} from './notificationsSlice';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({ reducer: rootReducer });
}
/** Silence unused import warning — reducer is used by rootReducer */

const mockNotification = (overrides?: Partial<Notification>): Notification => ({
  id: 'n1',
  type: 'system',
  text: 'You have a new message on AMONG',
  read: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  targetPath: null,
  ...overrides,
});

// ─── Initial state ────────────────────────────────────────────────────────────

describe('notificationsSlice — initial state', () => {
  it('has empty items', () => {
    const store = makeStore();
    expect(selectNotifications(store.getState())).toEqual([]);
  });

  it('has unreadCount of 0', () => {
    const store = makeStore();
    expect(selectUnreadCount(store.getState())).toBe(0);
  });

  it('has status idle', () => {
    const store = makeStore();
    expect(selectNotificationsStatus(store.getState())).toBe('idle');
  });

  it('has panelOpen false', () => {
    const store = makeStore();
    expect(selectPanelOpen(store.getState())).toBe(false);
  });
});

// ─── Loading ──────────────────────────────────────────────────────────────────

describe('notificationsLoading', () => {
  it('sets status to loading', () => {
    const store = makeStore();
    store.dispatch(notificationsLoading());
    expect(selectNotificationsStatus(store.getState())).toBe('loading');
  });
});

// ─── Loaded ───────────────────────────────────────────────────────────────────

describe('notificationsLoaded', () => {
  it('sets items and calculates unreadCount', () => {
    const store = makeStore();
    const items = [
      mockNotification({ id: 'n1', read: false }),
      mockNotification({ id: 'n2', read: true }),
      mockNotification({ id: 'n3', read: false }),
    ];
    store.dispatch(notificationsLoaded(items));
    expect(selectNotifications(store.getState())).toEqual(items);
    expect(selectUnreadCount(store.getState())).toBe(2);
    expect(selectNotificationsStatus(store.getState())).toBe('idle');
  });

  it('unreadCount is 0 when all are read', () => {
    const store = makeStore();
    store.dispatch(notificationsLoaded([
      mockNotification({ id: 'n1', read: true }),
    ]));
    expect(selectUnreadCount(store.getState())).toBe(0);
  });
});

// ─── Error ────────────────────────────────────────────────────────────────────

describe('notificationsError', () => {
  it('sets status to error with message', () => {
    const store = makeStore();
    store.dispatch(notificationsError('Network failure'));
    expect(selectNotificationsStatus(store.getState())).toBe('error');
  });
});

// ─── notificationReceived ─────────────────────────────────────────────────────

describe('notificationReceived', () => {
  it('prepends the notification to items', () => {
    const store = makeStore();
    const first = mockNotification({ id: 'n1' });
    const second = mockNotification({ id: 'n2' });
    store.dispatch(notificationsLoaded([first]));
    store.dispatch(notificationReceived(second));
    const items = selectNotifications(store.getState());
    expect(items[0]?.id).toBe('n2'); // prepended
    expect(items[1]?.id).toBe('n1');
  });

  it('increments unreadCount for unread notification', () => {
    const store = makeStore();
    store.dispatch(notificationReceived(mockNotification({ read: false })));
    expect(selectUnreadCount(store.getState())).toBe(1);
  });

  it('does not increment unreadCount for already-read notification', () => {
    const store = makeStore();
    store.dispatch(notificationReceived(mockNotification({ read: true })));
    expect(selectUnreadCount(store.getState())).toBe(0);
  });
});

// ─── notificationRead ─────────────────────────────────────────────────────────

describe('notificationRead', () => {
  it('marks item as read and decrements unreadCount', () => {
    const store = makeStore();
    const n = mockNotification({ id: 'n1', read: false });
    store.dispatch(notificationsLoaded([n]));
    store.dispatch(notificationRead('n1'));
    expect(selectUnreadCount(store.getState())).toBe(0);
    expect(selectNotifications(store.getState())[0]?.read).toBe(true);
  });

  it('does nothing for unknown notification id', () => {
    const store = makeStore();
    store.dispatch(notificationsLoaded([mockNotification({ id: 'n1', read: false })]));
    store.dispatch(notificationRead('unknown'));
    expect(selectUnreadCount(store.getState())).toBe(1);
  });

  it('does not double-decrement if already read', () => {
    const store = makeStore();
    const n = mockNotification({ id: 'n1', read: true });
    store.dispatch(notificationsLoaded([n]));
    store.dispatch(notificationRead('n1'));
    expect(selectUnreadCount(store.getState())).toBe(0);
  });
});

// ─── allNotificationsRead ─────────────────────────────────────────────────────

describe('allNotificationsRead', () => {
  it('marks all items as read and sets unreadCount to 0', () => {
    const store = makeStore();
    store.dispatch(notificationsLoaded([
      mockNotification({ id: 'n1', read: false }),
      mockNotification({ id: 'n2', read: false }),
    ]));
    store.dispatch(allNotificationsRead());
    expect(selectUnreadCount(store.getState())).toBe(0);
    selectNotifications(store.getState()).forEach((n) => {
      expect(n.read).toBe(true);
    });
  });
});

// ─── Panel state ─────────────────────────────────────────────────────────────

describe('panel actions', () => {
  it('panelOpened sets panelOpen to true', () => {
    const store = makeStore();
    store.dispatch(panelOpened());
    expect(selectPanelOpen(store.getState())).toBe(true);
  });

  it('panelClosed sets panelOpen to false', () => {
    const store = makeStore();
    store.dispatch(panelOpened());
    store.dispatch(panelClosed());
    expect(selectPanelOpen(store.getState())).toBe(false);
  });

  it('panelToggled toggles from false to true', () => {
    const store = makeStore();
    store.dispatch(panelToggled());
    expect(selectPanelOpen(store.getState())).toBe(true);
  });

  it('panelToggled toggles from true to false', () => {
    const store = makeStore();
    store.dispatch(panelOpened());
    store.dispatch(panelToggled());
    expect(selectPanelOpen(store.getState())).toBe(false);
  });
});

// ─── notificationsCleared ─────────────────────────────────────────────────────

describe('notificationsCleared', () => {
  it('resets all state', () => {
    const store = makeStore();
    store.dispatch(notificationsLoaded([mockNotification({ read: false })]));
    store.dispatch(panelOpened());
    store.dispatch(notificationsCleared());
    expect(selectNotifications(store.getState())).toEqual([]);
    expect(selectUnreadCount(store.getState())).toBe(0);
    expect(selectPanelOpen(store.getState())).toBe(false);
    expect(selectNotificationsStatus(store.getState())).toBe('idle');
  });
});
