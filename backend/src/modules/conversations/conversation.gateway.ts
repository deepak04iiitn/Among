/**
 * conversation.gateway.ts — Socket.IO event gateway for real-time messaging.
 *
 * Auth: Firebase ID token verified on every connection.
 * Privacy: participantAccountIds never exposed via socket.
 * No read receipts (prevents presence inference).
 */
import type { Server as SocketServer, Socket } from 'socket.io';
import { adminAuth } from '../../config/firebase.config';
import { ConversationModel } from './conversation.model';
import * as messageService from './message.service';
import * as conversationService from './conversation.service';
import {
  CLIENT_SOCKET_EVENT,
  SERVER_SOCKET_EVENT,
} from '../../constants/socketEvents';
import { CONVERSATION_STATE } from '../../constants/conversationStates';
import { MESSAGE_MAX_CHARS } from '../../constants/limits';
import { UserModel } from '../users/user.model';

// ─── Room helpers ─────────────────────────────────────────────────────────────

function conversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}

// ─── Auth middleware ──────────────────────────────────────────────────────────

async function authenticateSocket(socket: Socket): Promise<string | null> {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return null;
    const decoded = await adminAuth.verifyIdToken(token);
    // Look up internal accountId from Firebase UID
    const user = await UserModel.findOne({ firebaseUid: decoded.uid }).lean();
    return user ? String(user._id) : null;
  } catch {
    return null;
  }
}

// ─── Gateway bootstrap ────────────────────────────────────────────────────────

export function initConversationGateway(io: SocketServer): void {
  const namespace = io.of('/conversations');

  namespace.use(async (socket, next) => {
    const accountId = await authenticateSocket(socket);
    if (!accountId) {
      next(new Error('Unauthorized'));
      return;
    }
    // Store authenticated accountId on socket for subsequent events
    (socket as Socket & { accountId: string }).accountId = accountId;
    next();
  });

  namespace.on('connection', (rawSocket: Socket) => {
    const socket = rawSocket as Socket & { accountId: string };

    // ── JOIN_CONVERSATION ───────────────────────────────────────────────────
    socket.on(CLIENT_SOCKET_EVENT.JOIN_CONVERSATION, async ({ conversationId }: { conversationId: string }) => {
      try {
        const conv = await ConversationModel.findById(conversationId, {
          participantAccountIds: 1,
          state:                 1,
        }).lean();

        if (!conv) {
          socket.emit('error', { code: 'ERR_CONVERSATION_NOT_FOUND' });
          return;
        }

        const isParticipant = conv.participantAccountIds.some(
          (id) => String(id) === socket.accountId
        );
        if (!isParticipant) {
          socket.emit('error', { code: 'ERR_NOT_PARTICIPANT' });
          return;
        }

        void socket.join(conversationRoom(conversationId));
      } catch {
        socket.emit('error', { code: 'ERR_INTERNAL' });
      }
    });

    // ── LEAVE_CONVERSATION ─────────────────────────────────────────────────
    socket.on(CLIENT_SOCKET_EVENT.LEAVE_CONVERSATION, ({ conversationId }: { conversationId: string }) => {
      void socket.leave(conversationRoom(conversationId));
      // NOTE: Leaving socket room does NOT end the conversation
    });

    // ── SEND_MESSAGE ───────────────────────────────────────────────────────
    socket.on(CLIENT_SOCKET_EVENT.SEND_MESSAGE, async ({
      conversationId,
      body,
    }: { conversationId: string; body: string }) => {
      try {
        // Basic validation
        if (!body || typeof body !== 'string' || body.trim().length === 0) {
          socket.emit('error', { code: 'ERR_INVALID_INPUT', message: 'Message body cannot be empty' });
          return;
        }
        if (body.length > MESSAGE_MAX_CHARS) {
          socket.emit('error', { code: 'ERR_INVALID_INPUT', message: `Message too long (max ${MESSAGE_MAX_CHARS} chars)` });
          return;
        }

        const result = await messageService.sendMessage(socket.accountId, conversationId, body);

        // Emit message to all participants in the room
        namespace.to(conversationRoom(conversationId)).emit(
          SERVER_SOCKET_EVENT.MESSAGE_RECEIVED,
          {
            conversationId,
            message: result.message,
          }
        );

        // If contact info warning is new for this category, notify sender only
        if (result.contactInfoWarning && result.isNewWarning) {
          socket.emit(SERVER_SOCKET_EVENT.CONTACT_INFO_WARNING, {
            conversationId,
            categories: result.warningCategories,
          });
        }

        // If conversation just transitioned to ACTIVE, notify both participants
        if (result.newConversationState === CONVERSATION_STATE.ACTIVE) {
          namespace.to(conversationRoom(conversationId)).emit(
            SERVER_SOCKET_EVENT.CONVERSATION_STATE_CHANGED,
            {
              conversationId,
              newState: CONVERSATION_STATE.ACTIVE,
            }
          );
        }
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        socket.emit('error', { code: e.code ?? 'ERR_INTERNAL', message: e.message });
      }
    });

    // ── END_CONVERSATION ───────────────────────────────────────────────────
    socket.on(CLIENT_SOCKET_EVENT.END_CONVERSATION, async ({ conversationId }: { conversationId: string }) => {
      try {
        await conversationService.endConversation(socket.accountId, conversationId);
        namespace.to(conversationRoom(conversationId)).emit(
          SERVER_SOCKET_EVENT.CONVERSATION_STATE_CHANGED,
          {
            conversationId,
            newState: CONVERSATION_STATE.ENDED_BY_USER,
          }
        );
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        socket.emit('error', { code: e.code ?? 'ERR_INTERNAL', message: e.message });
      }
    });

    socket.on('disconnect', () => {
      // Disconnect does NOT end the conversation
      // Conversation expiry is handled by server-side jobs
    });
  });

  // Expose emitter for expiry jobs
  io.conversationNamespace = namespace;
}

// ─── Emitter for expiry jobs ──────────────────────────────────────────────────

export function emitToConversationRoom(
  io: SocketServer,
  conversationId: string,
  event: string,
  data: Record<string, unknown>
): void {
  const room = conversationRoom(conversationId);
  (io.of('/conversations') as ReturnType<SocketServer['of']>).to(room).emit(event, data);
}

// Extend socket.io Server type to hold namespace reference
declare module 'socket.io' {
  interface Server {
    conversationNamespace?: ReturnType<Server['of']>;
  }
}
