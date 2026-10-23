import type { MessageDialogVariant } from "osp-ui-kit-native";
import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AlertModalState {
  open: boolean;
  variant: MessageDialogVariant;
  title: string;
  message?: string;
  onDismiss?: () => void;
}

const INITIAL_STATE: AlertModalState = {
  open: false,
  variant: "information",
  title: "",
};

// ── Hook ─────────────────────────────────────────────────────────────────────
// Drives a single kit <MessageDialog>: `showAlert(...)` opens it,
// `dismissAlert()` closes it (and fires the deferred callback, if any — e.g.
// navigating away only once the user has acknowledged a "Saved" alert).
//
//   <MessageDialog
//     open={alertState.open}
//     onOpenChange={(o) => !o && dismissAlert()}
//     variant={alertState.variant}
//     title={alertState.title}
//     message={alertState.message}
//   />
//
// Don't also pass `onConfirm={dismissAlert}`: the dialog's button already
// calls `onOpenChange(false)` after `onConfirm`, so `onDismiss` would run twice.

export function useAlertModal() {
  const [alertState, setAlertState] = useState<AlertModalState>(INITIAL_STATE);

  function showAlert(
    variant: MessageDialogVariant,
    title: string,
    message?: string,
    onDismiss?: () => void,
  ) {
    setAlertState({ open: true, variant, title, message, onDismiss });
  }

  function dismissAlert() {
    alertState.onDismiss?.();
    setAlertState((prev) => ({ ...prev, open: false }));
  }

  return { alertState, showAlert, dismissAlert };
}
