/**
 * conversationExpiry.job.ts — Agenda jobs for conversation lifecycle expiry.
 *
 * Jobs:
 *  1. inactivityWarningJob — marks conversations idle for >25 min
 *  2. inactivityExpiryJob  — expires conversations idle for >30 min
 *  3. maxDurationExpiryJob — expires conversations at the 48-hour ceiling
 *  4. matchExpiryJob       — expires match requests past 15 minutes
 */
import type { Agenda } from 'agenda';
import { ConversationModel } from '../modules/conversations/conversation.model';
import { CONVERSATION_STATE } from '../constants/conversationStates';
import {
  CONVERSATION_INACTIVITY_EXPIRY_MS,
  CONVERSATION_INACTIVITY_WARNING_MS,
  CONVERSATION_MAX_DURATION_WARNING_BEFORE_MS,
  INACTIVITY_WARNING_JOB_INTERVAL_MS,
  INACTIVITY_EXPIRY_JOB_INTERVAL_MS,
  MAX_DURATION_EXPIRY_JOB_INTERVAL_MS,
  MATCH_EXPIRY_JOB_INTERVAL_MS,
} from '../constants/timeouts';
import { EXPIRY_WARNING_TYPE } from '../constants/socketEvents';

// ─── Job names ────────────────────────────────────────────────────────────────

export const JOB_INACTIVITY_WARNING   = 'conversation:inactivityWarning';
export const JOB_INACTIVITY_EXPIRY    = 'conversation:inactivityExpiry';
export const JOB_MAX_DURATION_EXPIRY  = 'conversation:maxDurationExpiry';
export const JOB_MATCH_EXPIRY         = 'conversation:matchExpiry';

// ─── Socket emitter ───────────────────────────────────────────────────────────

type SocketEmitter = (
  conversationId: string,
  event: string,
  data: Record<string, unknown>
) => void;

let _emitter: SocketEmitter | null = null;

export function setConversationSocketEmitter(emitter: SocketEmitter): void {
  _emitter = emitter;
}

function emitToConversation(conversationId: string, event: string, data: Record<string, unknown>): void {
  if (_emitter) {
    try {
      _emitter(conversationId, event, data);
    } catch {
      // Jobs must never throw
    }
  }
}

// ─── Job definitions ──────────────────────────────────────────────────────────

