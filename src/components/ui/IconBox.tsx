import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { theme } from "./theme";

interface IconBoxProps {
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  color?: string;
  size?: number;
  iconSize?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function IconBox({
  icon: Icon,
  color = theme.color.accent,
  size = 34,
  iconSize = 16,
  borderRadius = theme.radius.xs + 3,
  style,
}: IconBoxProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: color + "22",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Icon size={iconSize} color={color} strokeWidth={2} />
    </View>
  );
}
