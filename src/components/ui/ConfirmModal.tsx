import React from "react";
import { View } from "react-native";

import { AppButton } from "./Button";
import { AlertShell, AlertVariant } from "./AlertShell";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** Status colour + icon. Default "warning". */
  variant?: AlertVariant;
  title: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  /** Renders the confirm button in the destructive (red) style. */
  destructive?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────
// Two-action confirmation dialog — the styled replacement for
// `Alert.alert(title, message, [{ text: "NO" }, { text: "YES", onPress }])`.

export function ConfirmModal({
  visible,
  onCancel,
  onConfirm,
  variant = "warning",
  title,
  message,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  destructive = false,
}: ConfirmModalProps) {
  return (
    <AlertShell
      visible={visible}
      variant={variant}
      title={title}
      message={message}
      onBackdropPress={onCancel}
    >
      <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
        <AppButton
          variant="secondary"
          size="lg"
          style={{ flex: 1 }}
          onPress={onCancel}
        >
          {cancelLabel}
        </AppButton>
        <AppButton
          variant={destructive ? "destructive" : "primary"}
          size="lg"
          style={{ flex: 1 }}
          onPress={onConfirm}
        >
          {confirmLabel}
        </AppButton>
      </View>
    </AlertShell>
  );
}
