import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../../store/rootReducer';
import {
  conversationsLoading,
  conversationsLoaded,
  conversationsError,
  activeConversationSet,
  messagesLoading,
  messagesLoaded,
  messageReceived,
  conversationStateUpdated,
  unreadCleared,
  messageSending,
  messageSent,
  messageSendError,
  selectConversationsList,
  selectActiveConversationId,
  selectConversationsStatus,
  selectMessagesStatus,
  selectTotalUnread,
  selectConversationById,
  selectMessages,
  type Conversation,
  type Message,
} from './conversationsSlice';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

const mockConversation = (overrides?: Partial<Conversation>): Conversation => ({
  id: 'conv1',
  experienceCategoryId: 'loneliness',
  experienceCategoryLabel: 'Loneliness',
  otherPartyAlias: { name: 'Red Owl', avatarSeed: 'seed-a' },
  state: 'active',
  startedAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-03T00:00:00.000Z',
  unreadCount: 0,
  ...overrides,
});

const mockMessage = (overrides?: Partial<Message>): Message => ({
  id: 'm1',
  body: 'Hello.',
  senderAlias: { name: 'Red Owl', avatarSeed: 'seed-a' },
  isOwn: false,
  sentAt: '2026-01-01T00:00:00.000Z',
  contactInfoWarning: false,
  ...overrides,
});

// ─── Initial state ────────────────────────────────────────────────────────────

describe('conversationsSlice — initial state', () => {
  it('has empty list', () => {
    const store = makeStore();
    expect(selectConversationsList(store.getState())).toEqual([]);
  });

  it('has null activeConversationId', () => {
    const store = makeStore();
    expect(selectActiveConversationId(store.getState())).toBeNull();
  });

  it('has idle listStatus', () => {
    const store = makeStore();
    expect(selectConversationsStatus(store.getState())).toBe('idle');
  });

  it('has totalUnread of 0', () => {
    const store = makeStore();
    expect(selectTotalUnread(store.getState())).toBe(0);
  });
});

// ─── Loading / loaded / error ─────────────────────────────────────────────────

describe('conversationsLoading', () => {
  it('sets listStatus to loading', () => {
    const store = makeStore();
    store.dispatch(conversationsLoading());
    expect(selectConversationsStatus(store.getState())).toBe('loading');
  });
});

describe('conversationsLoaded', () => {
  it('stores conversation list and resets status', () => {
    const store = makeStore();
    const list = [mockConversation(), mockConversation({ id: 'conv2' })];
    store.dispatch(conversationsLoaded(list));
    expect(selectConversationsList(store.getState())).toEqual(list);
    expect(selectConversationsStatus(store.getState())).toBe('idle');
  });
});

describe('conversationsError', () => {
  it('sets listStatus to error', () => {
    const store = makeStore();
    store.dispatch(conversationsError('Timeout'));
    expect(selectConversationsStatus(store.getState())).toBe('error');
  });
});

// ─── Active conversation ──────────────────────────────────────────────────────

describe('activeConversationSet', () => {
  it('sets activeConversationId', () => {
    const store = makeStore();
    store.dispatch(activeConversationSet('conv1'));
    expect(selectActiveConversationId(store.getState())).toBe('conv1');
  });

  it('can be set to null', () => {
    const store = makeStore();
    store.dispatch(activeConversationSet('conv1'));
    store.dispatch(activeConversationSet(null));
    expect(selectActiveConversationId(store.getState())).toBeNull();
  });
});

// ─── Messages ─────────────────────────────────────────────────────────────────

describe('messagesLoading', () => {
  it('sets messagesStatus to loading', () => {
    const store = makeStore();
    store.dispatch(messagesLoading());
    expect(selectMessagesStatus(store.getState())).toBe('loading');
  });
});

describe('messagesLoaded', () => {
  it('stores messages for a conversation', () => {
    const store = makeStore();
    const msgs = [mockMessage({ id: 'm1' }), mockMessage({ id: 'm2' })];
    store.dispatch(messagesLoaded({ conversationId: 'conv1', messages: msgs, cursor: null, append: false }));
    expect(selectMessages('conv1')(store.getState())).toEqual(msgs);
  });

  it('prepends older messages when append = true', () => {
    const store = makeStore();
    store.dispatch(messagesLoaded({
      conversationId: 'conv1',
      messages: [mockMessage({ id: 'm2' })],
      cursor: null,
      append: false,
    }));
    store.dispatch(messagesLoaded({
      conversationId: 'conv1',
      messages: [mockMessage({ id: 'm1' })],
      cursor: null,
      append: true,
    }));
    const msgs = selectMessages('conv1')(store.getState());
    expect(msgs[0]?.id).toBe('m1'); // older prepended
    expect(msgs[1]?.id).toBe('m2');
  });

  it('selectMessages returns empty array for unknown conversationId', () => {
    const store = makeStore();
    expect(selectMessages('unknown')(store.getState())).toEqual([]);
  });
});

