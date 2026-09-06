/**
 * AMONG API client — Axios instance pre-configured for the backend.
 *
 * Features:
 * - Base URL from NEXT_PUBLIC_API_BASE_URL env var.
 * - Request interceptor: attaches Firebase ID token as Authorization header.
 * - Response interceptor: normalizes error responses into a consistent shape.
 * - Timeout configured from frontend limits constants.
 * - All endpoint paths use constants from frontend/src/constants/apiEndpoints.ts.
 */

import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';
import { getIdToken } from './firebaseClient';
import { API_TIMEOUT_MS } from '../constants/limits';

// ─── Error shape ─────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  code: string;
  message: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

// ─── Instance ────────────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL:        process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:4000',
  timeout:        API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // AMONG uses Bearer token auth, not cookies
});

// ─── Request interceptor — attach Firebase token ─────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    try {
      const token = await getIdToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // If token retrieval fails, proceed without auth header.
      // Protected endpoints will return 401, which will be handled by the
      // response interceptor below.
    }
    return config;
  },
  (error: unknown) => Promise.reject(error instanceof Error ? error : new Error(String(error)))
);

// ─── Response interceptor — normalize errors ─────────────────────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: unknown) => {
    if (isAxiosError(error)) {
      const status  = error.response?.status ?? 0;
      const data    = error.response?.data as { error?: ApiErrorBody } | undefined;
      const errBody = data?.error;

      if (errBody?.code && errBody?.message) {
        return Promise.reject(
          new ApiError(status, errBody.code, errBody.message)
        );
      }

      // Fallback for non-JSON or unexpected error shapes
      const code    = status === 401 ? 'ERR_UNAUTHORIZED'
                    : status === 403 ? 'ERR_FORBIDDEN'
                    : status === 404 ? 'ERR_NOT_FOUND'
                    : status === 429 ? 'ERR_RATE_LIMITED'
                    : status >= 500  ? 'ERR_SERVER'
                    : 'ERR_REQUEST_FAILED';

      const message = error.response?.statusText ?? error.message ?? 'An unexpected error occurred';
      return Promise.reject(new ApiError(status, code, message));
    }

    // Non-Axios error (e.g. network failure)
    return Promise.reject(
      error instanceof Error
        ? error
        : new Error('Network request failed')
    );
  }
);

export default apiClient;
