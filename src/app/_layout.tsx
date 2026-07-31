import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SplashOverlay } from '@/components/SplashOverlay';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
          <SplashOverlay />
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
