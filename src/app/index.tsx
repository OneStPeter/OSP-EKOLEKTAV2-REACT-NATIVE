import { Redirect } from 'expo-router';

export default function Root() {
  // TODO: replace with real auth check — redirect to /(tabs)/ when authenticated
  return <Redirect href="/(auth)/login" />;
}
