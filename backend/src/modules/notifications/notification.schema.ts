/**
 * notification.schema.ts — Zod validation for notification endpoints.
 */
import { z } from 'zod';

export const markReadSchema = z.object({
  notificationId: z.string().min(1, 'Notification ID required'),
});

export type MarkReadInput = z.infer<typeof markReadSchema>;
