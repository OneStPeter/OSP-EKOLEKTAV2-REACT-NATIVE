import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";

interface BadgeProps {
  label: string;
  color: string;
  backgroundColor: string;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, color, backgroundColor, style }: BadgeProps) {
  return (
    <View style={[s.badge, { backgroundColor }, style]}>
      <Text style={[s.text, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
  },
});
