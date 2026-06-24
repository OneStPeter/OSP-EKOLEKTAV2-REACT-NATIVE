import { useRouter } from 'expo-router';
import { useState } from 'react';

import { loginWithCredentials, loginWithSocial } from '@/services/auth.service';
import type { LoginCredentials, SocialProvider } from '@/types/auth';

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(credentials: LoginCredentials) {
    setLoading(true);
    setError(null);
    try {
      await loginWithCredentials(credentials);
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
      await loginWithSocial(provider);
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
