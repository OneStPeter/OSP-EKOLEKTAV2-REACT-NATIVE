// Hands a copy of the local database to the share sheet (Drive, email, Files, …),
// so it can be opened in a SQLite browser. The app's own folder is private to
// it — and to Expo Go — so this is the way to get the file off a device.

import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { SQLiteDatabase } from "expo-sqlite";

export async function exportDatabase(db: SQLiteDatabase) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device.");
  }

  // WAL mode keeps recent writes in ekolekta.db-wal; fold them into the main
  // file so the single exported file is complete.
  await db.execAsync("PRAGMA wal_checkpoint(TRUNCATE)");

  const source = new File(
    db.databasePath.startsWith("file://") ? db.databasePath : `file://${db.databasePath}`,
  );
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
  const copy = new File(Paths.cache, `ekolekta-${stamp}.db`);
  if (copy.exists) copy.delete();
  source.copy(copy);

  await Sharing.shareAsync(copy.uri, {
    mimeType: "application/x-sqlite3",
    UTI: "public.database",
    dialogTitle: "Export local database",
  });
}
