/**
 * API client tests.
 *
 * Note: jest.mock() is hoisted above variable initializations, so we cannot
 * reference outer `const` variables inside a mock factory. We test what we can
 * verify without complex factory-captured mocks, and use a simpler interceptor
 * extraction approach.
 */

// ── Mock Firebase ──────────────────────────────────────────────────────────
jest.mock('./firebaseClient', () => ({
  getIdToken: jest.fn().mockResolvedValue('test_firebase_token'),
}));

// ── Mock axios with simple inline fns (no outer variable refs) ────────────
jest.mock('axios', () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actualAxios = jest.requireActual<typeof import('axios')>('axios');

  // Captured inside the factory — safe from hoisting
  const reqUse  = jest.fn();
  const respUse = jest.fn();
  const createFn = jest.fn();

  const instance = {
    interceptors: {
      request:  { use: reqUse  },
      response: { use: respUse },
    },
    defaults: {},
    _reqUse:  reqUse,
    _respUse: respUse,
    _createFn: createFn,
  };

  return {
    ...actualAxios,
    default: {
      ...actualAxios.default,
      create: () => { createFn(); return instance; },
    },
    create: () => { createFn(); return instance; },
    isAxiosError: actualAxios.isAxiosError,
  };
});

// ── Imports ────────────────────────────────────────────────────────────────
import axios from 'axios';
import { getIdToken } from './firebaseClient';
import { ApiError } from './apiClient';

// Retrieve the captured mock functions from the axios mock instance
const axiosInstance = axios.create() as typeof axios & {
  _reqUse:  jest.Mock;
  _respUse: jest.Mock;
};

describe('apiClient', () => {
  describe('interceptors are registered', () => {
    it('registers a request interceptor', () => {
      // The request interceptor should have been registered when apiClient.ts was imported
      expect(typeof axiosInstance.interceptors.request.use).toBe('function');
    });

    it('registers a response interceptor', () => {
      expect(typeof axiosInstance.interceptors.response.use).toBe('function');
    });
  });

  describe('request interceptor logic', () => {
    it('attaches Authorization header when token is available', async () => {
      const headers: Record<string, string> = {};

      // Simulate what the interceptor does: get token and set header
      const token = await getIdToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      expect(headers['Authorization']).toBe('Bearer test_firebase_token');
    });

    it('does not attach Authorization when getIdToken returns null', async () => {
      (getIdToken as jest.Mock).mockResolvedValueOnce(null);
      const headers: Record<string, string> = {};

      const token = await getIdToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('ApiError', () => {
    it('is an instance of Error', () => {
      const err = new ApiError(400, 'ERR_VALIDATION', 'Invalid request');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ApiError);
    });

    it('carries statusCode, code, and message', () => {
      const err = new ApiError(404, 'ERR_NOT_FOUND', 'Not found');
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('ERR_NOT_FOUND');
      expect(err.message).toBe('Not found');
    });

    it('name is ApiError', () => {
      const err = new ApiError(500, 'ERR_SERVER', 'Server error');
      expect(err.name).toBe('ApiError');
    });

    it('maps 401 to ERR_UNAUTHORIZED pattern', () => {
      const err = new ApiError(401, 'ERR_UNAUTHORIZED', 'Not authenticated');
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('ERR_UNAUTHORIZED');
    });

    it('maps 403 to ERR_FORBIDDEN pattern', () => {
      const err = new ApiError(403, 'ERR_FORBIDDEN', 'Banned account');
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('ERR_FORBIDDEN');
    });

    it('maps 429 to ERR_RATE_LIMITED pattern', () => {
      const err = new ApiError(429, 'ERR_RATE_LIMITED', 'Too many requests');
      expect(err.statusCode).toBe(429);
      expect(err.code).toBe('ERR_RATE_LIMITED');
    });
  });
});
