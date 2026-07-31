import { Check, Minus } from "lucide-react-native";
import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { BRAND_COLORS, palette, theme } from "./theme";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CheckboxProps {
  checked: boolean;
  /** Partial selection — renders a dash instead of a check mark. */
  indeterminate?: boolean;
  /** Omit when the surrounding row already handles the press. */
  onPress?: () => void;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

// ── Component ────────────────────────────────────────────────────────────────
//
// Square, brand-green selection box used by multi-select lists (e.g. the
// disbursement records step). Purely visual unless `onPress` is supplied.

export function Checkbox({
  checked,
  indeterminate = false,
  onPress,
  size = 20,
  disabled = false,
  style,
}: CheckboxProps) {
  const filled = checked || indeterminate;
  const box = (
    <View
      style={[
        s.box,
        {
          width: size,
          height: size,
          borderColor: filled ? BRAND_COLORS.primaryGreen : palette.dots,
          backgroundColor: filled ? BRAND_COLORS.primaryGreen : theme.color.card,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {checked ? (
        <Check size={size * 0.62} color="#fff" strokeWidth={3} />
      ) : indeterminate ? (
        <Minus size={size * 0.62} color="#fff" strokeWidth={3} />
      ) : null}
    </View>
  );

  if (!onPress) return box;

  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8}>
      {box}
    </Pressable>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  box: {
    borderRadius: theme.radius.xs,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
