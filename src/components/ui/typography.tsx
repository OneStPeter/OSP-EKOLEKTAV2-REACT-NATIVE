import React from "react";
import { Text, TextProps, TextStyle, StyleProp } from "react-native";
import { theme, ThemeColor } from "./theme";

interface AppTextProps extends Omit<TextProps, "style"> {
  color?: ThemeColor | (string & {});
  fontWeight?: TextStyle["fontWeight"];
  style?: StyleProp<TextStyle>;
}

function resolveColor(color?: ThemeColor | string): string {
  if (!color) return theme.color.ink;
  return (theme.color as Record<string, string>)[color] ?? color;
}

export function AppTitle({
  color,
  fontWeight = "700",
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        {
          fontSize: 20,
          fontWeight,
          color: resolveColor(color ?? "ink"),
          letterSpacing: -0.3,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export function AppSubtitle({
  color,
  fontWeight = "700",
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        {
          fontSize: 15,
          fontWeight,
          color: resolveColor(color ?? "ink"),
          letterSpacing: -0.2,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export function AppText({
  color,
  fontWeight = "400",
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        {
          fontSize: 13,
          fontWeight,
          color: resolveColor(color ?? "body"),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export function AppCaption({
  color,
  fontWeight = "400",
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        {
          fontSize: 11,
          fontWeight,
          color: resolveColor(color ?? "muted"),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export function AppLabel({
  color,
  fontWeight = "600",
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        {
          fontSize: 10,
          fontWeight,
          color: resolveColor(color ?? "muted"),
          textTransform: "uppercase",
          letterSpacing: 0.6,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
