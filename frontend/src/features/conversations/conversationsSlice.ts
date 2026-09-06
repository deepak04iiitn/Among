import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AliasSnapshot {
  readonly name: string;
  readonly avatarSeed: string;
}

export interface Message {
  readonly id: string;
  readonly body: string;
  readonly senderAlias: AliasSnapshot;
  readonly isOwn: boolean;
  readonly sentAt: string; // ISO
  readonly contactInfoWarning: boolean;
}

export type ConversationState =
  | 'matching'
  | 'active'
  | 'expiry_warning'
  | 'expired'
  | 'ended_by_user'
  | 'ended_by_system';

export interface Conversation {
  readonly id: string;
  readonly experienceCategoryId: string;
  readonly experienceCategoryLabel: string;
  readonly otherPartyAlias: AliasSnapshot;
  readonly state: ConversationState;
  readonly startedAt: string;
  readonly expiresAt: string | null;
  readonly unreadCount: number;
}

export type ConversationsStatus = 'idle' | 'loading' | 'sending' | 'error';

export interface ConversationsState {
  list: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  messageCursors: Record<string, string | null>;
  listStatus: ConversationsStatus;
  messagesStatus: ConversationsStatus;
  error: string | null;
}

// ─── Initial state ───────────────────────────────────────────────────────────

const initialState: ConversationsState = {
  list: [],
  activeConversationId: null,
  messages: {},
  messageCursors: {},
  listStatus: 'idle',
  messagesStatus: 'idle',
  error: null,
};

// ─── Slice ───────────────────────────────────────────────────────────────────

export const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    conversationsLoading(state) {
      state.listStatus = 'loading';
      state.error = null;
    },

    conversationsLoaded(state, action: PayloadAction<Conversation[]>) {
      state.list = action.payload;
      state.listStatus = 'idle';
    },

    conversationsError(state, action: PayloadAction<string>) {
      state.listStatus = 'error';
      state.error = action.payload;
    },

    activeConversationSet(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
    },

    messagesLoading(state) {
      state.messagesStatus = 'loading';
    },

    messagesLoaded(
      state,
      action: PayloadAction<{
        conversationId: string;
        messages: Message[];
        cursor: string | null;
        append: boolean;
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

    /** Append a single new message (received via Socket.IO or sent optimistically) */
    messageReceived(
      state,
      action: PayloadAction<{ conversationId: string; message: Message }>
    ) {
      const { conversationId, message } = action.payload;
      const existing = state.messages[conversationId] ?? [];
      state.messages[conversationId] = [...existing, message];

      // Update unread count if not the active conversation
      if (state.activeConversationId !== conversationId) {
        const conv = state.list.find((c) => c.id === conversationId);
        if (conv) {
          const idx = state.list.indexOf(conv);
          state.list[idx] = { ...conv, unreadCount: conv.unreadCount + 1 };
        }
      }
    },

    conversationStateUpdated(
      state,
      action: PayloadAction<{ conversationId: string; newState: ConversationState }>
    ) {
      const { conversationId, newState } = action.payload;
      const idx = state.list.findIndex((c) => c.id === conversationId);
      if (idx !== -1) {
        const conv = state.list[idx];
        if (conv) {
          state.list[idx] = { ...conv, state: newState };
        }
      }
    },

    unreadCleared(state, action: PayloadAction<string>) {
      const idx = state.list.findIndex((c) => c.id === action.payload);
      if (idx !== -1) {
        const conv = state.list[idx];
        if (conv) {
          state.list[idx] = { ...conv, unreadCount: 0 };
        }
      }
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
  },
});

export const {
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
} = conversationsSlice.actions;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectConversationsList      = (state: RootState): Conversation[]        => state.conversations.list;
export const selectActiveConversationId   = (state: RootState): string | null         => state.conversations.activeConversationId;
export const selectConversationsStatus    = (state: RootState): ConversationsStatus   => state.conversations.listStatus;
export const selectMessagesStatus         = (state: RootState): ConversationsStatus   => state.conversations.messagesStatus;
export const selectTotalUnread            = (state: RootState): number =>
  state.conversations.list.reduce((sum, c) => sum + c.unreadCount, 0);
export const selectConversationById = (id: string) =>
  (state: RootState): Conversation | undefined =>
    state.conversations.list.find((c) => c.id === id);
export const selectMessages = (conversationId: string) =>
  (state: RootState): Message[] =>
    state.conversations.messages[conversationId] ?? [];

export default conversationsSlice.reducer;
