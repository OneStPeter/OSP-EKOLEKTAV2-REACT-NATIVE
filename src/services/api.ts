// Thin HTTP clients for the two servers the app talks to. Set in `.env`:
//   EXPO_PUBLIC_API_URL          OSP-LIFEPLAN-OPERATION-API, incl. /api — auth, device check, schema
//   EXPO_PUBLIC_SYNC_WORKER_URL  OSP-SYNC-WORKER-API, incl. /api — every data write and pull
//   EXPO_PUBLIC_SYNC_API_KEY     signs this app in to the sync worker as the EKOLEKTA node
// While one is unset the features that need it are skipped and the app runs offline.

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";
const SYNC_WORKER_URL =
  process.env.EXPO_PUBLIC_SYNC_WORKER_URL?.replace(/\/+$/, "") ?? "";
const SYNC_API_KEY = process.env.EXPO_PUBLIC_SYNC_API_KEY ?? "";
const TIMEOUT_MS = 30_000;

let authToken: string | null = null;
let refreshHandler: (() => Promise<boolean>) | null = null;

export const isApiConfigured = API_URL.length > 0;
export const isSyncWorkerConfigured = SYNC_WORKER_URL.length > 0;

/** Access token (JWT) sent as `Authorization: Bearer` to the operations API. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/**
 * Called once when a bearer request comes back 401 (the access token expired).
 * Resolves true when it obtained a new token, and the request is then retried.
 */
export function setAuthRefreshHandler(handler: (() => Promise<boolean>) | null) {
  refreshHandler = handler;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** 4xx (other than timeout / rate-limit) won't succeed by retrying the same request. */
  get isRetryable() {
    return (
      this.status === 0 ||
      this.status === 408 ||
      this.status === 429 ||
      this.status >= 500
    );
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type RequestOptions = {
  timeoutMs?: number;
  headers?: Record<string, string>;
  /** false for the auth endpoints themselves: no bearer token, no refresh-and-retry. */
  auth?: boolean;
};

export async function apiRequest<T = unknown>(
  method: Method,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  if (!isApiConfigured) throw new ApiError("API URL is not configured.", 0);

  const useAuth = options?.auth !== false;
  const send = () =>
    request<T>(API_URL, method, path, body, {
      ...options,
      headers: {
        ...options?.headers,
        ...(useAuth && authToken && { Authorization: `Bearer ${authToken}` }),
      },
    });

  const hadToken = useAuth && authToken !== null;
  try {
    return await send();
  } catch (e) {
    if (
      !(e instanceof ApiError) ||
      e.status !== 401 ||
      !hadToken ||
      !refreshHandler ||
      !(await refreshHandler())
    ) {
      throw e;
    }
    return send();
  }
}

export function syncWorkerRequest<T = unknown>(
  method: Method,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  if (!isSyncWorkerConfigured) {
    return Promise.reject(
      new ApiError("Sync worker URL is not configured.", 0),
    );
  }
  // Every worker endpoint requires the node's key.
  return request<T>(SYNC_WORKER_URL, method, path, body, {
    ...options,
    headers: { "X-Api-Key": SYNC_API_KEY, ...options?.headers },
  });
}

async function request<T>(
  baseUrl: string,
  method: Method,
  path: string,
  body: unknown,
  { timeoutMs = TIMEOUT_MS, headers: requestHeaders }: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...requestHeaders,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ApiError(
        text || `Request failed with status ${res.status}`,
        res.status,
      );
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    // Network failure or timeout — treat as retryable.
    throw new ApiError(e instanceof Error ? e.message : "Network error", 0);
  } finally {
    clearTimeout(timer);
  }
}
