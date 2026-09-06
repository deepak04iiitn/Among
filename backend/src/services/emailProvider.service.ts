/**
 * emailProvider.service.ts — Abstract email provider adapter.
 *
 * Product code NEVER calls an email SDK directly — always goes through this abstraction.
 * This allows swapping providers without touching business logic.
 *
 * Privacy rules (PRD §6.3):
 *  - Email subject is ALWAYS generic — never contains message content or alias.
 *  - Email body is ALWAYS generic — never contains message content or PII.
 *  - Lock-screen/notification preview text is always: "You have a new notification on AMONG".
 *
 * Current implementation: console-logged stub (real provider injected per environment).
 * Replace `sendImpl` with actual SDK call (e.g. Resend, SendGrid) when ready.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmailPayload {
  /** Recipient email address */
  to:      string;
  /** Generic subject — NEVER includes message content or alias */
  subject: string;
  /** Plain-text body — NEVER includes PII or message content */
  textBody: string;
}

export interface EmailResult {
  sent:  boolean;
  error?: string;
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * sendEmail — fire-and-forget, async, non-blocking.
 * Never throws — always returns EmailResult.
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  try {
    await sendImpl(payload);
    return { sent: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { sent: false, error: msg };
  }
}

/**
 * Stub implementation — replace with real provider (e.g. Resend, SendGrid).
 * In production this would be an environment-injected adapter.
 */
async function sendImpl(payload: EmailPayload): Promise<void> {
  // In development/test, log only — no real email sent
  if (process.env['NODE_ENV'] !== 'production') {
    console.log('[emailProvider] stub send:', {
      to:      payload.to,
      subject: payload.subject,
      // Never log body to avoid PII in logs
    });
    return;
  }
  // TODO: Replace with real provider call, e.g.:
  // await resend.emails.send({ from: 'noreply@among.app', to, subject, text: textBody });
  throw new Error('Production email provider not configured');
}
