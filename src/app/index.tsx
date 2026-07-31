import { Redirect } from 'expo-router';

export default function Root() {
  // TODO: replace with real auth check — redirect to /(tabs)/ when authenticated,
  // and to /(auth)/login instead of quick-sign-in when there's no remembered session
  return <Redirect href="/(auth)/quick-sign-in" />;
}
