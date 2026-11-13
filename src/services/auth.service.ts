// Password sign-in against OSP-LIFEPLAN-OPERATION-API (PISv6):
//
//   POST {API}/Auth/device/login    { userName, userPassword, deviceId, deviceType }
//     200 → { personId, email, userFullName, userAvatar, salesForceCode, orgUnitCode,
//             accessToken, sessionToken, expiresIn }
//     401 wrong username/password or inactive user (tblUsers)
//     403 device not registered / inactive / different type / another user's (tblDeviceRegistration)
//     423 account locked after too many failed attempts
//   POST {API}/Auth/device/refresh  { sessionToken, deviceId }  → { accessToken, sessionToken, expiresIn }
//   POST {API}/Auth/device/logout   { sessionToken }            → 204
//
// The access token is a JWT signed with the API's Jwt:Key; it lives in memory only
// and is sent as `Authorization: Bearer`. The session token (single use, rotated on
// every refresh) is kept in the device keystore when "Remember me" is ticked.

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import {
  ApiError,
  apiRequest,
  isApiConfigured,
  setAuthRefreshHandler,
  setAuthToken,
} from "@/services/api";
import { getDeviceId, getDeviceType } from "@/services/device.service";
import type { AuthUser, LoginCredentials, SocialProvider } from "@/types/auth";

const SESSION_KEY = "ekolekta.sessionToken";
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};
// Web has no keystore; its session is never written anywhere.
const canPersist = Platform.OS !== "web";

type TokenResponse = {
  accessToken: string;
  sessionToken: string;
  expiresIn: number;
};

type LoginResponse = TokenResponse & {
  personId: string;
  email: string;
  userFullName: string;
  userAvatar: string;
  salesForceCode: string | null;
  orgUnitCode: string | null;
};

let sessionToken: string | null = null;
let persistSession = false;
let refreshing: Promise<boolean> | null = null;

setAuthRefreshHandler(refreshSession);

export class AuthError extends Error {
  name = "AuthError";
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function loginWithCredentials(
  credentials: LoginCredentials,
): Promise<AuthUser> {
  if (!isApiConfigured) {
    throw new AuthError("Sign in is unavailable: the server is not configured.", 0);
  }

  let res: LoginResponse;
  try {
    res = await apiRequest<LoginResponse>(
      "POST",
      "/Auth/device/login",
      {
        userName: credentials.email.trim(),
        userPassword: credentials.password,
        deviceId: await getDeviceId(),
        deviceType: getDeviceType(),
      },
      { auth: false },
    );
  } catch (e) {
    throw toAuthError(e);
  }

  await saveSession(res, credentials.remember);

  return {
    id: res.personId,
    email: res.email || credentials.email.trim(),
    name: res.userFullName,
    role: "agent",
    salesForceCode: res.salesForceCode?.trim() || null,
    branch: res.orgUnitCode?.trim() || null,
  };
}

/**
 * Exchanges the session token for a fresh token pair. Concurrent callers share one
 * request: the server burns the whole session if a spent token is presented twice.
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= doRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function doRefresh(): Promise<boolean> {
  const token = sessionToken ?? (await readStoredSession());
  if (!token) return false;

  try {
    const res = await apiRequest<TokenResponse>(
      "POST",
      "/Auth/device/refresh",
      { sessionToken: token, deviceId: await getDeviceId() },
      { auth: false },
    );
    // A stored session stays stored after a restart.
    await saveSession(res, persistSession || sessionToken === null);
    return true;
  } catch (e) {
    // Rejected (expired, revoked, device deactivated): sign-in is needed again.
    // A network failure keeps the session for the next try.
    if (e instanceof ApiError && !e.isRetryable) await clearSession();
    return false;
  }
}

export async function loginWithSocial(
  provider: SocialProvider,
): Promise<AuthUser> {
  // TODO: integrate OAuth / Supabase social login
  await new Promise((r) => setTimeout(r, 900));
  throw new Error(`${provider} login is not yet configured.`);
}

/** Revokes the session on the server (best effort) and forgets it on the device. */
export async function logout(): Promise<void> {
  const token = sessionToken ?? (await readStoredSession());
  await clearSession();
  if (!token || !isApiConfigured) return;
  try {
    await apiRequest("POST", "/Auth/device/logout", { sessionToken: token }, { auth: false });
  } catch (e) {
    console.log("Server logout failed:", String(e));
  }
}

async function saveSession(tokens: TokenResponse, remember: boolean) {
  setAuthToken(tokens.accessToken);
  sessionToken = tokens.sessionToken;
  persistSession = remember && canPersist;
  if (!canPersist) return;
  if (persistSession) {
    await SecureStore.setItemAsync(SESSION_KEY, tokens.sessionToken, SECURE_OPTIONS);
  } else {
    await SecureStore.deleteItemAsync(SESSION_KEY, SECURE_OPTIONS);
  }
}

async function clearSession() {
  setAuthToken(null);
  sessionToken = null;
  persistSession = false;
  if (canPersist) await SecureStore.deleteItemAsync(SESSION_KEY, SECURE_OPTIONS);
}

async function readStoredSession(): Promise<string | null> {
  if (!canPersist) return null;
  return SecureStore.getItemAsync(SESSION_KEY, SECURE_OPTIONS);
}

function toAuthError(e: unknown): AuthError {
  const status = e instanceof ApiError ? e.status : 0;
  switch (status) {
    case 0:
      return new AuthError(
        "Unable to reach the server. Please check your connection and try again.",
        0,
      );
    case 401:
      return new AuthError("Invalid email or password.", 401);
    case 403:
    case 423:
      return new AuthError(
        serverMessage(e) ??
          (status === 423
            ? "This account is locked. Please contact your administrator."
            : "This device is not allowed to sign in. Please contact your administrator."),
        status,
      );
    default:
      return new AuthError("Sign in failed because of a server error. Please try again.", status);
  }
}

/** The `message` of the API's `{ message }` error body, if there is one. */
function serverMessage(e: unknown): string | null {
  if (!(e instanceof Error)) return null;
  try {
    const body = JSON.parse(e.message) as { message?: unknown };
    return typeof body.message === "string" ? body.message : null;
  } catch {
    return null;
  }
}