export function defineConversationExpiryJobs(agenda: Agenda): void {
  /**
   * Inactivity warning — fire 5 minutes before inactivity expiry.
   * Runs every minute.
   */
  agenda.define(JOB_INACTIVITY_WARNING, async () => {
    const warnThreshold = new Date(Date.now() - CONVERSATION_INACTIVITY_WARNING_MS);

    const staleConversations = await ConversationModel.find({
      state:           { $in: [CONVERSATION_STATE.ACTIVE] },
      lastActivityAt:  { $lt: warnThreshold },
      inactivityWarningAt: null,
    }).select('_id');

    for (const conv of staleConversations) {
      await ConversationModel.updateOne(
        { _id: conv._id, state: CONVERSATION_STATE.ACTIVE },
        { $set: { state: CONVERSATION_STATE.INACTIVITY_WARNING, inactivityWarningAt: new Date() } }
      );
      emitToConversation(String(conv._id), 'server:expiry_warning', {
        type:             EXPIRY_WARNING_TYPE.INACTIVITY,
        conversationId:   String(conv._id),
      });
    }
  });

  /**
   * Inactivity expiry — expire conversations that haven't recovered from warning.
   * Runs every minute.
   */
  agenda.define(JOB_INACTIVITY_EXPIRY, async () => {
    const expiryThreshold = new Date(Date.now() - (CONVERSATION_INACTIVITY_EXPIRY_MS - CONVERSATION_INACTIVITY_WARNING_MS));

    const expiredConversations = await ConversationModel.find({
      state:              CONVERSATION_STATE.INACTIVITY_WARNING,
      inactivityWarningAt: { $lt: expiryThreshold },
    }).select('_id');

    for (const conv of expiredConversations) {
      await ConversationModel.updateOne(
        { _id: conv._id, state: CONVERSATION_STATE.INACTIVITY_WARNING },
        {
          $set: {
            state:     CONVERSATION_STATE.ENDED_INACTIVITY,
            endedAt:   new Date(),
            endReason: 'inactivity',
          },
        }
      );
      emitToConversation(String(conv._id), 'server:conversation_state_changed', {
        conversationId: String(conv._id),
        newState:       CONVERSATION_STATE.ENDED_INACTIVITY,
      });
    }
  });

  /**
   * Max duration expiry — warn 1 hour before, then expire at 48 hours.
   * Runs every 5 minutes.
   */
  agenda.define(JOB_MAX_DURATION_EXPIRY, async () => {
    const now = new Date();

    // 1. Warn conversations approaching max duration
    const warnAt = new Date(now.getTime() + CONVERSATION_MAX_DURATION_WARNING_BEFORE_MS);
    const warningCandidates = await ConversationModel.find({
      state:     CONVERSATION_STATE.ACTIVE,
      expiresAt: { $gt: now, $lt: warnAt },
    }).select('_id');

    for (const conv of warningCandidates) {
      emitToConversation(String(conv._id), 'server:expiry_warning', {
        type:           EXPIRY_WARNING_TYPE.MAX_DURATION,
        conversationId: String(conv._id),
      });
    }

    // 2. Expire conversations past max duration
    const expiredCandidates = await ConversationModel.find({
      state:     { $in: [CONVERSATION_STATE.ACTIVE, CONVERSATION_STATE.INACTIVITY_WARNING] },
      expiresAt: { $lt: now },
    }).select('_id');

    for (const conv of expiredCandidates) {
      await ConversationModel.updateOne(
        { _id: conv._id },
        {
          $set: {
            state:     CONVERSATION_STATE.ENDED_MAX_DURATION,
            endedAt:   now,
            endReason: 'max_duration',
          },
        }
      );
      emitToConversation(String(conv._id), 'server:conversation_state_changed', {
        conversationId: String(conv._id),
        newState:       CONVERSATION_STATE.ENDED_MAX_DURATION,
      });
    }
  });

  /**
   * Match request expiry — expire REQUESTED conversations past the 15-minute window.
   * Runs every minute.
   */
  agenda.define(JOB_MATCH_EXPIRY, async () => {
    const expiredRequests = await ConversationModel.find({
      state:                CONVERSATION_STATE.REQUESTED,
      matchRequestExpiresAt: { $lt: new Date() },
    }).select('_id');

    for (const conv of expiredRequests) {
      await ConversationModel.updateOne(
        { _id: conv._id, state: CONVERSATION_STATE.REQUESTED },
        {
          $set: {
            state:     CONVERSATION_STATE.NO_MATCH_FOUND,
            endedAt:   new Date(),
            endReason: 'match_request_expired',
          },
        }
      );
      emitToConversation(String(conv._id), 'server:match_expired', {
        conversationId: String(conv._id),
      });
    }
  });
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

export async function scheduleConversationExpiryJobs(agenda: Agenda): Promise<void> {
  await agenda.every(`${INACTIVITY_WARNING_JOB_INTERVAL_MS}ms`,   JOB_INACTIVITY_WARNING);
  await agenda.every(`${INACTIVITY_EXPIRY_JOB_INTERVAL_MS}ms`,    JOB_INACTIVITY_EXPIRY);
  await agenda.every(`${MAX_DURATION_EXPIRY_JOB_INTERVAL_MS}ms`,  JOB_MAX_DURATION_EXPIRY);
  await agenda.every(`${MATCH_EXPIRY_JOB_INTERVAL_MS}ms`,         JOB_MATCH_EXPIRY);
}
