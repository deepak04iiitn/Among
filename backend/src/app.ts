/**
 * app.ts — Express application factory.
 *
 * Creates and configures the Express app.
 * Separated from server.ts so it can be cleanly imported in tests
 * without starting the HTTP server.
 */
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/environment';
import { requestLoggerMiddleware } from './middleware/requestLogger.middleware';
import { errorHandlerMiddleware } from './middleware/errorHandler.middleware';
import { sanitizeBody } from './middleware/sanitize.middleware';
import { globalRateLimiter } from './middleware/rateLimiter.middleware';
import { authRouter, usersRouter } from './modules/users/user.routes';
import { postsRouter } from './modules/posts/post.routes';

export function createApp(): express.Application {
  const app = express();

  // ─── Security ────────────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    })
  );

  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  );

  // ─── Request parsing ─────────────────────────────────────────────────────
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(cookieParser());
  app.use(compression());

  // ─── Logging ─────────────────────────────────────────────────────────────
  app.use(requestLoggerMiddleware);

  // ─── Trust proxy (for rate limiting / IP detection behind load balancer) ──
  app.set('trust proxy', 1);

  // ─── Global rate limiting ─────────────────────────────────────────────────
  app.use(globalRateLimiter);

  // ─── Global sanitization ──────────────────────────────────────────────────
  app.use(sanitizeBody);

  // ─── Health check ─────────────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ─── API routes ───────────────────────────────────────────────────────────
  app.use('/api/auth',  authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/posts', postsRouter);

  // ─── 404 handler ─────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, code: 'ERR_NOT_FOUND', message: 'Route not found' });
  });

  // ─── Error handler (must be last) ────────────────────────────────────────
  app.use(errorHandlerMiddleware);

  return app;
}
