import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';

import { registerCurrentDevice } from '@/db/repositories/device-registration.repository';
import { migrateAccount } from '@/services/account-sync.service';
import { loginWithCredentials, loginWithSocial } from '@/services/auth.service';
import type { AuthUser, LoginCredentials, SocialProvider } from '@/types/auth';

export function useAuth() {
  const router = useRouter();
  const db = useSQLiteContext();
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

  // The server has verified the account: copy its records (person, addresses,
  // plans, beneficiaries) into the local database before the first screen.
  // Offline or failing, sign-in still goes ahead on local data.
  async function prepareAccount(user: AuthUser) {
    await registerDevice(user);
    const result = await migrateAccount(db, user.id);
    if (result.status === 'error') console.log('Account records not copied:', result.error);
  }

  async function signIn(credentials: LoginCredentials) {
    setLoading(true);
    setError(null);
    try {
      const user = await loginWithCredentials(credentials);
      await prepareAccount(user);
      // @ts-expect-error — expo-router typed routes don't expose group segment paths
      router.replace('/(tabs)/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  async function signInWithSocial(provider: SocialProvider) {
    setSocialLoading(provider);
    setError(null);
    try {
      const user = await loginWithSocial(provider);
      await prepareAccount(user);
      // @ts-expect-error — expo-router typed routes don't expose group segment paths
      router.replace('/(tabs)/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Social sign in failed.');
    } finally {
      setSocialLoading(null);
    }
  }

  return { loading, socialLoading, error, signIn, signInWithSocial };
}
