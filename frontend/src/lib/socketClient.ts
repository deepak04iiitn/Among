/**
 * AMONG Socket.IO client factory.
 *
 * Features:
 * - Creates a namespaced socket for a specific conversation.
 * - Attaches the Firebase ID token in the handshake for server-side verification.
 * - All event names are imported from constants — never hardcoded.
 * - `destroySocket` cleanly disconnects and removes all listeners.
 */

import { io, type Socket } from 'socket.io-client';
import { getIdToken } from './firebaseClient';
import { SOCKET_EVENT } from '../constants/socketEvents';

// ─── Types ───────────────────────────────────────────────────────────────────

export type { Socket };

/** Listener signature for socket events */
export type SocketEventListener<T = unknown> = (data: T) => void;

// ─── Singleton socket reference ───────────────────────────────────────────────
// One socket per active conversation. Stored module-level so any component
// can call destroySocket() without needing the reference.

let _activeSocket: Socket | null = null;
let _activeConversationId: string | null = null;

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create (or return the existing) socket for a given conversation.
 * If a different conversation is active, the old socket is destroyed first.
 *
 * @param conversationId - The conversation to connect to.
 * @returns The connected Socket.IO socket instance.
 */
export async function createSocket(conversationId: string): Promise<Socket> {
  // Return existing socket if already connected to the same conversation
  if (_activeSocket && _activeConversationId === conversationId) {
    return _activeSocket;
  }

  // Destroy any existing socket for a different conversation
  if (_activeSocket) {
    destroySocket();
  }

  const token = await getIdToken();
  const socketUrl = process.env['NEXT_PUBLIC_SOCKET_URL'] ?? 'http://localhost:4000';

  const socket = io(socketUrl, {
    auth: {
      token:          token ?? '',
      conversationId,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 10_000,
  });

  _activeSocket        = socket;
  _activeConversationId = conversationId;

  // Emit join-conversation event once connected
  socket.on(SOCKET_EVENT.CONNECT, () => {
    socket.emit(SOCKET_EVENT.CONVERSATION_JOIN, { conversationId });
  });

  return socket;
}

/**
 * Disconnect and clean up the active socket.
 * Safe to call even if no socket is active.
 */
export function destroySocket(): void {
  if (_activeSocket) {
    _activeSocket.removeAllListeners();
    _activeSocket.disconnect();
    _activeSocket         = null;
    _activeConversationId = null;
  }
}

/**
 * Get the active socket, or null if not connected.
 * Prefer `createSocket` for creating; use this only when you need to access
 * an already-established socket (e.g. to emit a message).
 */
export function getActiveSocket(): Socket | null {
  return _activeSocket;
}

/**
 * Emit an event on the active socket.
 * No-op if no socket is connected — callers must check that a conversation is active.
 */
export function emitSocketEvent<T extends object>(event: string, data: T): void {
  if (_activeSocket?.connected) {
    _activeSocket.emit(event, data);
  }
}
