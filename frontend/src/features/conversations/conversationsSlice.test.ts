/**
 * conversationsSlice.test.ts — Unit tests for the conversations Redux slice.
 */
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../../store/rootReducer';
import conversationsReducer, {
  conversationsLoading,
  conversationsLoaded,
  conversationsError,
  conversationDetailLoaded,
  matchingStarted,
  matchingSucceeded,
  matchingFailed,
  matchingCancelled,
  activeConversationSet,
  messagesLoading,
  messagesLoaded,
  messageReceived,
  conversationStateUpdated,
  messageSending,
  messageSent,
  messageSendError,
  expiryWarningReceived,
  expiryWarningCleared,
  contactInfoWarningShown,
  contactInfoWarningDismissed,
  selectConversationsList,
  selectActiveConversationId,
  selectConversationsListStatus,
  selectMessagesStatus,
  selectMatchingState,
  selectMatchingRequestId,
  selectExpiryWarning,
  selectContactInfoWarning,
  selectConversationById,
  selectMessages,
  type ConversationListItem,
  type ConversationDetail,
  type PublicMessage,
} from './conversationsSlice';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

const mockConversation = (overrides?: Partial<ConversationListItem>): ConversationListItem => ({
  id:                 'conv1',
  contextCategoryId:  'loneliness',
  state:              'active',
  otherAliasSnapshot: { aliasName: 'Red Owl', avatarSeed: 'seed-a' },
  startedAt:          '2026-01-01T00:00:00.000Z',
  endedAt:            null,
  lastActivityAt:     '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const mockDetail = (overrides?: Partial<ConversationDetail>): ConversationDetail => ({
  id:                 'conv1',
  contextCategoryId:  'loneliness',
  contextPostId:      null,
  state:              'active',
  myAliasSnapshot:    { aliasName: 'My Alias', avatarSeed: 'seed-m' },
  otherAliasSnapshot: { aliasName: 'Red Owl', avatarSeed: 'seed-a' },
  requestedAt:        '2026-01-01T00:00:00.000Z',
  matchedAt:          '2026-01-01T00:01:00.000Z',
  startedAt:          '2026-01-01T00:02:00.000Z',
  expiresAt:          null,
  endedAt:            null,
  endReason:          null,
  feedbackSubmitted:  false,
  transcriptVisible:  false,
  ...overrides,
});

const mockMessage = (overrides?: Partial<PublicMessage>): PublicMessage => ({
  id:                  'm1',
  body:                'Hello.',
  senderAliasSnapshot: 'Red Owl',
  senderAvatarSeed:    'seed-a',
  contactInfoWarning:  false,
  sentAt:              '2026-01-01T00:00:00.000Z',
  isDeleted:           false,
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
    expect(selectConversationsListStatus(store.getState())).toBe('idle');
  });

  it('has idle matchingState', () => {
    const store = makeStore();
    expect(selectMatchingState(store.getState())).toBe('idle');
  });

  it('has no expiryWarning', () => {
    const store = makeStore();
    expect(selectExpiryWarning(store.getState())).toBeNull();
  });

  it('has contactInfoWarning=false', () => {
    const store = makeStore();
    expect(selectContactInfoWarning(store.getState())).toBe(false);
  });
});

// ─── List loading ─────────────────────────────────────────────────────────────

describe('conversationsLoading', () => {
  it('sets listStatus to loading', () => {
    const store = makeStore();
    store.dispatch(conversationsLoading());
    expect(selectConversationsListStatus(store.getState())).toBe('loading');
  });
});

describe('conversationsLoaded', () => {
  it('stores conversation list and resets status', () => {
    const store = makeStore();
    const list = [mockConversation(), mockConversation({ id: 'conv2' })];
    store.dispatch(conversationsLoaded(list));
    expect(selectConversationsList(store.getState())).toEqual(list);
    expect(selectConversationsListStatus(store.getState())).toBe('idle');
  });
});

describe('conversationsError', () => {
  it('sets listStatus to error', () => {
    const store = makeStore();
    store.dispatch(conversationsError('Timeout'));
    expect(selectConversationsListStatus(store.getState())).toBe('error');
  });
});

// ─── Detail ───────────────────────────────────────────────────────────────────

describe('conversationDetailLoaded', () => {
  it('sets activeDetail and activeConversationId', () => {
    const store = makeStore();
    const detail = mockDetail();
    store.dispatch(conversationDetailLoaded(detail));
    expect(store.getState().conversations.activeDetail?.id).toBe('conv1');
    expect(selectActiveConversationId(store.getState())).toBe('conv1');
  });
});

