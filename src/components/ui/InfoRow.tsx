import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { theme } from "./theme";

export type InfoRowIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

interface InfoRowProps {
  icon: InfoRowIcon;
  label: string;
  value: string;
  style?: StyleProp<ViewStyle>;
}

export function InfoRow({ icon: Icon, label, value, style }: InfoRowProps) {
  return (
    <View style={[s.row, style]}>
      <Icon size={14} color={theme.color.muted} strokeWidth={2} />
      <Text style={s.text} numberOfLines={1}>
        <Text style={s.label}>{label}: </Text>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 5,
  },
  text: { fontSize: 13, color: theme.color.body, flexShrink: 1 },
  label: { fontWeight: "700", color: theme.color.ink },
});
