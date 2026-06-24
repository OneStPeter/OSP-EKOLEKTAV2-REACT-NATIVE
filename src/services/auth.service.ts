import type { AuthUser, LoginCredentials, SocialProvider } from '@/types/auth';

export async function loginWithCredentials(credentials: LoginCredentials): Promise<AuthUser> {
  // TODO: replace with real API call
  await new Promise((r) => setTimeout(r, 1200));

  if (credentials.email === 'demo@stpeter.com.ph' && credentials.password === 'password') {
    return { id: '1', email: credentials.email, name: 'Demo User', role: 'agent' };
  }

  throw new Error('Invalid email or password.');
}

export async function loginWithSocial(provider: SocialProvider): Promise<AuthUser> {
  // TODO: integrate OAuth / Supabase social login
  await new Promise((r) => setTimeout(r, 900));
  throw new Error(`${provider} login is not yet configured.`);
}

export async function logout(): Promise<void> {
  // TODO: clear tokens / session
}
