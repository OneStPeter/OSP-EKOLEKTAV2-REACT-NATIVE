import { useState } from "react";

import type { AlertVariant } from "./AlertShell";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AlertModalState {
  visible: boolean;
  variant: AlertVariant;
  title: string;
  message?: string;
  onDismiss?: () => void;
}

const INITIAL_STATE: AlertModalState = {
  visible: false,
  variant: "info",
  title: "",
};

// ── Hook ─────────────────────────────────────────────────────────────────────
// Standardises the little bit of state every screen needs to drive a single
// <AlertModal>: `showAlert(...)` opens it, `dismissAlert()` closes it (and
// fires the deferred callback, if any — e.g. navigating away only once the
// user has acknowledged a "Saved" alert).

export function useAlertModal() {
  const [alertState, setAlertState] = useState<AlertModalState>(INITIAL_STATE);

  function showAlert(
    variant: AlertVariant,
    title: string,
    message?: string,
    onDismiss?: () => void,
  ) {
    setAlertState({ visible: true, variant, title, message, onDismiss });
  }

  function dismissAlert() {
    alertState.onDismiss?.();
    setAlertState((prev) => ({ ...prev, visible: false }));
  }

  return { alertState, showAlert, dismissAlert };
}
