import morgan from 'morgan';
import { env } from '../config/environment';

const format =
  env.NODE_ENV === 'production'
    ? 'combined'
    : ':method :url :status :response-time ms';

export const requestLoggerMiddleware = morgan(format, {
  // Skip health-check endpoint noise in logs
  skip: (req) => req.url === '/health',
});
