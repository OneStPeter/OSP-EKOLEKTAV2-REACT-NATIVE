import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useColorScheme } from 'react-native';

const LIGHT = { bg: '#ffffff', indicator: '#F0F0F3', text: '#000000' };
const DARK = { bg: '#000000', indicator: '#212225', text: '#ffffff' };

export default function TabsLayout() {
  const scheme = useColorScheme();
  const c = scheme === 'dark' ? DARK : LIGHT;

  return (
    <NativeTabs
      backgroundColor={c.bg}
      indicatorColor={c.indicator}
      labelStyle={{ selected: { color: c.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
