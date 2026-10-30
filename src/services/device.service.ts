// Stable, unique identifier for this physical device (tblDeviceRegistration.DeviceID).
//
// Android — Settings.Secure.ANDROID_ID: unique per device + user + app-signing key,
//           and survives app reinstall. Changes only on factory reset or a new signing key.
// iOS     — identifierForVendor, persisted in the Keychain. IDFV alone changes when every
//           app from this vendor is uninstalled; the Keychain copy survives reinstall.
//           `THIS_DEVICE_ONLY` keeps the ID out of backups, so restoring a backup onto
//           a new phone does not clone the old phone's identity.
// Web     — random UUID in localStorage (per browser profile; best effort only).

import * as Application from "expo-application";
import { randomUUID } from "expo-crypto";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const STORAGE_KEY = "ekolekta.deviceId";
const MAX_LENGTH = 100; // varchar(100) on the server

let cached: Promise<string> | null = null;

/** Returns this device's ID, e.g. "android-dd96dec43fb81c97" or "ios-68753A44-…". */
export function getDeviceId(): Promise<string> {
  cached ??= resolveDeviceId().catch((e) => {
    cached = null; // let the next call retry
    throw e;
  });
  return cached;
}

async function resolveDeviceId(): Promise<string> {
  switch (Platform.OS) {
    case "android":
      // return `android-${Application.getAndroidId()}`;
      return `${Application.getAndroidId()}`;

    case "ios": {
      const options: SecureStore.SecureStoreOptions = {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      };
      const stored = await SecureStore.getItemAsync(STORAGE_KEY, options);
      if (stored) return stored;

      // IDFV can be null right after a reboot before first unlock — fall back to a UUID.
      const idfv = await Application.getIosIdForVendorAsync();
      // const id = `ios-${idfv ?? randomUUID()}`;
      const id = `${idfv ?? randomUUID()}`;

      await SecureStore.setItemAsync(STORAGE_KEY, id, options);
      return id;
    }

    default: {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return stored;
        const id = `web-${randomUUID()}`;
        localStorage.setItem(STORAGE_KEY, id);
        return id;
      } catch {
        // Storage blocked (private mode): ID is stable only for this session.
        return `web-${randomUUID()}`;
      }
    }
  }
}

/** Human-readable device description for tblDeviceRegistration.DeviceType. */
export function getDeviceType(): string {
  const os = [Device.osName ?? Platform.OS, Device.osVersion]
    .filter(Boolean)
    .join(" ");
  const model = [Device.manufacturer, Device.modelName]
    .filter(Boolean)
    .join(" ");
  const label = model ? `${os} - ${model}` : os;
  return label.slice(0, MAX_LENGTH);
}
