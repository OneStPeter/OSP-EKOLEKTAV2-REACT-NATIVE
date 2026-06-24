import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type SocialProvider = 'google' | 'facebook' | 'x';

interface SocialButtonProps {
  provider: SocialProvider;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

const PROVIDER_CONFIG: Record<SocialProvider, { label: string; source: number }> = {
  google: { label: 'Google', source: require('@/assets/images/icons8-google-48.png') },
  facebook: { label: 'Facebook', source: require('@/assets/images/icons8-meta-48.png') },
  x: { label: 'X', source: require('@/assets/images/icons8-x-48.png') },
};

export function SocialButton({ provider, loading, disabled, onPress }: SocialButtonProps) {
  const cfg = PROVIDER_CONFIG[provider];

  return (
    <TouchableOpacity
      style={[styles.btn, disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}>
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator size="small" color="#6b7280" />
        ) : (
          <Image source={cfg.source} style={styles.icon} contentFit="contain" />
        )}
        <Text style={styles.label}>{cfg.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  inner: {
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    width: 24,
    height: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
});
