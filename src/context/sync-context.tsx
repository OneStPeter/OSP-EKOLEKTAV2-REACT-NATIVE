import NetInfo from "@react-native-community/netinfo";
import { useSQLiteContext } from "expo-sqlite";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { getPendingCount, onQueueChange } from "@/db/sync-queue";
import { ensureServerSchema } from "@/services/schema.service";
import { runSync } from "@/services/sync.service";

type SyncContextValue = {
  /** null until the first connectivity check completes. */
  isOnline: boolean | null;
  isSyncing: boolean;
  /** Local changes not yet uploaded. */
  pendingCount: number;
  lastSyncedAt: Date | null;
  lastError: string | null;
  syncNow: () => Promise<void>;
};

const SyncContext = createContext<SyncContextValue | null>(null);

// Batch bursts of local writes into a single sync.
const LOCAL_CHANGE_DEBOUNCE_MS = 1500;

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const onlineRef = useRef(false);

  const refreshPending = useCallback(async () => {
    setPendingCount(await getPendingCount(db));
  }, [db]);

  const syncNow = useCallback(async () => {
    if (!onlineRef.current) return;
    setIsSyncing(true);
    try {
      // Creates shared-model tables still missing (first launch was offline, or
      // the server schema changed). Once per session; never throws.
      await ensureServerSchema(db);
      const result = await runSync(db);
      if (result.status === "ok") {
        setLastSyncedAt(new Date());
        setLastError(null);
      } else if (result.status === "error") {
        setLastError(result.error);
      }
    } finally {
      setIsSyncing(false);
      await refreshPending();
    }
  }, [db, refreshPending]);

  // Connectivity: sync whenever we come (back) online.
  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && state.isInternetReachable !== false;
      const cameOnline = online && !onlineRef.current;
      onlineRef.current = online;
      setIsOnline(online);
      if (cameOnline) void syncNow();
    });
  }, [syncNow]);

  // App returning to foreground: catch up on server changes.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncNow();
    });
    return () => sub.remove();
  }, [syncNow]);

  // Local writes: update the badge immediately, upload shortly after.
  useEffect(() => {
    void refreshPending();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = onQueueChange(() => {
      void refreshPending();
      clearTimeout(timer);
      timer = setTimeout(() => void syncNow(), LOCAL_CHANGE_DEBOUNCE_MS);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [refreshPending, syncNow]);

  return (
    <SyncContext.Provider
      value={{ isOnline, isSyncing, pendingCount, lastSyncedAt, lastError, syncNow }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
