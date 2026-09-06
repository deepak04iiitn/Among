/**
 * conversation.routes.ts — Express routes for the conversation system.
 *
 * Routes:
 *  POST   /api/conversations/request          Create match request
 *  DELETE /api/conversations/:id/request      Cancel match request
 *  GET    /api/conversations                  List user's conversations
 *  GET    /api/conversations/:id              Get conversation detail
 *  POST   /api/conversations/:id/end          End conversation
 *  POST   /api/conversations/:id/feedback     Submit feedback
 *  POST   /api/conversations/:id/messages     Send message
 *  GET    /api/conversations/:id/messages     Get messages (paginated)
 */
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireOnboarding } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { conversationRateLimiter } from '../../middleware/rateLimiter.middleware';
import * as controller from './conversation.controller';
import {
  matchRequestSchema,
  sendMessageSchema,
  feedbackSchema,
  getMessagesQuerySchema,
} from './conversation.schema';

export const conversationsRouter = Router();

// ─── Match request ────────────────────────────────────────────────────────────

conversationsRouter.post(
  '/request',
  requireAuth,
  requireOnboarding,
  conversationRateLimiter,
  validate(matchRequestSchema),
  controller.createMatchRequest
);

conversationsRouter.delete(
  '/:id/request',
  requireAuth,
  controller.cancelMatchRequest
);

// ─── Conversation CRUD ────────────────────────────────────────────────────────

conversationsRouter.get(
  '/',
  requireAuth,
  controller.listConversations
);

conversationsRouter.get(
  '/:id',
  requireAuth,
  controller.getConversation
);

conversationsRouter.post(
  '/:id/end',
  requireAuth,
  controller.endConversation
);

conversationsRouter.post(
  '/:id/feedback',
  requireAuth,
  validate(feedbackSchema),
  controller.submitFeedback
);

// ─── Messages ─────────────────────────────────────────────────────────────────

conversationsRouter.post(
  '/:id/messages',
  requireAuth,
  validate(sendMessageSchema),
  controller.sendMessage
);

conversationsRouter.get(
  '/:id/messages',
  requireAuth,
  validate(getMessagesQuerySchema, 'query'),
  controller.getMessages
);
