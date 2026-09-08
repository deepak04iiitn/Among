/**
 * AMONG API client — Axios instance pre-configured for the backend.
 *
 * Auth flow:
 * - Uses backend-issued JWT (not Firebase ID token) for all API calls.
 * - The access token (15 min TTL) is stored in the Redux store.
 * - Before each request, if the token is within 60 seconds of expiry,
 *   the client silently refreshes via POST /api/auth/refresh.
 * - On 401, a single retry is attempted after refreshing the token.
 * - Falls back to sign-out if refresh fails.
 */

import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';
import { API_TIMEOUT_MS } from '../constants/limits';
import { API } from '../constants/apiEndpoints';

// ─── Token accessor ───────────────────────────────────────────────────────────
// Using a getter/setter so the apiClient never imports from the Redux store
// directly (prevents circular imports). The store injects these at startup.

type TokenGetter = () => { accessToken: string | null; tokenExpiresAt: number | null; refreshToken: string | null };
type TokenRefresher = () => Promise<void>;
type SignOutFn = () => void;

let _getTokens:    TokenGetter    = () => ({ accessToken: null, tokenExpiresAt: null, refreshToken: null });
let _refreshTokens: TokenRefresher = async () => {};
let _signOut:       SignOutFn     = () => {};

/** Called once during store setup to wire the apiClient to Redux state. */
export function configureApiClientAuth(
  getTokens:    TokenGetter,
  refreshTokens: TokenRefresher,
  signOut:      SignOutFn
): void {
  _getTokens     = getTokens;
  _refreshTokens = refreshTokens;
  _signOut        = signOut;
}

// ─── Error shape ─────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  code:    string;
  message: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code:       string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name       = 'ApiError';
    this.statusCode = statusCode;
    this.code       = code;
  }
}

// ─── Instance ────────────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL:         process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:4000',
  timeout:         API_TIMEOUT_MS,
  headers:         { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// ─── Request interceptor — attach backend JWT, proactive refresh ──────────────

const REFRESH_BEFORE_EXPIRY_MS = 60 * 1000; // refresh 60 s before expiry
let _refreshInProgress: Promise<void> | null = null;

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    // Skip auth header for public auth endpoints
    const url = config.url ?? '';
    if (isPublicAuthUrl(url)) {
      return config;
    }

    const { accessToken, tokenExpiresAt } = _getTokens();

    // Proactively refresh if token is close to expiry
    const aboutToExpire =
      tokenExpiresAt !== null && tokenExpiresAt - Date.now() < REFRESH_BEFORE_EXPIRY_MS;

    if (accessToken && aboutToExpire) {
      if (!_refreshInProgress) {
        _refreshInProgress = _refreshTokens().finally(() => { _refreshInProgress = null; });
      }
      await _refreshInProgress;
    }

    // Attach the (possibly just-refreshed) access token
    const { accessToken: freshToken } = _getTokens();
    if (freshToken) {
      config.headers['Authorization'] = `Bearer ${freshToken}`;
    }

    return config;
  },
  (error: unknown) => Promise.reject(error instanceof Error ? error : new Error(String(error)))
);

// ─── Response interceptor — normalize errors + 401 retry ─────────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    if (isAxiosError(error)) {
      const status = error.response?.status ?? 0;

      // On 401: attempt a single silent refresh, then retry the original request.
      // Wrong email/password is also 401 — never treat public auth as a stale token.
      const failedUrl = error.config?.url ?? '';
      const configExt = error.config as unknown as Record<string, unknown>;
      if (status === 401 && !configExt['_retry'] && !isPublicAuthUrl(failedUrl)) {
        try {
          if (!_refreshInProgress) {
            _refreshInProgress = _refreshTokens().finally(() => { _refreshInProgress = null; });
          }
          await _refreshInProgress;

          const { accessToken } = _getTokens();
          if (error.config && accessToken) {
            configExt['_retry'] = true;
            error.config.headers['Authorization'] = `Bearer ${accessToken}`;
            return apiClient(error.config);
          }
        } catch {
          _signOut();
        }
      }

      const data = error.response?.data as
        | { error?: ApiErrorBody; code?: string; message?: string }
        | undefined;
      const errBody =
        data?.error ??
        (data?.code && data?.message
          ? { code: data.code, message: data.message }
          : undefined);

      if (errBody?.code && errBody?.message) {
        return Promise.reject(new ApiError(status, errBody.code, errBody.message));
      }

      const code =
        status === 401 ? 'ERR_UNAUTHORIZED'
        : status === 403 ? 'ERR_FORBIDDEN'
        : status === 404 ? 'ERR_NOT_FOUND'
        : status === 429 ? 'ERR_RATE_LIMITED'
        : status >= 500  ? 'ERR_SERVER'
        : 'ERR_REQUEST_FAILED';

      const message = error.response?.statusText ?? error.message ?? 'An unexpected error occurred';
      return Promise.reject(new ApiError(status, code, message));
    }

    return Promise.reject(
      error instanceof Error ? error : new Error('Network request failed')
    );
  }
);

function isPublicAuthUrl(url: string): boolean {
  return (
    url.includes(API.AUTH_SESSION) ||
    url.includes(API.AUTH_REFRESH) ||
    url.includes(API.AUTH_REGISTER) ||
    url.includes(API.AUTH_LOGIN)
  );
}

export default apiClient;
