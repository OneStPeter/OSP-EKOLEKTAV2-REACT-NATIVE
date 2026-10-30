// Thin HTTP clients for the two servers the app talks to. Set in `.env`:
//   EXPO_PUBLIC_API_URL          OSP-LIFEPLAN-OPERATION-API, incl. /api — auth, device check, schema
//   EXPO_PUBLIC_SYNC_WORKER_URL  OSP-SYNC-WORKER-API, incl. /api — every data write and pull
// While one is unset the features that need it are skipped and the app runs offline.

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";
const SYNC_WORKER_URL =
  process.env.EXPO_PUBLIC_SYNC_WORKER_URL?.replace(/\/+$/, "") ?? "";
const TIMEOUT_MS = 15_000;

let authToken: string | null = null;

export const isApiConfigured = API_URL.length > 0;
export const isSyncWorkerConfigured = SYNC_WORKER_URL.length > 0;

export function setAuthToken(token: string | null) {
  authToken = token;
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
type RequestOptions = { timeoutMs?: number; headers?: Record<string, string> };

export function apiRequest<T = unknown>(
  method: Method,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  if (!isApiConfigured)
    return Promise.reject(new ApiError("API URL is not configured.", 0));
  return request<T>(API_URL, method, path, body, options);
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
  return request<T>(SYNC_WORKER_URL, method, path, body, options);
}

async function request<T>(
  baseUrl: string,
  method: Method,
  path: string,
  body: unknown,
  { timeoutMs = TIMEOUT_MS }: RequestOptions = {},
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
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
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
