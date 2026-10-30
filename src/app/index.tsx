import { Redirect, type Href } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useAppNotice } from '@/context/app-notice-context';
import { checkDeviceRegistration } from '@/services/device-check.service';
import { ensureServerSchema, hasServerSchema } from '@/services/schema.service';

const LOGIN_ROUTE: Href = '/(auth)/quick-sign-in';
const SIGN_UP_ROUTE: Href = '/(auth)/sign-up';

export default function Root() {
  const db = useSQLiteContext();
  const { showNotice } = useAppNotice();
  const [target, setTarget] = useState<Href | null>(null);

  // By the time this renders, DatabaseProvider has opened (or created) the local DB.
  // Gate on device registration — checked against the server when online, the
  // local copy otherwise: a registered device goes to login; an unknown (or
  // deactivated) device must sign up first.
  useEffect(() => {
    let cancelled = false;
    // First launch: create the shared-model tables from the server before any
    // screen needs them. Offline, the app runs on the built-in tables and
    // SyncProvider creates the rest once a connection appears.
    hasServerSchema(db)
      .then((has) => (has ? null : ensureServerSchema(db)))
      .then((result) => {
        if (result?.status === 'error') console.log('Local database setup deferred:', result.error);
      })
      .catch((e) => console.warn('Local database setup failed', e))
      .then(() => checkDeviceRegistration(db))
      .then(({ registered, server }) => {
        // The app keeps working from local data either way; just tell the user.
        if (!cancelled && server === 'offline') {
          showNotice(
            'warning',
            "You're offline",
            'You can keep using the app. Your changes are saved on this device and will sync once you reconnect.',
          );
        } else if (!cancelled && server === 'unreachable') {
          showNotice(
            'warning',
            'Unable to reach the server',
            'You can keep using the app offline. Your changes are saved on this device and will sync once the server is available.',
          );
        }
        return registered;
      })
      .catch((e) => {
        console.warn('Device registration check failed', e);
        return false;
      })
      .then((registered) => {
        if (!cancelled) setTarget(registered ? LOGIN_ROUTE : SIGN_UP_ROUTE);
      });
    return () => {
      cancelled = true;
    };
  }, [db, showNotice]);

  // Splash overlay is on top while this resolves; match its colour to avoid a flash.
  if (!target) return <View style={{ flex: 1, backgroundColor: '#022c22' }} />;

  // TODO: when real sessions exist, send an authenticated user straight to /(tabs)/.
  return <Redirect href={target} />;
}
