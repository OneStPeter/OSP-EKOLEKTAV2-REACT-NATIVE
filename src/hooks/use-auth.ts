import { router as globalRouter, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useAppNotice } from '@/context/app-notice-context';
import { registerCurrentDevice } from '@/db/repositories/device-registration.repository';
import { getNodeIdentity, saveNodeIdentity } from '@/db/sync-queue';
import { migrateAccount } from '@/services/account-sync.service';
import {
  AuthError,
  loginWithCredentials,
  loginWithSocial,
  logout,
} from '@/services/auth.service';
import {
  declineBiometric,
  disableBiometric,
  enableBiometric,
  shouldOfferBiometric,
  unlockWithBiometric,
} from '@/services/biometric-auth.service';
import { startBpisPull } from '@/services/bpis-pull.service';
import { isOnline } from '@/services/network.service';
import {
  clearOfflineCredential,
  markAccountMigrated,
  saveOfflineCredential,
  signInOffline,
} from '@/services/offline-auth.service';
import type { AuthUser, LoginCredentials, SocialProvider } from '@/types/auth';

// Server answers that mean the account or device may no longer be used.
const REJECTED = new Set([401, 403, 423]);

const OFFLINE_UNAVAILABLE =
  'An internet connection is needed to sign in for the first time, or until your records have finished downloading to this device.';
const OFFLINE_LOCKED = 'Too many failed attempts. Connect to the internet to sign in.';
const INVALID_CREDENTIALS = 'Invalid email or password.';

export function useAuth() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { showNotice } = useAppNotice();
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Device registration must never block sign-in; it retries on the next login.
  async function registerDevice(user: AuthUser) {
    try {
      await registerCurrentDevice(db, user.id, user.email);
    } catch (e) {
      console.warn('Device registration failed', e);
    }
  }

  /**
   * Makes the signed-in agent this device's sync identity: the BPIS pull asks for
   * their SalesForceCode, and outgoing events are addressed by it and the branch.
   * An account without a sales force row leaves the saved identity as it is.
   */
  async function saveIdentity(user: AuthUser) {
    if (!user.salesForceCode) {
      console.log('No sales force code for', user.id, '- BPIS pull skipped.');
      return;
    }
    const current = await getNodeIdentity(db);
    await saveNodeIdentity(db, {
      salesForceCode: user.salesForceCode,
      branch: user.branch ?? current.branch,
    });
  }

  // The server has verified the account: copy its records (person, addresses,
  // plans, beneficiaries) into the local database before the first screen.
  // Offline or failing, sign-in still goes ahead on local data.
  async function prepareAccount(user: AuthUser) {
    await saveIdentity(user);
    await registerDevice(user);
    const result = await migrateAccount(db, user.id);
    if (result.status === 'ok' && result.found) await markAccountMigrated(db, user.id);
    if (result.status === 'error') console.log('Account records not copied:', result.error);
    // In the background: the dashboard shows its progress.
    void startBpisPull(db);
  }

  function enterApp() {
    // @ts-expect-error — expo-router typed routes don't expose group segment paths
    router.replace('/(tabs)/');
  }

  /** Ends offline and biometric access on this device and returns to sign-in. */
  async function revokeLocalAccess(message: string) {
    await clearOfflineCredential(db);
    await disableBiometric();
    await logout();
    showNotice('error', 'Signed out', message);
    globalRouter.replace('/(auth)/quick-sign-in');
  }

  /**
   * After an offline sign-in, confirms the password with the server when there is
   * a connection, without holding the user up. That also picks up a session for
   * API calls and a fresh verifier. A rejection (password changed, account or
   * device deactivated, account locked) ends the offline access on this device.
   */
  async function revalidateOnline(credentials: LoginCredentials) {
    if (!(await isOnline())) return;
    try {
      const user = await loginWithCredentials(credentials);
      await saveIdentity(user);
      await saveOfflineCredential(credentials, user);
    } catch (e) {
      if (!(e instanceof AuthError) || !REJECTED.has(e.status)) return; // network / server: keep working offline
      await revokeLocalAccess(
        e.status === 401
          ? 'Your password has changed or your account is inactive. Please sign in again.'
          : e.message,
      );
    }
  }

  /**
   * Offline first: checks the password on the device, and asks the server only
   * when the device cannot decide. Throws on failure; enters the app on success.
   */
  async function authenticate(credentials: LoginCredentials) {
    const offline = await signInOffline(db, credentials);
    if (offline.status === 'ok') {
      await saveIdentity(offline.user);
      enterApp();
      void revalidateOnline(credentials);
      return;
    }

    // The device cannot decide (or the password may have changed on the
    // server): ask the server, which needs a connection.
    if (!(await isOnline())) {
      if (offline.status === 'invalid') throw new AuthError(INVALID_CREDENTIALS, 401);
      throw new Error(offline.status === 'locked' ? OFFLINE_LOCKED : OFFLINE_UNAVAILABLE);
    }

    const user = await loginWithCredentials(credentials);
    await prepareAccount(user);
    try {
      await saveOfflineCredential(credentials, user);
    } catch (e) {
      console.warn('Offline sign-in not saved', e);
    }
    enterApp();
  }

  /** After a password sign-in, offers fingerprint / Face ID for the next one. */
  async function offerBiometric(credentials: LoginCredentials) {
    if (!(await shouldOfferBiometric(credentials.email))) return;
    Alert.alert(
      'Sign in faster next time?',
      'Use your fingerprint or face to sign in to eKolekta on this device.',
      [
        { text: 'Not now', style: 'cancel', onPress: () => void declineBiometric(credentials.email) },
        {
          text: 'Turn on',
          onPress: () =>
            void enableBiometric(credentials).catch((e) =>
              console.log('Biometric sign-in not turned on:', String(e)),
            ),
        },
      ],
    );
  }

  /** Password sign-in. Resolves true when the user is signed in. */
  async function signIn(credentials: LoginCredentials): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      await authenticate(credentials);
      void offerBiometric(credentials).catch(() => {});
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fingerprint / Face ID: the system prompt releases the stored password, which
   * then signs in like a typed one. Throws, so the login form shows the reason.
   */
  async function signInWithBiometric() {
    setError(null);
    const credentials = await unlockWithBiometric();
    try {
      await authenticate(credentials);
    } catch (e) {
      // The stored password is no longer the account's.
      if (e instanceof AuthError && e.status === 401) {
        await disableBiometric();
        throw new Error('Your password has changed. Sign in with your password to turn biometric sign-in back on.');
      }
      throw e;
    }
  }

  async function signInWithSocial(provider: SocialProvider) {
    setSocialLoading(provider);
    setError(null);
    try {
      const user = await loginWithSocial(provider);
      await prepareAccount(user);
      enterApp();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Social sign in failed.');
    } finally {
      setSocialLoading(null);
    }
  }

  return { loading, socialLoading, error, signIn, signInWithBiometric, signInWithSocial };
}
