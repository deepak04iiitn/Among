/**
 * post.controller.ts — HTTP request handlers for post routes.
 *
 * Privacy invariants:
 *  - `authorAccountId` is NEVER returned in any response.
 *  - `moderationNotes` and `contentFlags` are NEVER returned.
 *  - Crisis detection result triggers resource surfacing in the response body,
 *    but never delays or blocks the post.
 */
import type { Request, Response, NextFunction } from 'express';
import * as postService from './post.service';
import * as userService from '../users/user.service';
import { CRISIS_RESOURCES } from '../../constants/crisisResources';
import { ValidationError } from '../../utils/errors';
import type { CreatePostInput, EditPostInput } from './post.schema';
import type { PostExperienceState, PostVisibility } from '../../constants/postStates';

// ─── POST /api/posts ──────────────────────────────────────────────────────────

export async function createPost(
  req: Request<object, object, CreatePostInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { accountId } = req.user!;

    // Always read alias snapshot from the user's current alias in the DB.
    // The frontend never sends alias data — it is server-authoritative.
    let authorAlias: string;
    let authorAvatarSeed: string;
    try {
      const profile    = await userService.getPublicProfile(accountId);
      authorAlias      = profile.aliasName;
      authorAvatarSeed = profile.avatarSeed;
    } catch {
      throw new ValidationError('You must complete onboarding before sharing an experience.');
    }

    const result = await postService.createPost(
      accountId,
      authorAlias,
      authorAvatarSeed,
      {
        body:            req.body.body,
        categoryIds:     req.body.categoryIds ?? [],
        state:           req.body.state as PostExperienceState,
        visibilityScope: (req.body.visibilityScope as PostVisibility) ?? 'broad',
      }
    );

    // If crisis detected — include resources unconditionally (PRD §6.4)
    const crisisResources = result.crisisDetected ? CRISIS_RESOURCES : null;

    res.status(201).json({
      post: result.post,
      crisisDetected:  result.crisisDetected,
      crisisResources,
      safetyWarnings:  result.safetyWarnings,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/posts/:id ───────────────────────────────────────────────────────

export async function getPost(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestingUserId = req.user?.accountId ?? null;
    const result = await postService.getPostById(req.params.id, requestingUserId);

    // Check if result is a deleted/removed redirect
    if ('redirectCategoryId' in result) {
      res.status(410).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/posts/:id ───────────────────────────────────────────────────────

export async function editPost(
  req: Request<{ id: string }, object, EditPostInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updated = await postService.editPost(
      req.user!.accountId,
      req.params.id,
      { body: req.body.body }
    );
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/posts/:id ───────────────────────────────────────────────────

export async function deletePost(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await postService.deletePost(req.user!.accountId, req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/posts/my ───────────────────────────────────────────────────────

export async function getMyPosts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawCursor = typeof req.query['cursor'] === 'string' ? req.query['cursor'] : undefined;
    const limit     = typeof req.query['limit'] === 'string' ? Number(req.query['limit']) : 20;

    const paginationOpts = rawCursor !== undefined
      ? { cursor: rawCursor, limit }
      : { limit };

    const result = await postService.getPostsByAuthor(req.user!.accountId, paginationOpts);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