// ─── Matching ─────────────────────────────────────────────────────────────────

describe('matching reducers', () => {
  it('matchingStarted sets searching state with requestId', () => {
    const store = makeStore();
    store.dispatch(matchingStarted('req_1'));
    expect(selectMatchingState(store.getState())).toBe('searching');
    expect(selectMatchingRequestId(store.getState())).toBe('req_1');
  });

  it('matchingSucceeded sets matched and activeConversationId', () => {
    const store = makeStore();
    store.dispatch(matchingSucceeded('conv_match'));
    expect(selectMatchingState(store.getState())).toBe('matched');
    expect(selectActiveConversationId(store.getState())).toBe('conv_match');
  });

  it('matchingFailed sets no_match state', () => {
    const store = makeStore();
    store.dispatch(matchingStarted('req_1'));
    store.dispatch(matchingFailed());
    expect(selectMatchingState(store.getState())).toBe('no_match');
    expect(selectMatchingRequestId(store.getState())).toBeNull();
  });

  it('matchingCancelled resets matching state', () => {
    const store = makeStore();
    store.dispatch(matchingStarted('req_1'));
    store.dispatch(matchingCancelled());
    expect(selectMatchingState(store.getState())).toBe('idle');
    expect(selectMatchingRequestId(store.getState())).toBeNull();
  });
});

// ─── Active conversation ──────────────────────────────────────────────────────

describe('activeConversationSet', () => {
  it('sets activeConversationId', () => {
    const store = makeStore();
    store.dispatch(activeConversationSet('conv1'));
    expect(selectActiveConversationId(store.getState())).toBe('conv1');
  });

  it('clears detail and warnings when set to null', () => {
    const store = makeStore();
    store.dispatch(conversationDetailLoaded(mockDetail()));
    store.dispatch(expiryWarningReceived({ type: 'inactivity', conversationId: 'conv1' }));
    store.dispatch(contactInfoWarningShown());
    store.dispatch(activeConversationSet(null));

    expect(store.getState().conversations.activeDetail).toBeNull();
    expect(store.getState().conversations.expiryWarning).toBeNull();
    expect(store.getState().conversations.contactInfoWarning).toBe(false);
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

  it('prepends older messages when append=true', () => {
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
});

// ─── conversationStateUpdated ─────────────────────────────────────────────────

describe('conversationStateUpdated', () => {
  it('updates state on the matching conversation', () => {
    const store = makeStore();
    store.dispatch(conversationsLoaded([mockConversation({ id: 'conv1', state: 'active' })]));
    store.dispatch(conversationStateUpdated({ conversationId: 'conv1', newState: 'ended_by_user' }));
    expect(selectConversationById('conv1')(store.getState())?.state).toBe('ended_by_user');
  });

  it('does nothing for unknown conversation', () => {
    const store = makeStore();
    store.dispatch(conversationsLoaded([mockConversation({ id: 'conv1', state: 'active' })]));
    store.dispatch(conversationStateUpdated({ conversationId: 'unknown', newState: 'ended_by_user' }));
    expect(selectConversationById('conv1')(store.getState())?.state).toBe('active');
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

// ─── Expiry warnings ─────────────────────────────────────────────────────────

describe('expiryWarning reducers', () => {
  it('expiryWarningReceived stores warning', () => {
    const store = makeStore();
    store.dispatch(expiryWarningReceived({ type: 'inactivity', conversationId: 'conv1' }));
    const warning = selectExpiryWarning(store.getState());
    expect(warning?.type).toBe('inactivity');
    expect(warning?.conversationId).toBe('conv1');
  });

  it('expiryWarningCleared removes warning', () => {
    const store = makeStore();
    store.dispatch(expiryWarningReceived({ type: 'inactivity', conversationId: 'conv1' }));
    store.dispatch(expiryWarningCleared());
    expect(selectExpiryWarning(store.getState())).toBeNull();
  });
});

// ─── Contact info warning ─────────────────────────────────────────────────────

describe('contactInfoWarning reducers', () => {
  it('contactInfoWarningShown sets flag to true', () => {
    const store = makeStore();
    store.dispatch(contactInfoWarningShown());
    expect(selectContactInfoWarning(store.getState())).toBe(true);
  });

  it('contactInfoWarningDismissed resets flag', () => {
    const store = makeStore();
    store.dispatch(contactInfoWarningShown());
    store.dispatch(contactInfoWarningDismissed());
    expect(selectContactInfoWarning(store.getState())).toBe(false);
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
