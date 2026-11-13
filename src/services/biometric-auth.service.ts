// Fingerprint / Face ID quick sign-in.
//
// The password is kept in the OS keystore behind the device's biometrics
// (expo-secure-store `requireAuthentication`: Android Keystore with user
// authentication required, iOS Keychain `biometryCurrentSet`). Reading it shows
// the system prompt; only a matching fingerprint or face releases it. The
// password then goes through the normal sign-in (offline first, server when
// needed), so biometrics never skip the tblUsers / device checks.
//
// Enrolling a new fingerprint or face invalidates the stored item, after which
// the user signs in with the password once and turns it on again.

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { LoginCredentials } from "@/types/auth";

const SECRET_KEY = "ekolekta.biometricCredential";
// A keychain service of its own: authenticated items need a freshly generated
// key and cannot share one with the app's other secure-store values.
const SECRET_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: "ekolekta.biometric",
  requireAuthentication: true,
  authenticationPrompt: "Sign in to eKolekta",
};
// Plain flags: readable without a prompt, so the screen knows what to offer.
const ENABLED_KEY = "ekolekta.biometricUser";
const DECLINED_KEY = "ekolekta.biometricDeclined";

export class BiometricError extends Error {
  name = "BiometricError";
}

/** The device has secure biometrics enrolled and the app can store behind them. */
export function isBiometricSupported(): boolean {
  if (Platform.OS === "web") return false;
  try {
    return SecureStore.canUseBiometricAuthentication();
  } catch {
    return false;
  }
}

/** Username (lower case) biometric sign-in is turned on for, if any. */
export async function getBiometricUser(): Promise<string | null> {
  if (!isBiometricSupported()) return null;
  return SecureStore.getItemAsync(ENABLED_KEY);
}

/** Whether to ask this user to turn biometric sign-in on. */
export async function shouldOfferBiometric(email: string): Promise<boolean> {
  if (!isBiometricSupported()) return false;
  const userName = normalize(email);
  return (
    (await SecureStore.getItemAsync(ENABLED_KEY)) !== userName &&
    (await SecureStore.getItemAsync(DECLINED_KEY)) !== userName
  );
}

/** Remembers "not now", so the offer is not repeated on every sign-in. */
export async function declineBiometric(email: string) {
  await SecureStore.setItemAsync(DECLINED_KEY, normalize(email));
}

/**
 * Stores the password behind biometrics. Android shows the prompt here too;
 * cancelling it rejects, and nothing is turned on.
 */
export async function enableBiometric(credentials: LoginCredentials) {
  const userName = normalize(credentials.email);
  await SecureStore.setItemAsync(
    SECRET_KEY,
    JSON.stringify({ email: userName, password: credentials.password }),
    SECRET_OPTIONS,
  );
  await SecureStore.setItemAsync(ENABLED_KEY, userName);
  await SecureStore.deleteItemAsync(DECLINED_KEY);
}

export async function disableBiometric() {
  if (Platform.OS === "web") return;
  await SecureStore.deleteItemAsync(SECRET_KEY, SECRET_OPTIONS).catch(() => {});
  await SecureStore.deleteItemAsync(ENABLED_KEY);
}

/** Shows the system biometric prompt and returns the stored credentials. */
export async function unlockWithBiometric(): Promise<LoginCredentials> {
  let json: string | null;
  try {
    json = await SecureStore.getItemAsync(SECRET_KEY, SECRET_OPTIONS);
  } catch {
    // Cancelled, too many tries, or biometrics unavailable right now.
    throw new BiometricError("Biometric sign-in was cancelled. Please try again or use your password.");
  }
  if (!json) {
    // Invalidated by a change in enrolled fingerprints / faces.
    await disableBiometric();
    throw new BiometricError(
      "Your fingerprint or face settings changed. Sign in with your password to turn biometric sign-in back on.",
    );
  }
  const { email, password } = JSON.parse(json) as { email: string; password: string };
  return { email, password, remember: true };
}

function normalize(email: string) {
  return email.trim().toLowerCase();
}
