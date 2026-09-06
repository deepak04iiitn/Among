/**
 * useConversationExpiry.ts — Derives expiry state from a conversation object.
 *
 * Computes time-to-expiry for both inactivity and max duration limits.
 * Updates every 30 seconds to avoid excessive re-renders.
 */
'use client';

import { useState, useEffect } from 'react';
import {
  CONVERSATION_INACTIVITY_EXPIRY_MS,
  CONVERSATION_INACTIVITY_WARNING_MS,
  CONVERSATION_MAX_DURATION_WARNING_BEFORE_MS,
} from '../constants/timeouts';
import type { ConversationDetail } from '../features/conversations/conversationsSlice';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConversationExpiryState {
  inactivityWarning:  boolean;
  maxDurationWarning: boolean;
  minutesRemaining:   number | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useConversationExpiry(
  conversation: ConversationDetail | null
): ConversationExpiryState {
  const [now, setNow] = useState(() => Date.now());

  // Update every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (!conversation) {
    return { inactivityWarning: false, maxDurationWarning: false, minutesRemaining: null };
  }

  const { startedAt, expiresAt, lastActivityAt } = conversation;

  // ── Inactivity warning ────────────────────────────────────────────────────
  let inactivityWarning = false;
  if (lastActivityAt) {
    const timeSinceActivity = now - new Date(lastActivityAt).getTime();
    inactivityWarning = timeSinceActivity >= CONVERSATION_INACTIVITY_WARNING_MS;
  }

  // ── Max duration warning ──────────────────────────────────────────────────
  let maxDurationWarning = false;
  let minutesRemaining: number | null = null;

  if (expiresAt) {
    const msUntilExpiry = new Date(expiresAt).getTime() - now;
    maxDurationWarning = msUntilExpiry <= CONVERSATION_MAX_DURATION_WARNING_BEFORE_MS && msUntilExpiry > 0;
    minutesRemaining = Math.max(0, Math.ceil(msUntilExpiry / 60_000));
  } else if (startedAt) {
    // expiresAt is only set after the first message starts the conversation
    const elapsed = now - new Date(startedAt).getTime();
    const remaining = CONVERSATION_INACTIVITY_EXPIRY_MS - elapsed;
    minutesRemaining = Math.max(0, Math.ceil(remaining / 60_000));
  }

  return { inactivityWarning, maxDurationWarning, minutesRemaining };
}
