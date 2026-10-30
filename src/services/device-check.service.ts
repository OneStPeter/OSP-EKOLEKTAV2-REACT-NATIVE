// Startup gate: is this device registered (tblDeviceRegistration)?
//
// 1. Online + API configured → ask the server (source of truth):
//      GET {API}/Auth/device/verify?deviceId={DeviceID}   (anonymous)
//        200 → { exists: boolean }   true only for an active (IsActive = 1) row
//    The answer is cached locally for the next offline launch.
// 2. Offline, API unset, timeout or server error → fall back to the local copy.

import NetInfo from "@react-native-community/netinfo";
import type { SQLiteDatabase } from "expo-sqlite";

import {
  cacheServerDeviceVerification,
  isCurrentDeviceRegistered,
} from "@/db/repositories/device-registration.repository";
import { apiRequest, isApiConfigured } from "@/services/api";
import { getDeviceId } from "@/services/device.service";

// Keep the splash short when the server is slow; we fall back to local data.
const SERVER_CHECK_TIMEOUT_MS = 30_000;

export type DeviceCheckResult = {
  registered: boolean;
  /**
   * How the server check went:
   *   "ok"          — server answered
   *   "offline"     — device has no connection
   *   "unreachable" — online, but the API failed / timed out
   *   "disabled"    — no API URL configured (offline-only build)
   * Anything but "ok" means `registered` came from local data.
   */
  server: "ok" | "offline" | "unreachable" | "disabled";
};

export async function checkDeviceRegistration(
  db: SQLiteDatabase,
): Promise<DeviceCheckResult> {
  const deviceId = await getDeviceId();
  const local = async (
    server: DeviceCheckResult["server"],
  ): Promise<DeviceCheckResult> => ({
    registered: await isCurrentDeviceRegistered(db),
    server,
  });

  if (!isApiConfigured) return local("disabled");
  if (!(await isOnline())) return local("offline");

  try {
    const { exists } = await apiRequest<{ exists: boolean }>(
      "GET",
      `/Auth/device/verify?deviceId=${encodeURIComponent(deviceId)}`,
      undefined,
      { timeoutMs: SERVER_CHECK_TIMEOUT_MS },
    );
    await cacheServerDeviceVerification(db, deviceId, exists === true);
  } catch (e) {
    // Expected when the API is down; the caller shows the user a notice.
    console.log("Server device check failed; using local data:", String(e));
    return local("unreachable");
  }
  // Re-read locally so an offline sign-up still waiting to upload counts too.
  return local("ok");
}

async function isOnline() {
  const state = await NetInfo.fetch();
  return !!state.isConnected && state.isInternetReachable !== false;
}
