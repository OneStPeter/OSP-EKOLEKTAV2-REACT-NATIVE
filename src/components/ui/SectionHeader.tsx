import React from "react";
import { View, Text, StyleProp, ViewStyle } from "react-native";
import { theme } from "./theme";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({ title, subtitle, style }: SectionHeaderProps) {
  return (
    <View style={[{ marginBottom: 10 }, style]}>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: theme.color.ink,
          letterSpacing: -0.2,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontSize: 12,
            color: theme.color.muted,
            marginTop: 1,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
