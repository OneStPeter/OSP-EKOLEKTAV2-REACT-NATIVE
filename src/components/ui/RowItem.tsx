import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "./theme";

interface RowItemProps {
  label: string;
  value: string | number;
  dots?: boolean;
}

export function RowItem({ label, value, dots = true }: RowItemProps) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString() : value;
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      {dots ? (
        <View style={s.dots} />
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <Text style={s.value}>{displayValue}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
  },
  label: {
    fontSize: 13,
    color: theme.color.muted,
    flexShrink: 1,
  },
  dots: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: theme.color.dots,
    borderStyle: "dashed",
    marginHorizontal: 6,
    marginBottom: 3,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.color.body,
    textAlign: "right",
  },
});
