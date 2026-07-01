import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { theme } from "./theme";

interface CardProps {
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  iconColor?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
}

export function Card({
  icon: Icon,
  iconColor = theme.color.body,
  title,
  subtitle,
  children,
  style,
  bodyStyle,
}: CardProps) {
  const showHeader = !!(title || Icon);
  return (
    <View style={[s.card, style]}>
      {showHeader && (
        <View style={s.header}>
          {Icon && (
            <View style={[s.iconWrap, { backgroundColor: iconColor + "18" }]}>
              <Icon size={18} strokeWidth={2.2} />
            </View>
          )}
          {title && (
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{title}</Text>
              {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
            </View>
          )}
        </View>
      )}
      <View style={[s.body, bodyStyle]}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.color.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: theme.color.muted,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.color.border,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 19,
    color: theme.color.ink,
  },
  subtitle: {
    fontSize: 11,
    color: theme.color.muted,
    marginTop: 1,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
  },
});
