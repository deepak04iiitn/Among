import mongoose from 'mongoose';
import { env } from './environment';
import { logger } from '../utils/logger';

let isConnected = false;

/** Exposed for testing only — resets connection state between test cases */
export function _resetConnectionState(): void {
  isConnected = false;
}

export async function connectDatabase(): Promise<void> {
  if (isConnected) return;

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info('MongoDB connected');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { err });
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected');
    });
  } catch (err) {
    logger.error('Failed to connect to MongoDB', { err });
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}
