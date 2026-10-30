import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import React from "react";

import { SyncProvider } from "@/context/sync-context";
import { migrateDbIfNeeded } from "@/db/migrations";
import { applyBundledSchema } from "@/services/schema.service";

export const DATABASE_NAME = "ekolekta.db";

/**
 * Opens the local database on app launch — creating the file on first run —
 * and brings its schema up to date before any screen renders. Children can
 * then use `useSQLiteContext()` for data and `useSync()` for sync status.
 */
async function initDatabase(db: SQLiteDatabase) {
  // Where the file actually lives differs between Expo Go and a dev / release build.
  if (__DEV__) console.log("Local database:", db.databasePath);
  // 1. App-owned tables (versioned migrations).
  await migrateDbIfNeeded(db);
  // 2. Every other API shared-model table, from the snapshot bundled with the app —
  //    so a new database has them all even when created offline. Changes made on
  //    the server after the snapshot are added later by ensureServerSchema().
  try {
    const result = await applyBundledSchema(db);
    if (__DEV__ && result.status === "applied") {
      console.log(`Created ${result.created.length} shared-model tables`);
    }
  } catch (e) {
    // Not fatal: the app-owned tables are in place, and the live schema retries this.
    console.warn("Bundled schema not applied", e);
  }
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
      <SyncProvider>{children}</SyncProvider>
    </SQLiteProvider>
  );
}
