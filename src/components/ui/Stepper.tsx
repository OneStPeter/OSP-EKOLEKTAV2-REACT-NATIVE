import { Check } from "lucide-react-native";
import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { BRAND_COLORS, palette, theme } from "./theme";

// ── Types ────────────────────────────────────────────────────────────────────

export interface StepperStep {
  label: string;
  /** Shown in the circle for the active/upcoming states. Falls back to the
   *  step number when omitted. Completed steps always show a check mark. */
  icon?: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
}

export interface StepperProps {
  steps: StepperStep[];
  /** 0-indexed. Steps before this are completed; this one is active. */
  currentStep: number;
  /** Omit to render a non-interactive (display-only) stepper. */
  onStepPress?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CIRCLE_SIZE = 30;

// ── Component ────────────────────────────────────────────────────────────────
//
// Horizontal, minimal payment-flow style stepper: equal-width step columns
// (icon + label), with a thin progress track running underneath — one
// flex segment per step, filled green up through the current step.

export function Stepper({
  steps,
  currentStep,
  onStepPress,
  style,
}: StepperProps) {
  return (
    <View style={[s.wrap, style]}>
      <View style={s.row}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const StepIcon = step.icon;

          return (
            <Pressable
              key={index}
              disabled={!onStepPress}
              onPress={onStepPress ? () => onStepPress(index) : undefined}
              hitSlop={6}
              style={s.step}
            >
              <View
                style={[
                  s.circle,
                  isActive && s.circleActive,
                  isCompleted && s.circleCompleted,
                ]}
              >
                {isCompleted ? (
                  <Check size={18} color="#fff" strokeWidth={3} />
                ) : StepIcon ? (
                  <StepIcon
                    size={18}
                    color={
                      isActive ? BRAND_COLORS.primaryGreen : theme.color.muted
                    }
                    strokeWidth={2}
                  />
                ) : (
                  <Text
                    style={[
                      s.circleNumber,
                      isActive ? s.circleNumberActive : s.circleNumberUpcoming,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[s.label, (isCompleted || isActive) && s.labelDone]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={s.lineRow}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              s.lineSegment,
              index <= currentStep ? s.lineSegmentDone : s.lineSegmentUpcoming,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  wrap: { width: "100%" },
  row: { flexDirection: "row" },
  step: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1,
    borderColor: palette.neutralBorder,
    backgroundColor: theme.color.card,
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: {
    borderWidth: 2,
    borderColor: BRAND_COLORS.primaryGreen,
    backgroundColor: BRAND_COLORS.primaryGreen + "22",
  },
  circleCompleted: {
    borderWidth: 2,
    borderColor: BRAND_COLORS.primaryGreen,
    backgroundColor: BRAND_COLORS.primaryGreen,
  },
  circleNumber: { fontSize: 15, fontWeight: "600" },
  circleNumberActive: { color: BRAND_COLORS.primaryGreen },
  circleNumberUpcoming: { color: theme.color.muted },
  label: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
    color: theme.color.muted,
    flexShrink: 1,
  },
  labelDone: { color: theme.color.ink, fontWeight: "600" },
  lineRow: {
    flexDirection: "row",
    marginTop: 11,
  },
  lineSegment: { flex: 1, height: 3 },
  lineSegmentDone: { backgroundColor: BRAND_COLORS.primaryGreen },
  lineSegmentUpcoming: { backgroundColor: palette.neutralBorder },
});
