// Offline-first sign-in. The server is asked only when the device cannot decide:
//
//   Signs in on the device (no network) when ALL of these hold:
//     • this username signed in online here before (a password verifier is saved)
//     • the account's records were migrated (account_migrated:<PersonID> in sync_meta)
//     • the reference pull from BPIS completed (bpis-pull.service)
//     • the local tblDeviceRegistration row for this device is that person's, IsActive = 1
//   Otherwise — first launch, empty database, migration unfinished, or a wrong
//   password that might be a new one set on the server — it goes online
//   (auth.service → POST /Auth/device/login).
//
// The verifier is PBKDF2-SHA256 of the password with a random salt, made on the
// device right after the server accepted that password; the server's own hash
// never leaves the server. It is kept in the OS keystore (expo-secure-store),
// not in SQLite. Repeated wrong passwords lock offline sign-in until the next
// successful online one.

import { pbkdf2Async } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha2";
import { getRandomBytes } from "expo-crypto";
import type { SQLiteDatabase } from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { getDeviceRegistration } from "@/db/repositories/device-registration.repository";
import { getPerson } from "@/db/repositories/person.repository";
import { deleteMeta, getMeta, setMeta } from "@/db/sync-queue";
import { hasCompletedBpisPull } from "@/services/bpis-pull.service";
import { getDeviceId } from "@/services/device.service";
import type { AuthUser, LoginCredentials } from "@/types/auth";

const CREDENTIAL_KEY = "ekolekta.offlineCredential";
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};
// Same limit as the server (Auth:MaxLoginAttempts).
const MAX_OFFLINE_ATTEMPTS = 3;
// Pure-JS PBKDF2 on Hermes: high enough to slow guessing, low enough to keep
// sign-in under about a second on a mid-range phone. The verifier also sits
// behind the keystore, so this is the second line of defence.
const PBKDF2_ITERATIONS = 25_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

// Web has no keystore: it always signs in online.
const isSupported = Platform.OS !== "web";

type OfflineCredential = {
  version: 1;
  /** Trimmed, lower-case tblUsers.UserName. */
  userName: string;
  user: AuthUser;
  salt: string; // hex
  hash: string; // hex
  iterations: number;
  failedAttempts: number;
  verifiedAt: string; // last online confirmation
};

export type OfflineSignIn =
  | { status: "ok"; user: AuthUser }
  /** Nothing on this device to check against: sign in online. */
  | { status: "unavailable" }
  | { status: "invalid" }
  | { status: "locked" };

const migratedKey = (personId: string) => `account_migrated:${personId}`;

/** Records that `migrateAccount` copied this person's records into the local database. */
export function markAccountMigrated(db: SQLiteDatabase, personId: string) {
  return setMeta(db, migratedKey(personId), new Date().toISOString());
}

/**
 * True when the local database holds everything this person needs to work
 * without the server, and the device is still registered to them.
 */
export async function isAccountReadyOffline(
  db: SQLiteDatabase,
  personId: string,
): Promise<boolean> {
  if ((await getMeta(db, migratedKey(personId))) === null) return false;
  if (!(await getPerson(db, personId))) return false;

  // The startup check drops this row when the server reports the device inactive.
  const device = await getDeviceRegistration(db, await getDeviceId());
  if (!device || device.IsActive !== 1 || device.PersonID !== personId) return false;

  return hasCompletedBpisPull(db);
}

/** Checks the password against the verifier saved by the last online sign-in. */
export async function signInOffline(
  db: SQLiteDatabase,
  credentials: LoginCredentials,
): Promise<OfflineSignIn> {
  const credential = await readCredential();
  if (!credential || credential.userName !== normalize(credentials.email)) {
    return { status: "unavailable" };
  }
  if (!(await isAccountReadyOffline(db, credential.user.id))) {
    return { status: "unavailable" };
  }
  if (credential.failedAttempts >= MAX_OFFLINE_ATTEMPTS) return { status: "locked" };

  const hash = await derive(credentials.password, credential.salt, credential.iterations);
  if (!constantTimeEqual(hash, credential.hash)) {
    const failedAttempts = credential.failedAttempts + 1;
    await writeCredential({ ...credential, failedAttempts });
    return { status: failedAttempts >= MAX_OFFLINE_ATTEMPTS ? "locked" : "invalid" };
  }

  if (credential.failedAttempts > 0) {
    await writeCredential({ ...credential, failedAttempts: 0 });
  }
  return { status: "ok", user: credential.user };
}

/**
 * Saves a verifier for a password the server has just accepted, replacing any
 * other account's: a device is registered to one person.
 */
export async function saveOfflineCredential(credentials: LoginCredentials, user: AuthUser) {
  if (!isSupported) return;
  const salt = toHex(getRandomBytes(SALT_BYTES));
  await writeCredential({
    version: 1,
    userName: normalize(credentials.email),
    user,
    salt,
    hash: await derive(credentials.password, salt, PBKDF2_ITERATIONS),
    iterations: PBKDF2_ITERATIONS,
    failedAttempts: 0,
    verifiedAt: new Date().toISOString(),
  });
}

/** The account that last signed in on this device, for the quick sign-in screen. */
export async function getRememberedAccount(): Promise<AuthUser | null> {
  return (await readCredential())?.user ?? null;
}

/** Forgets the offline sign-in, e.g. after the server rejected the account. */
export async function clearOfflineCredential(db?: SQLiteDatabase) {
  if (!isSupported) return;
  const credential = await readCredential();
  await SecureStore.deleteItemAsync(CREDENTIAL_KEY, SECURE_OPTIONS);
  if (db && credential) await deleteMeta(db, migratedKey(credential.user.id));
}

async function readCredential(): Promise<OfflineCredential | null> {
  if (!isSupported) return null;
  const json = await SecureStore.getItemAsync(CREDENTIAL_KEY, SECURE_OPTIONS);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as OfflineCredential;
    return parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

function writeCredential(credential: OfflineCredential) {
  return SecureStore.setItemAsync(CREDENTIAL_KEY, JSON.stringify(credential), SECURE_OPTIONS);
}

async function derive(password: string, saltHex: string, iterations: number) {
  const key = await pbkdf2Async(sha256, password, fromHex(saltHex), {
    c: iterations,
    dkLen: KEY_BYTES,
  });
  return toHex(key);
}

function normalize(userName: string) {
  return userName.trim().toLowerCase();
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}