// ─── messageReceived ──────────────────────────────────────────────────────────

describe('messageReceived', () => {
  it('appends message to conversation', () => {
    const store = makeStore();
    store.dispatch(messagesLoaded({ conversationId: 'conv1', messages: [], cursor: null, append: false }));
    store.dispatch(messageReceived({ conversationId: 'conv1', message: mockMessage({ id: 'm1' }) }));
    expect(selectMessages('conv1')(store.getState())).toHaveLength(1);
  });

  it('increments unreadCount for non-active conversation', () => {
    const store = makeStore();
    const conv = mockConversation({ id: 'conv1', unreadCount: 0 });
    store.dispatch(conversationsLoaded([conv]));
    store.dispatch(activeConversationSet('conv2')); // different active
    store.dispatch(messageReceived({ conversationId: 'conv1', message: mockMessage() }));
    expect(selectTotalUnread(store.getState())).toBe(1);
  });

  it('does not increment unreadCount for active conversation', () => {
    const store = makeStore();
    const conv = mockConversation({ id: 'conv1', unreadCount: 0 });
    store.dispatch(conversationsLoaded([conv]));
    store.dispatch(activeConversationSet('conv1'));
    store.dispatch(messageReceived({ conversationId: 'conv1', message: mockMessage() }));
    expect(selectTotalUnread(store.getState())).toBe(0);
  });
});

// ─── conversationStateUpdated ─────────────────────────────────────────────────

describe('conversationStateUpdated', () => {
  it('updates state on the matching conversation', () => {
    const store = makeStore();
    store.dispatch(conversationsLoaded([mockConversation({ id: 'conv1', state: 'active' })]));
    store.dispatch(conversationStateUpdated({ conversationId: 'conv1', newState: 'expired' }));
    expect(selectConversationById('conv1')(store.getState())?.state).toBe('expired');
  });

  it('does nothing for unknown conversation', () => {
    const store = makeStore();
    store.dispatch(conversationsLoaded([mockConversation({ id: 'conv1', state: 'active' })]));
    store.dispatch(conversationStateUpdated({ conversationId: 'unknown', newState: 'expired' }));
    expect(selectConversationById('conv1')(store.getState())?.state).toBe('active');
  });
});

// ─── unreadCleared ────────────────────────────────────────────────────────────

describe('unreadCleared', () => {
  it('resets unreadCount to 0 for the conversation', () => {
    const store = makeStore();
    store.dispatch(conversationsLoaded([mockConversation({ id: 'conv1', unreadCount: 5 })]));
    store.dispatch(unreadCleared('conv1'));
    expect(selectConversationById('conv1')(store.getState())?.unreadCount).toBe(0);
    expect(selectTotalUnread(store.getState())).toBe(0);
  });
});

// ─── Message send states ──────────────────────────────────────────────────────

describe('messageSending / messageSent / messageSendError', () => {
  it('messageSending sets messagesStatus to sending', () => {
    const store = makeStore();
    store.dispatch(messageSending());
    expect(selectMessagesStatus(store.getState())).toBe('sending');
  });

  it('messageSent resets messagesStatus to idle', () => {
    const store = makeStore();
    store.dispatch(messageSending());
    store.dispatch(messageSent());
    expect(selectMessagesStatus(store.getState())).toBe('idle');
  });

  it('messageSendError sets messagesStatus to error', () => {
    const store = makeStore();
    store.dispatch(messageSendError('Send failed'));
    expect(selectMessagesStatus(store.getState())).toBe('error');
  });
});

// ─── selectTotalUnread ────────────────────────────────────────────────────────

describe('selectTotalUnread', () => {
  it('sums unreadCount across all conversations', () => {
    const store = makeStore();
    store.dispatch(conversationsLoaded([
      mockConversation({ id: 'c1', unreadCount: 3 }),
      mockConversation({ id: 'c2', unreadCount: 5 }),
    ]));
    expect(selectTotalUnread(store.getState())).toBe(8);
  });

  it('returns 0 when no conversations', () => {
    const store = makeStore();
    expect(selectTotalUnread(store.getState())).toBe(0);
  });
});

// ─── selectConversationById ───────────────────────────────────────────────────

describe('selectConversationById', () => {
  it('returns the matching conversation', () => {
    const store = makeStore();
    const conv = mockConversation({ id: 'conv1' });
    store.dispatch(conversationsLoaded([conv]));
    expect(selectConversationById('conv1')(store.getState())).toEqual(conv);
  });

  it('returns undefined for unknown id', () => {
    const store = makeStore();
    expect(selectConversationById('unknown')(store.getState())).toBeUndefined();
  });
});
