/**
 * conversationsThunks.ts — Redux thunks for conversation API operations.
 */
import type { AppDispatch } from '../../store';
import * as conversationsApi from '../../lib/conversationsApi';
import {
  conversationsLoading,
  conversationsLoaded,
  conversationsError,
  conversationDetailLoading,
  conversationDetailLoaded,
  matchingStarted,
  matchingSucceeded,
  matchingFailed,
  matchingCancelled,
  messagesLoading,
  messagesLoaded,
  messageSending,
  messageSent,
  messageSendError,
  messageReceived,
  contactInfoWarningShown,
  activeConversationSet,
} from './conversationsSlice';
import { CONVERSATION_STATE } from '../../constants/conversationStates';

// ─── Match request thunks ─────────────────────────────────────────────────────

export function requestMatchThunk(params: {
  contextCategoryId: string;
  contextPostId?:    string;
}) {
  return async (dispatch: AppDispatch): Promise<void> => {
    try {
      const result = await conversationsApi.createMatchRequest(params);
      dispatch(matchingStarted(result.conversationId));

      if (result.matched) {
        dispatch(matchingSucceeded(result.conversationId));
      }
      // else: leave in 'searching' state — socket will notify on match
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      dispatch(conversationsError(e.response?.data?.error?.message ?? 'Failed to request match'));
    }
  };
}

export function cancelMatchRequestThunk(conversationId: string) {
  return async (dispatch: AppDispatch): Promise<void> => {
    try {
      await conversationsApi.cancelMatchRequest(conversationId);
      dispatch(matchingCancelled());
    } catch {
      // Cancel failure is non-critical — still reset matching state
      dispatch(matchingCancelled());
    }
  };
}

// ─── Conversation CRUD thunks ─────────────────────────────────────────────────

export function fetchConversationsThunk() {
  return async (dispatch: AppDispatch): Promise<void> => {
    dispatch(conversationsLoading());
    try {
      const list = await conversationsApi.listConversations();
      dispatch(conversationsLoaded(list));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      dispatch(conversationsError(e.response?.data?.error?.message ?? 'Failed to load conversations'));
    }
  };
}

export function fetchConversationThunk(conversationId: string) {
  return async (dispatch: AppDispatch): Promise<void> => {
    dispatch(conversationDetailLoading());
    try {
      const detail = await conversationsApi.getConversation(conversationId);
      dispatch(conversationDetailLoaded(detail));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      dispatch(conversationsError(e.response?.data?.error?.message ?? 'Failed to load conversation'));
    }
  };
}

export function endConversationThunk(conversationId: string) {
  return async (dispatch: AppDispatch): Promise<void> => {
    try {
      await conversationsApi.endConversation(conversationId);
      // State update will arrive via socket CONVERSATION_STATE_CHANGED event
      dispatch(activeConversationSet(null));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      dispatch(conversationsError(e.response?.data?.error?.message ?? 'Failed to end conversation'));
    }
  };
}

export function submitFeedbackThunk(conversationId: string, helpful: boolean) {
  return async (_dispatch: AppDispatch): Promise<void> => {
    try {
      await conversationsApi.submitFeedback(conversationId, helpful);
    } catch {
      // Feedback submission errors are non-critical — silent fail
    }
  };
}

// ─── Message thunks ───────────────────────────────────────────────────────────

export function fetchMessagesThunk(conversationId: string, opts?: { cursor?: string; append?: boolean }) {
  return async (dispatch: AppDispatch): Promise<void> => {
    dispatch(messagesLoading());
    try {
      const result = await conversationsApi.getMessages(
        conversationId,
        opts?.cursor ? { cursor: opts.cursor } : {}
      );
      dispatch(messagesLoaded({
        conversationId,
        messages:  result.messages,
        cursor:    result.nextCursor,
        append:    opts?.append ?? false,
      }));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      dispatch(conversationsError(e.response?.data?.error?.message ?? 'Failed to load messages'));
    }
  };
}

export function sendMessageThunk(conversationId: string, body: string) {
  return async (dispatch: AppDispatch): Promise<void> => {
    dispatch(messageSending());
    try {
      const result = await conversationsApi.sendMessageHttp(conversationId, body);
      // Add sent message immediately to local state
      dispatch(messageReceived({ conversationId, message: result.message }));
      dispatch(messageSent());

      // Show contact info warning if new category detected
      if (result.contactInfoWarning && result.isNewWarning) {
        dispatch(contactInfoWarningShown());
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      dispatch(messageSendError(e.response?.data?.error?.message ?? 'Failed to send message'));
    }
  };
}

// ─── Socket event handlers ────────────────────────────────────────────────────

export function handleMatchFoundThunk(conversationId: string) {
  return (dispatch: AppDispatch): void => {
    dispatch(matchingSucceeded(conversationId));
  };
}

export function handleMatchExpiredThunk() {
  return (dispatch: AppDispatch): void => {
    dispatch(matchingFailed());
  };
}

export function handleConversationStateChangedThunk(
  conversationId: string,
  newState: string
) {
  return (dispatch: AppDispatch): void => {
    if (newState === CONVERSATION_STATE.ACTIVE) {
      dispatch(fetchConversationThunk(conversationId));
    }
    // Conversation ended states
    if (
      newState === CONVERSATION_STATE.ENDED_BY_USER ||
      newState === CONVERSATION_STATE.ENDED_INACTIVITY ||
      newState === CONVERSATION_STATE.ENDED_MAX_DURATION ||
      newState === CONVERSATION_STATE.ENDED_MODERATION
    ) {
      dispatch(fetchConversationThunk(conversationId));
    }
  };
}
