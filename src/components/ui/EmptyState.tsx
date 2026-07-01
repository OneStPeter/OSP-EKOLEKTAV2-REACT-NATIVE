import React from "react";
import { View, Text, StyleProp, ViewStyle } from "react-native";
import { theme } from "./theme";

interface EmptyStateProps {
  icon?: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  title?: string;
  message?: string;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon: Icon,
  title = "Nothing here",
  message,
  style,
}: EmptyStateProps) {
  return (
    <View style={[{ alignItems: "center", padding: 32, gap: 8 }, style]}>
      {Icon && (
        <Icon size={32} color={theme.color.muted} strokeWidth={1.5} />
      )}
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: theme.color.muted,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {message ? (
        <Text
          style={{
            fontSize: 13,
            color: theme.color.muted,
            textAlign: "center",
          }}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}
