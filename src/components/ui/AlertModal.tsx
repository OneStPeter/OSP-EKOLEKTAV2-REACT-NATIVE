import React from "react";

import { AppButton } from "./Button";
import { AlertShell, AlertVariant } from "./AlertShell";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AlertModalProps {
  visible: boolean;
  onDismiss: () => void;
  /** Status colour + icon. Default "info". */
  variant?: AlertVariant;
  title: string;
  message?: string;
  buttonLabel?: string;
}

// ── Component ────────────────────────────────────────────────────────────────
// Single-action status alert — the styled replacement for `Alert.alert(title,
// message)`. Use ConfirmModal instead when the user needs to choose between
// two outcomes.

export function AlertModal({
  visible,
  onDismiss,
  variant = "info",
  title,
  message,
  buttonLabel = "OK",
}: AlertModalProps) {
  return (
    <AlertShell
      visible={visible}
      variant={variant}
      title={title}
      message={message}
      onBackdropPress={onDismiss}
    >
      <AppButton
        size="lg"
        variant={variant === "error" ? "destructive" : "primary"}
        style={{ width: "100%" }}
        onPress={onDismiss}
      >
        {buttonLabel}
      </AppButton>
    </AlertShell>
  );
}
