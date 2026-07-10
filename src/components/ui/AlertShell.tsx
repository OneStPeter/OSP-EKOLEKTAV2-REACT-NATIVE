import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react-native";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";

import { AppSubtitle, AppText } from "./typography";
import { theme } from "./theme";

// ── Types ────────────────────────────────────────────────────────────────────

export type AlertVariant = "success" | "error" | "warning" | "info";

// ── Variant styling ──────────────────────────────────────────────────────────
// Shared by AlertModal and ConfirmModal so both draw from the same semantic
// colour + icon per status, matching Card/Badge's `color + "18"` icon-wrap
// convention used elsewhere in this library.

export const ALERT_VARIANT: Record<
  AlertVariant,
  {
    color: string;
    bg: string;
    icon: React.ComponentType<{
      size?: number;
      color?: string;
      strokeWidth?: number;
    }>;
  }
> = {
  success: { color: theme.color.accent, bg: theme.color.successBg, icon: CheckCircle2 },
  error: { color: theme.color.error, bg: theme.color.errorBg, icon: XCircle },
  warning: { color: theme.color.warning, bg: theme.color.warningBg, icon: AlertTriangle },
  info: { color: theme.color.info, bg: theme.color.infoBg, icon: Info },
};

// ── Component ────────────────────────────────────────────────────────────────
// Centered dialog chrome (backdrop + icon + title + message) shared by both
// alert components. Callers supply the action row as `children`.

interface AlertShellProps {
  visible: boolean;
  variant: AlertVariant;
  title: string;
  message?: string;
  onBackdropPress?: () => void;
  children: React.ReactNode;
}

export function AlertShell({
  visible,
  variant,
  title,
  message,
  onBackdropPress,
  children,
}: AlertShellProps) {
  if (!visible) return null;

  const v = ALERT_VARIANT[variant];
  const Icon = v.icon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onBackdropPress}
    >
      <Animated.View
        entering={FadeIn.duration(160)}
        exiting={FadeOut.duration(140)}
        style={s.backdrop}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onBackdropPress}
        />
        <Animated.View
          entering={ZoomIn.duration(200)}
          exiting={ZoomOut.duration(140)}
          style={s.card}
        >
          <View style={[s.iconWrap, { backgroundColor: v.bg }]}>
            <Icon size={28} color={v.color} strokeWidth={2.2} />
          </View>
          <AppSubtitle style={s.title}>{title}</AppSubtitle>
          {message ? (
            <AppText color="body" style={s.message}>
              {message}
            </AppText>
          ) : null}
          <View style={s.actions}>{children}</View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: theme.color.card,
    borderRadius: theme.radius.xl,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { marginTop: 14, textAlign: "center" },
  message: { marginTop: 6, textAlign: "center", lineHeight: 18 },
  actions: { width: "100%", marginTop: 20, gap: 10 },
});
