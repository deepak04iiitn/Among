/**
 * conversation.controller.ts — HTTP request handlers for conversation endpoints.
 */
import type { Request, Response, NextFunction } from 'express';
import * as matchingService from './matching.service';
import * as conversationService from './conversation.service';
import * as messageService from './message.service';
import type {
  MatchRequestInput,
  FeedbackInput,
  GetMessagesQuery,
  SendMessageInput,
} from './conversation.schema';

// ─── Match request ────────────────────────────────────────────────────────────

export async function createMatchRequest(
  req: Request<object, object, MatchRequestInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input: matchingService.MatchRequestInput = {
      contextCategoryId: req.body.contextCategoryId,
    };
    if (req.body.contextPostId !== undefined) {
      input.contextPostId = req.body.contextPostId;
    }
    const result = await matchingService.createMatchRequest(req.user!.accountId, input);

    res.status(201).json({
      matched:        result.matched,
      conversationId: String(result.conversation._id),
      state:          result.conversation.state,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelMatchRequest(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await matchingService.cancelMatchRequest(req.user!.accountId, req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ─── Conversation CRUD ────────────────────────────────────────────────────────

export async function listConversations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const conversations = await conversationService.listConversationsForUser(req.user!.accountId);
    res.status(200).json({ conversations });
  } catch (err) {
    next(err);
  }
}

export async function getConversation(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const conversation = await conversationService.getConversationForUser(
      req.user!.accountId,
      req.params.id
    );
    res.status(200).json({ conversation });
  } catch (err) {
    next(err);
  }
}

export async function endConversation(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await conversationService.endConversation(req.user!.accountId, req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function submitFeedback(
  req: Request<{ id: string }, object, FeedbackInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await conversationService.submitFeedback(
      req.user!.accountId,
      req.params.id,
      req.body.helpful
    );
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function sendMessage(
  req: Request<{ id: string }, object, SendMessageInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await messageService.sendMessage(
      req.user!.accountId,
      req.params.id,
      req.body.body
    );
    res.status(201).json({
      message:            result.message,
      contactInfoWarning: result.contactInfoWarning,
      isNewWarning:       result.isNewWarning,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMessages(
  req: Request<{ id: string }, object, object, GetMessagesQuery>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const opts: { cursor?: string; limit?: number } = {};
    if (req.query.cursor !== undefined) opts.cursor = req.query.cursor;
    if (req.query.limit  !== undefined) opts.limit  = req.query.limit;

    const result = await messageService.getMessages(
      req.user!.accountId,
      req.params.id,
      opts
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
