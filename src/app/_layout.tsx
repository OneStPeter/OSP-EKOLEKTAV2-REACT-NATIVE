import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SplashOverlay } from '@/components/SplashOverlay';
import { AppNoticeProvider } from '@/context/app-notice-context';
import { DatabaseProvider } from '@/db/DatabaseProvider';

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        <View style={{ flex: 1 }}>
          {/* Launch notices (e.g. "can't reach the server") wait for the splash. */}
          <AppNoticeProvider ready={splashDone}>
            {/* Screens mount only after the local DB is opened and migrated. */}
            <DatabaseProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </DatabaseProvider>
          </AppNoticeProvider>
          <SplashOverlay onFinish={() => setSplashDone(true)} />
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
