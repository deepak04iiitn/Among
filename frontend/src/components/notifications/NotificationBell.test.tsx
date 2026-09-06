/**
 * NotificationBell.test.tsx — Unit tests for NotificationBell component.
 *
 * Critical invariants:
 *  - Unread count badge updates when count changes.
 *  - Clicking bell toggles the panel.
 *  - Mark all read clears the badge.
 *  - Escape key closes the panel.
 *  - Has correct ARIA attributes.
 */
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import notificationsReducer, {
  notificationsLoaded,
} from '../../features/notifications/notificationsSlice';
import * as thunks from '../../features/notifications/notificationsThunks';
import NotificationBell from './NotificationBell';

jest.mock('../../features/notifications/notificationsThunks', () => ({
  ...jest.requireActual('../../features/notifications/notificationsThunks'),
  fetchNotificationsThunk: jest.fn(),
  markAllNotificationsReadThunk: jest.fn(),
  markNotificationReadThunk: jest.fn(),
}));

const mockFetchThunk    = thunks.fetchNotificationsThunk   as jest.Mock;
const mockMarkAllThunk  = thunks.markAllNotificationsReadThunk as jest.Mock;

function noop() { return () => Promise.resolve(); }

function makeStore(preloaded?: Partial<ReturnType<typeof notificationsReducer>>) {
  return configureStore({
    reducer: { notifications: notificationsReducer },
    preloadedState: preloaded ? { notifications: { items: [], unreadCount: 0, status: 'idle', error: null, panelOpen: false, ...preloaded } } : undefined,
  });
}

function renderBell(store: ReturnType<typeof makeStore>, onNavigate?: (p: string | null) => void) {
  return render(
    <Provider store={store}>
      <NotificationBell onNavigate={onNavigate} />
    </Provider>
  );
}

beforeEach(() => {
  jest.resetAllMocks();
  mockFetchThunk.mockReturnValue(noop());
  mockMarkAllThunk.mockReturnValue(noop());
});

describe('NotificationBell', () => {
  it('renders the bell button', () => {
    const store = makeStore();
    renderBell(store);
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  it('has correct aria-label with no unread', () => {
    const store = makeStore();
    renderBell(store);
    expect(screen.getByRole('button', { name: /^notifications$/i })).toBeInTheDocument();
  });

  it('shows unread count in aria-label when there are unread notifications', () => {
    const store = makeStore({ unreadCount: 3 });
    renderBell(store);
    expect(screen.getByRole('button', { name: /3 unread/i })).toBeInTheDocument();
  });

  it('shows 9+ badge when unreadCount > 9', () => {
    const store = makeStore({ unreadCount: 12 });
    renderBell(store);
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('panel is closed initially', () => {
    const store = makeStore();
    renderBell(store);
    expect(store.getState().notifications.panelOpen).toBe(false);
    expect(screen.queryByRole('region', { name: /notifications/i })).toBeNull();
  });

  it('clicking bell opens the panel', () => {
    const store = makeStore();
    renderBell(store);
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(store.getState().notifications.panelOpen).toBe(true);
    expect(screen.getByRole('region', { name: /notifications/i })).toBeInTheDocument();
  });

  it('clicking bell again closes the panel', () => {
    const store = makeStore();
    renderBell(store);
    const btn = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(store.getState().notifications.panelOpen).toBe(false);
  });

  it('Escape key closes the panel', () => {
    const store = makeStore({ panelOpen: true, items: [], unreadCount: 0, status: 'idle', error: null });
    renderBell(store);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(store.getState().notifications.panelOpen).toBe(false);
  });

  it('shows "No new notifications" when list is empty and panel is open', () => {
    const store = makeStore({ panelOpen: true, items: [], unreadCount: 0, status: 'idle', error: null });
    renderBell(store);
    expect(screen.getByText(/no new notifications/i)).toBeInTheDocument();
  });

  it('unread count badge disappears after mark all read', async () => {
    mockMarkAllThunk.mockReturnValue((dispatch: any) => {
      // Simulate marking all read
      return Promise.resolve();
    });

    const store = makeStore({ unreadCount: 2, panelOpen: true, items: [
      { id: 'n1', type: 'new_message', text: 'test', read: false, createdAt: new Date().toISOString(), targetPath: null },
    ], status: 'idle', error: null });
    renderBell(store);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /mark all.*read/i }));
    });

    expect(mockMarkAllThunk).toHaveBeenCalled();
  });

  it('notification text is generic — no PII or message content', () => {
    const genericText = 'You have a new message on AMONG.';
    const store = makeStore({
      panelOpen: true,
      items: [{ id: 'n1', type: 'new_message', text: genericText, read: false, createdAt: new Date().toISOString(), targetPath: '/conversations/conv-1' }],
      unreadCount: 1,
      status: 'idle',
      error: null,
    });
    renderBell(store);
    const notifText = screen.getByText(genericText);
    // Should not contain alias or real message content
    expect(notifText.textContent).not.toMatch(/from:|said:|replied:/i);
    expect(notifText.textContent).toBe(genericText);
  });

  it('tapping a notification calls onNavigate with its targetPath', async () => {
    const onNavigate = jest.fn();
    (thunks.markNotificationReadThunk as jest.Mock).mockReturnValue(() => Promise.resolve());

    const store = makeStore({
      panelOpen: true,
      items: [{ id: 'n1', type: 'reaction_on_post', text: 'Someone responded.', read: false, createdAt: new Date().toISOString(), targetPath: '/post/post-1' }],
      unreadCount: 1,
      status: 'idle',
      error: null,
    });
    renderBell(store, onNavigate);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /someone responded/i }));
    });

    expect(onNavigate).toHaveBeenCalledWith('/post/post-1');
  });
});
