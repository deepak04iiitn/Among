/**
 * conversationsThunks.test.ts — Unit tests for conversation Redux thunks.
 */
import { configureStore } from '@reduxjs/toolkit';
import conversationsReducer from './conversationsSlice';
import * as conversationsApi from '../../lib/conversationsApi';
import {
  requestMatchThunk,
  cancelMatchRequestThunk,
  fetchConversationsThunk,
  sendMessageThunk,
  fetchMessagesThunk,
  handleMatchFoundThunk,
  handleMatchExpiredThunk,
} from './conversationsThunks';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../lib/conversationsApi');
const mockedApi = conversationsApi as jest.Mocked<typeof conversationsApi>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({ reducer: { conversations: conversationsReducer } });
}

type Store = ReturnType<typeof makeStore>;

// ─── Test data ────────────────────────────────────────────────────────────────

const CONV_ID = 'conv_1';

const makeConvListItem = () => ({
  id:                 CONV_ID,
  contextCategoryId:  'loneliness',
  state:              'active',
  otherAliasSnapshot: { aliasName: 'OtherAlias', avatarSeed: 'seedO' },
  startedAt:          new Date().toISOString(),
  endedAt:            null,
  lastActivityAt:     new Date().toISOString(),
});

const makeMessage = (id = 'msg_1') => ({
  id,
  senderAliasSnapshot: 'Alias A',
  senderAvatarSeed:    'seedA',
  body:                'Hello',
  contactInfoWarning:  false,
  sentAt:              new Date().toISOString(),
  isDeleted:           false,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => jest.clearAllMocks());

describe('requestMatchThunk', () => {
  it('sets matchingState to searching when match not found', async () => {
    mockedApi.createMatchRequest.mockResolvedValueOnce({
      matched: false,
      conversationId: CONV_ID,
      state: 'requested',
    });

    const store: Store = makeStore();
    await store.dispatch(requestMatchThunk({ contextCategoryId: 'loneliness' }) as ReturnType<typeof requestMatchThunk>);

    expect(store.getState().conversations.matchingState).toBe('searching');
    expect(store.getState().conversations.matchingRequestId).toBe(CONV_ID);
  });

  it('sets matchingState to matched when match found immediately', async () => {
    mockedApi.createMatchRequest.mockResolvedValueOnce({
      matched: true,
      conversationId: CONV_ID,
      state: 'matched_pending',
    });

    const store: Store = makeStore();
    await store.dispatch(requestMatchThunk({ contextCategoryId: 'loneliness' }) as ReturnType<typeof requestMatchThunk>);

    expect(store.getState().conversations.matchingState).toBe('matched');
    expect(store.getState().conversations.activeConversationId).toBe(CONV_ID);
  });

  it('sets error on API failure', async () => {
    mockedApi.createMatchRequest.mockRejectedValueOnce({
      response: { data: { error: { message: 'Daily limit reached' } } },
    });

    const store: Store = makeStore();
    await store.dispatch(requestMatchThunk({ contextCategoryId: 'loneliness' }) as ReturnType<typeof requestMatchThunk>);

    expect(store.getState().conversations.error).toBe('Daily limit reached');
  });
});

describe('cancelMatchRequestThunk', () => {
  it('resets matching state', async () => {
    mockedApi.cancelMatchRequest.mockResolvedValueOnce();

    const store: Store = makeStore();
    // First set to searching
    await store.dispatch(requestMatchThunk({ contextCategoryId: 'loneliness' }) as ReturnType<typeof requestMatchThunk>);
    mockedApi.createMatchRequest.mockResolvedValueOnce({ matched: false, conversationId: CONV_ID, state: 'requested' });

    // Cancel
    await store.dispatch(cancelMatchRequestThunk(CONV_ID) as ReturnType<typeof cancelMatchRequestThunk>);
    expect(store.getState().conversations.matchingState).toBe('idle');
    expect(store.getState().conversations.matchingRequestId).toBeNull();
  });
});

describe('fetchConversationsThunk', () => {
  it('loads conversation list into state', async () => {
    mockedApi.listConversations.mockResolvedValueOnce([makeConvListItem()]);

    const store: Store = makeStore();
    await store.dispatch(fetchConversationsThunk() as ReturnType<typeof fetchConversationsThunk>);

    expect(store.getState().conversations.list).toHaveLength(1);
    expect(store.getState().conversations.list[0]?.id).toBe(CONV_ID);
  });
});

describe('sendMessageThunk', () => {
  it('adds sent message to state', async () => {
    mockedApi.sendMessageHttp.mockResolvedValueOnce({
      message:           makeMessage(),
      contactInfoWarning: false,
      isNewWarning:       false,
    });

    const store: Store = makeStore();
    await store.dispatch(sendMessageThunk(CONV_ID, 'Hello') as ReturnType<typeof sendMessageThunk>);

    const messages = store.getState().conversations.messages[CONV_ID];
    expect(messages).toHaveLength(1);
    expect(messages?.[0]?.body).toBe('Hello');
  });

  it('shows contactInfoWarning when isNewWarning=true', async () => {
    mockedApi.sendMessageHttp.mockResolvedValueOnce({
      message:           makeMessage(),
      contactInfoWarning: true,
      isNewWarning:       true,
    });

    const store: Store = makeStore();
    await store.dispatch(sendMessageThunk(CONV_ID, 'Call +1 555 123 4567') as ReturnType<typeof sendMessageThunk>);

    expect(store.getState().conversations.contactInfoWarning).toBe(true);
  });

  it('does not show contactInfoWarning when isNewWarning=false', async () => {
    mockedApi.sendMessageHttp.mockResolvedValueOnce({
      message:           makeMessage(),
      contactInfoWarning: true,
      isNewWarning:       false, // already warned for this category
    });

    const store: Store = makeStore();
    await store.dispatch(sendMessageThunk(CONV_ID, 'Call +1 555 123 4567') as ReturnType<typeof sendMessageThunk>);

    expect(store.getState().conversations.contactInfoWarning).toBe(false);
  });
});

describe('fetchMessagesThunk', () => {
  it('loads messages into state', async () => {
    mockedApi.getMessages.mockResolvedValueOnce({
      messages:   [makeMessage()],
      nextCursor: null,
    });

    const store: Store = makeStore();
    await store.dispatch(fetchMessagesThunk(CONV_ID) as ReturnType<typeof fetchMessagesThunk>);

    expect(store.getState().conversations.messages[CONV_ID]).toHaveLength(1);
  });

  it('appends messages when append=true', async () => {
    const first  = makeMessage('msg_1');
    const second = makeMessage('msg_0');

    mockedApi.getMessages.mockResolvedValueOnce({ messages: [first], nextCursor: 'cursor_1' });
    mockedApi.getMessages.mockResolvedValueOnce({ messages: [second], nextCursor: null });

    const store: Store = makeStore();
    await store.dispatch(fetchMessagesThunk(CONV_ID) as ReturnType<typeof fetchMessagesThunk>);
    await store.dispatch(fetchMessagesThunk(CONV_ID, { cursor: 'cursor_1', append: true }) as ReturnType<typeof fetchMessagesThunk>);

    // append: true prepends older messages to the front
    const msgs = store.getState().conversations.messages[CONV_ID] ?? [];
    expect(msgs).toHaveLength(2);
  });
});

describe('socket event handlers', () => {
  it('handleMatchFoundThunk sets matched state', () => {
    const store: Store = makeStore();
    store.dispatch(handleMatchFoundThunk(CONV_ID));
    expect(store.getState().conversations.matchingState).toBe('matched');
    expect(store.getState().conversations.activeConversationId).toBe(CONV_ID);
  });

  it('handleMatchExpiredThunk sets no_match state', () => {
    const store: Store = makeStore();
    store.dispatch(handleMatchExpiredThunk());
    expect(store.getState().conversations.matchingState).toBe('no_match');
    expect(store.getState().conversations.matchingRequestId).toBeNull();
  });
});
