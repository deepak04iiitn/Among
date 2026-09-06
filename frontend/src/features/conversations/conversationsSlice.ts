/**
 * conversationsSlice.ts — Redux state for the temporary conversations system.
 *
 * Privacy invariants:
 *  - participantAccountIds never stored.
 *  - Only alias snapshots exposed.
 *  - No read receipts.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import type {
  ConversationListItem,
  ConversationDetail,
  PublicMessage,
} from '../../lib/conversationsApi';

// ─── Re-export for components ─────────────────────────────────────────────────

export type { ConversationListItem, ConversationDetail, PublicMessage };

// ─── State shape ─────────────────────────────────────────────────────────────

export type ConversationsStatus = 'idle' | 'loading' | 'sending' | 'error';

export interface ExpiryWarning {
  type:           'inactivity' | 'max_duration';
  conversationId: string;
}

export interface ConversationsState {
  list:                  ConversationListItem[];
  activeConversationId:  string | null;
  activeDetail:          ConversationDetail | null;
  messages:              Record<string, PublicMessage[]>;
  messageCursors:        Record<string, string | null>;
  listStatus:            ConversationsStatus;
  detailStatus:          ConversationsStatus;
  messagesStatus:        ConversationsStatus;
  matchingRequestId:     string | null;
  matchingState:         'idle' | 'searching' | 'matched' | 'no_match';
  expiryWarning:         ExpiryWarning | null;
  contactInfoWarning:    boolean;
  error:                 string | null;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: ConversationsState = {
  list:                 [],
  activeConversationId: null,
  activeDetail:         null,
  messages:             {},
  messageCursors:       {},
  listStatus:           'idle',
  detailStatus:         'idle',
  messagesStatus:       'idle',
  matchingRequestId:    null,
  matchingState:        'idle',
  expiryWarning:        null,
  contactInfoWarning:   false,
  error:                null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

export const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    // ── List ──────────────────────────────────────────────────────────────────
    conversationsLoading(state) {
      state.listStatus = 'loading';
      state.error = null;
    },
    conversationsLoaded(state, action: PayloadAction<ConversationListItem[]>) {
      state.list = action.payload;
      state.listStatus = 'idle';
    },
    conversationsError(state, action: PayloadAction<string>) {
      state.listStatus = 'error';
      state.error = action.payload;
    },

    // ── Detail ────────────────────────────────────────────────────────────────
    conversationDetailLoading(state) {
      state.detailStatus = 'loading';
      state.error = null;
    },
    conversationDetailLoaded(state, action: PayloadAction<ConversationDetail>) {
      state.activeDetail = action.payload;
      state.activeConversationId = action.payload.id;
      state.detailStatus = 'idle';
    },

    // ── Matching ──────────────────────────────────────────────────────────────
    matchingStarted(state, action: PayloadAction<string>) {
      state.matchingRequestId = action.payload;
      state.matchingState = 'searching';
      state.error = null;
    },
    matchingSucceeded(state, action: PayloadAction<string>) {
      state.matchingState = 'matched';
      state.activeConversationId = action.payload;
    },
    matchingFailed(state) {
      state.matchingState = 'no_match';
      state.matchingRequestId = null;
    },
    matchingCancelled(state) {
      state.matchingState = 'idle';
      state.matchingRequestId = null;
    },
    matchingReset(state) {
      state.matchingState = 'idle';
      state.matchingRequestId = null;
      state.error = null;
    },

    // ── Active conversation ───────────────────────────────────────────────────
    activeConversationSet(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
      if (action.payload === null) {
        state.activeDetail   = null;
        state.expiryWarning  = null;
        state.contactInfoWarning = false;
      }
    },

    conversationStateUpdated(
      state,
      action: PayloadAction<{ conversationId: string; newState: string }>
    ) {
      const { conversationId, newState } = action.payload;

      // Update list item
      const idx = state.list.findIndex((c) => c.id === conversationId);
      if (idx !== -1) {
        const item = state.list[idx];
        if (item) state.list[idx] = { ...item, state: newState };
      }

      // Update active detail
      if (state.activeDetail?.id === conversationId) {
        state.activeDetail = { ...state.activeDetail, state: newState };
      }
    },

    // ── Messages ──────────────────────────────────────────────────────────────
    messagesLoading(state) {
      state.messagesStatus = 'loading';
    },
    messagesLoaded(
      state,
      action: PayloadAction<{
        conversationId: string;
        messages:       PublicMessage[];
        cursor:         string | null;
        append:         boolean;
      }>
    ) {
      const { conversationId, messages, cursor, append } = action.payload;
      const existing = state.messages[conversationId] ?? [];
      state.messages[conversationId] = append
        ? [...messages, ...existing]   // prepend older messages
        : messages;
      state.messageCursors[conversationId] = cursor;
      state.messagesStatus = 'idle';
    },
    messageReceived(
      state,
      action: PayloadAction<{ conversationId: string; message: PublicMessage }>
    ) {
      const { conversationId, message } = action.payload;
      const existing = state.messages[conversationId] ?? [];
      state.messages[conversationId] = [...existing, message];
    },
    messageSending(state) {
      state.messagesStatus = 'sending';
    },
    messageSent(state) {
      state.messagesStatus = 'idle';
      state.error = null;
    },
    messageSendError(state, action: PayloadAction<string>) {
      state.messagesStatus = 'error';
      state.error = action.payload;
    },

    // ── Expiry & warnings ─────────────────────────────────────────────────────
    expiryWarningReceived(state, action: PayloadAction<ExpiryWarning>) {
      state.expiryWarning = action.payload;
    },
    expiryWarningCleared(state) {
      state.expiryWarning = null;
    },
    contactInfoWarningShown(state) {
      state.contactInfoWarning = true;
    },
    contactInfoWarningDismissed(state) {
      state.contactInfoWarning = false;
    },
  },
});

export const {
  conversationsLoading,
  conversationsLoaded,
  conversationsError,
  conversationDetailLoading,
  conversationDetailLoaded,
  matchingStarted,
  matchingSucceeded,
  matchingFailed,
  matchingCancelled,
  matchingReset,
  activeConversationSet,
  conversationStateUpdated,
  messagesLoading,
  messagesLoaded,
  messageReceived,
  messageSending,
  messageSent,
  messageSendError,
  expiryWarningReceived,
  expiryWarningCleared,
  contactInfoWarningShown,
  contactInfoWarningDismissed,
} = conversationsSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectConversationsList      = (state: RootState): ConversationListItem[] => state.conversations.list;
export const selectActiveConversationId   = (state: RootState): string | null          => state.conversations.activeConversationId;
export const selectActiveDetail           = (state: RootState): ConversationDetail | null => state.conversations.activeDetail;
export const selectConversationsListStatus = (state: RootState): ConversationsStatus   => state.conversations.listStatus;
export const selectMessagesStatus         = (state: RootState): ConversationsStatus    => state.conversations.messagesStatus;
export const selectMatchingState          = (state: RootState)                         => state.conversations.matchingState;
export const selectMatchingRequestId      = (state: RootState): string | null          => state.conversations.matchingRequestId;
export const selectExpiryWarning          = (state: RootState): ExpiryWarning | null   => state.conversations.expiryWarning;
export const selectContactInfoWarning     = (state: RootState): boolean                => state.conversations.contactInfoWarning;
export const selectMessages = (conversationId: string) =>
  (state: RootState): PublicMessage[] =>
    state.conversations.messages[conversationId] ?? [];
export const selectConversationById = (id: string) =>
  (state: RootState): ConversationListItem | undefined =>
    state.conversations.list.find((c) => c.id === id);

export default conversationsSlice.reducer;
