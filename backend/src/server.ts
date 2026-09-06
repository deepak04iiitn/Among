/**
 * server.ts — HTTP + Socket.IO server entry point.
 *
 * Starts the HTTP server and Socket.IO gateway.
 * Connects to MongoDB and Redis on startup.
 */
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app';
import { env } from './config/environment';
import { connectDatabase, disconnectDatabase } from './config/database';
import { getRedisClient, disconnectRedis } from './config/redis';
import { getFirebaseApp } from './config/firebase';
import { logger } from './utils/logger';

async function bootstrap(): Promise<void> {
  // Validate env and connect to dependencies before booting
  await connectDatabase();
  getRedisClient();    // initialises connection pool
  getFirebaseApp();    // validates Firebase credentials

  const app = createApp();
  const httpServer = http.createServer(app);

  // ─── Socket.IO ─────────────────────────────────────────────────────────
  const io = new SocketServer(httpServer, {
    cors: {
      origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
    },
    pingTimeout: 30_000,
    pingInterval: 10_000,
  });

  // Expose io so gateways can import it later
  // (registered in Phase 5 when messaging is built)
  app.set('io', io);

  // ─── HTTP server ───────────────────────────────────────────────────────
  httpServer.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // ─── Graceful shutdown ─────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal} — shutting down gracefully`);
    httpServer.close(async () => {
      await Promise.all([disconnectDatabase(), disconnectRedis()]);
      logger.info('Shutdown complete');
      process.exit(0);
    });

    // Force exit after 15 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 15_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { err });
    void shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
    void shutdown('unhandledRejection');
  });
}

void bootstrap();
