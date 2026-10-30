import React, { createContext, useContext, useMemo, useState } from "react";

import { AlertModal } from "@/components/ui";
import type { AlertVariant } from "@/components/ui/AlertShell";

type Notice = { variant: AlertVariant; title: string; message?: string };

type AppNoticeContextValue = {
  showNotice: (variant: AlertVariant, title: string, message?: string) => void;
};

const AppNoticeContext = createContext<AppNoticeContextValue | null>(null);

/**
 * App-wide alert that survives navigation (e.g. raised on launch, shown on
 * whatever screen the user lands on). Held back until `ready` so it never
 * pops up over the splash animation — AlertModal is a native Modal and
 * would otherwise draw on top of it.
 */
export function AppNoticeProvider({
  ready,
  children,
}: {
  ready: boolean;
  children: React.ReactNode;
}) {
  const [notice, setNotice] = useState<Notice | null>(null);

  // Stable identity so callers can list it in effect dependencies.
  const value = useMemo<AppNoticeContextValue>(
    () => ({
      showNotice: (variant, title, message) => setNotice({ variant, title, message }),
    }),
    [],
  );

  return (
    <AppNoticeContext.Provider value={value}>
      {children}
      <AlertModal
        visible={ready && notice !== null}
        onDismiss={() => setNotice(null)}
        variant={notice?.variant ?? "info"}
        title={notice?.title ?? ""}
        message={notice?.message}
      />
    </AppNoticeContext.Provider>
  );
}

export function useAppNotice() {
  const ctx = useContext(AppNoticeContext);
  if (!ctx) throw new Error("useAppNotice must be used within AppNoticeProvider");
  return ctx;
}
