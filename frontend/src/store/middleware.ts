import { type Middleware } from '@reduxjs/toolkit';
import type { RootState } from './index';

/**
 * Custom Redux middleware.
 * - Logs dispatched actions in development only.
 * - Never logs in production (avoids leaking state to console).
 */
export const loggerMiddleware: Middleware<unknown, RootState> =
  (store) => (next) => (action) => {
    if (process.env.NODE_ENV === 'development') {
      const prevState = store.getState();
      const result = next(action);
      const nextState = store.getState();

      // Only log if the action has a 'type' property (standard FSA shape)
      if (action !== null && typeof action === 'object' && 'type' in action) {
        /* eslint-disable no-console */
        console.group(`[Redux] ${String((action as { type: string }).type)}`);
        console.log('prev:', prevState);
        console.log('action:', action);
        console.log('next:', nextState);
        console.groupEnd();
        /* eslint-enable no-console */
      }
      return result;
    }
    return next(action);
  };
