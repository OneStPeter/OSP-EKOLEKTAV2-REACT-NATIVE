import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { theme } from "./theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface AppButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  activeOpacity?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT: Record<ButtonVariant, { bg: string; text: string }> = {
  primary: { bg: theme.color.accent, text: "#fff" },
  secondary: { bg: theme.color.border, text: theme.color.body },
  ghost: { bg: "transparent", text: theme.color.body },
  destructive: { bg: theme.color.error, text: "#fff" },
};

const SIZE: Record<
  ButtonSize,
  { py: number; px: number; fontSize: number; borderRadius: number }
> = {
  sm: { py: 5, px: 10, fontSize: 12, borderRadius: theme.radius.sm },
  md: { py: 10, px: 16, fontSize: 14, borderRadius: theme.radius.sm + 2 },
  lg: { py: 13, px: 24, fontSize: 14, borderRadius: theme.radius.md },
};

export function AppButton({
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  activeOpacity = 0.8,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}: AppButtonProps) {
  const v = VARIANT[variant];
  const sz = SIZE[size];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={activeOpacity}
      disabled={disabled}
      style={[
        {
          flexDirection: "row",
          backgroundColor: v.bg,
          paddingVertical: sz.py,
          paddingHorizontal: sz.px,
          borderRadius: sz.borderRadius,
          alignItems: "center",
          justifyContent: "center",
          gap: leftIcon || rightIcon ? 6 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {leftIcon}
      <Text
        style={[{ color: v.text, fontWeight: "700", fontSize: sz.fontSize }, textStyle]}
      >
        {children}
      </Text>
      {rightIcon}
    </TouchableOpacity>
  );
}
