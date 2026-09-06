/**
 * useSocket.ts — Socket.IO connection hook for real-time conversation events.
 *
 * Connects to /conversations namespace on mount.
 * Listens for server events and dispatches to Redux.
 * Disconnects on unmount — disconnect does NOT end the conversation.
 *
 * Privacy: socket events never expose accountIds — only alias data.
 */
'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { SOCKET_EVENT } from '../constants/socketEvents';
import {
  messageReceived,
  conversationStateUpdated,
  expiryWarningReceived,
  contactInfoWarningShown,
  matchingSucceeded,
  matchingFailed,
} from '../features/conversations/conversationsSlice';
import type { PublicMessage, ExpiryWarning } from '../features/conversations/conversationsSlice';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSocket(conversationId: string | null, idToken: string | null): void {
  const dispatch = useDispatch<AppDispatch>();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!conversationId || !idToken) return;

    const socket = io('/conversations', {
      auth:        { token: idToken },
      transports:  ['websocket'],
      reconnection: true,
    });

    socketRef.current = socket;

    // ── Join conversation room ──────────────────────────────────────────────
    socket.on(SOCKET_EVENT.CONNECT, () => {
      socket.emit(SOCKET_EVENT.CONVERSATION_JOIN, { conversationId });
    });

    // ── Incoming message ───────────────────────────────────────────────────
    socket.on(
      SOCKET_EVENT.MESSAGE_RECEIVED,
      (data: { conversationId: string; message: PublicMessage }) => {
        dispatch(messageReceived({
          conversationId: data.conversationId,
          message:        data.message,
        }));
      }
    );

    // ── Conversation state change ──────────────────────────────────────────
    socket.on(
      SOCKET_EVENT.CONVERSATION_STATE_CHANGED,
      (data: { conversationId: string; newState: string }) => {
        dispatch(conversationStateUpdated({
          conversationId: data.conversationId,
          newState:       data.newState,
        }));
      }
    );

    // ── Expiry warnings ────────────────────────────────────────────────────
    socket.on(
      SOCKET_EVENT.EXPIRY_WARNING,
      (data: { type: 'inactivity' | 'max_duration'; conversationId: string }) => {
        const warning: ExpiryWarning = {
          type:           data.type,
          conversationId: data.conversationId,
        };
        dispatch(expiryWarningReceived(warning));
      }
    );

    // ── Contact info warning ───────────────────────────────────────────────
    socket.on(SOCKET_EVENT.CONTACT_INFO_WARNING, () => {
      dispatch(contactInfoWarningShown());
    });

    // ── Match found ────────────────────────────────────────────────────────
    socket.on(
      SOCKET_EVENT.MATCH_FOUND,
      (data: { conversationId: string }) => {
        dispatch(matchingSucceeded(data.conversationId));
      }
    );

    // ── Match expired ──────────────────────────────────────────────────────
    socket.on(SOCKET_EVENT.MATCH_EXPIRED, () => {
      dispatch(matchingFailed());
    });

    return () => {
      // Disconnect does NOT end the conversation — just leaves the socket room
      socket.emit(SOCKET_EVENT.CONVERSATION_LEAVE, { conversationId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversationId, idToken, dispatch]);
}

// ─── Send message via socket ──────────────────────────────────────────────────

export function useSendMessageViaSocket(): ((conversationId: string, body: string) => void) | null {
  const socketRef = useRef<Socket | null>(null);

  return socketRef.current
    ? (conversationId: string, body: string) => {
        socketRef.current?.emit(SOCKET_EVENT.MESSAGE_SEND, { conversationId, body });
      }
    : null;
}
