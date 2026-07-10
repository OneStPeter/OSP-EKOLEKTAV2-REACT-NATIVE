import React from "react";
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

import { AppLabel } from "./typography";
import { theme } from "./theme";

export interface PillSelectOption {
  value: string;
  label: string;
}

interface PillSelectProps {
  label: string;
  options: PillSelectOption[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function PillSelect({
  label,
  options,
  value,
  onChange,
  style,
}: PillSelectProps) {
  return (
    <View style={[s.wrap, style]}>
      <AppLabel style={{ marginBottom: 6 }}>{label}</AppLabel>
      <View style={s.row}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[s.pill, active && s.pillActive]}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.75}
            >
              <Text style={[s.pillText, active && s.pillTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 12 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.card,
  },
  pillActive: {
    backgroundColor: theme.color.accent,
    borderColor: theme.color.accent,
  },
  pillText: { fontSize: 12, fontWeight: "600", color: theme.color.body },
  pillTextActive: { color: "#fff" },
});
