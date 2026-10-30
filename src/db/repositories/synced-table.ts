import type { SQLiteBindValue, SQLiteDatabase } from "expo-sqlite";

import { enqueue, notifyQueueChange } from "@/db/sync-queue";
import type { SyncEntity } from "@/services/sync.service";

export type SyncStatus = "synced" | "pending" | "failed";

/** Columns every server table carries for auditing. */
type Audited = {
  AuditUser: string | null;
  AuditDate: string | null;
  EditUser: string | null;
  EditDate: string | null;
};

type Config<T> = {
  /** Local table name; also the tblSyncOutbox EntityType value. */
  table: string;
  primaryKey: keyof T & string;
  /** Every server column, in any order. */
  columns: readonly (keyof T & string)[];
  /** Columns that are `bool` in the shared model; stored here as 0 | 1, sent as true / false. */
  booleans?: readonly (keyof T & string)[];
  /** Columns that are `int` in the shared model but text here; sent as numbers (null when not numeric). */
  integers?: readonly (keyof T & string)[];
  orderBy: string;
};

/**
 * Builds the offline-first data access for a table that mirrors a server table
 * and carries the local-only `sync_status` / `deleted` columns.
 * Table and column names come from code, never user input, so interpolating them is safe.
 */
export function createSyncedTable<T extends Audited>(cfg: Config<T>) {
  const { table, primaryKey: pk, columns } = cfg;
  type Row = T & { sync_status: SyncStatus; deleted: number };
  type Local = T & { syncStatus: SyncStatus };

  const upsertSql = `
    INSERT INTO ${table} (${columns.join(", ")}, sync_status, deleted)
    VALUES (${columns.map(() => "?").join(", ")}, ?, 0)
    ON CONFLICT (${pk}) DO UPDATE SET
      ${columns
        .filter((c) => c !== pk)
        .map((c) => `${c} = excluded.${c}`)
        .join(", ")},
      sync_status = excluded.sync_status, deleted = 0`;

  const toLocal = ({ sync_status, deleted: _deleted, ...rest }: Row): Local =>
    ({ ...rest, syncStatus: sync_status }) as unknown as Local;

  async function write(db: SQLiteDatabase, record: T, status: SyncStatus) {
    const values = columns.map((c) => (record[c] ?? null) as SQLiteBindValue);
    await db.runAsync(upsertSql, [...values, status]);
  }

  async function findMany(db: SQLiteDatabase, where: string, ...params: SQLiteBindValue[]) {
    const rows = await db.getAllAsync<Row>(
      `SELECT * FROM ${table} WHERE ${where} AND deleted = 0 ORDER BY ${cfg.orderBy}`,
      params,
    );
    return rows.map(toLocal);
  }

  const list = (db: SQLiteDatabase) => findMany(db, "1 = 1");

  async function findOne(db: SQLiteDatabase, where: string, ...params: SQLiteBindValue[]) {
    const row = await db.getFirstAsync<Row>(
      `SELECT * FROM ${table} WHERE ${where} AND deleted = 0`,
      params,
    );
    return row ? toLocal(row) : null;
  }

  const get = (db: SQLiteDatabase, id: string) => findOne(db, `${pk} = ?`, id);

  /**
   * Like `save`, but runs inside a transaction the caller already opened, so
   * several tables can be written atomically. Caller must `notifyQueueChange()` after.
   */
  async function saveInTransaction(db: SQLiteDatabase, record: T, editUser: string) {
    const id = String(record[pk]);
    const now = new Date().toISOString();

    const exists = await db.getFirstAsync(
      `SELECT 1 FROM ${table} WHERE ${pk} = ? AND deleted = 0`,
      id,
    );
    const stamped: T = exists
      ? { ...record, EditUser: editUser, EditDate: now }
      : { ...record, AuditUser: editUser, AuditDate: now };

    await write(db, stamped, "pending");
    await enqueue(db, table, id, exists ? "update" : "create", stamped);
  }

  /**
   * Inserts or updates locally and queues the upload. `editUser` is stamped into
   * AuditUser/AuditDate on create and EditUser/EditDate on update.
   */
  async function save(db: SQLiteDatabase, record: T, editUser: string) {
    await db.withTransactionAsync(() => saveInTransaction(db, record, editUser));
    notifyQueueChange();
  }

  /** Soft-deletes locally (hidden from reads) and queues the delete. */
  async function remove(db: SQLiteDatabase, id: string) {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE ${table} SET deleted = 1, sync_status = 'pending' WHERE ${pk} = ?`,
        id,
      );
      // The sync worker finds the row to delete by the payload's primary key.
      await enqueue(db, table, id, "delete", { [pk]: id });
    });
    notifyQueueChange();
  }

  const sync: SyncEntity = {
    name: table,
    primaryKey: pk,

    // Converts a queued row to the shared model's types: the worker deserializes
    // each column into its C# property, which rejects 0 / 1 for a bool.
    toPayload(record) {
      const payload = { ...record };
      for (const c of cfg.booleans ?? []) {
        if (payload[c] != null) payload[c] = Boolean(payload[c]);
      }
      for (const c of cfg.integers ?? []) {
        if (payload[c] == null) continue;
        const n = Number(String(payload[c]).trim());
        payload[c] = Number.isInteger(n) && String(payload[c]).trim() !== "" ? n : null;
      }
      return payload;
    },

    async markSynced(db, id, operation) {
      if (operation === "delete") {
        await db.runAsync(`DELETE FROM ${table} WHERE ${pk} = ? AND deleted = 1`, id);
      } else {
        await db.runAsync(`UPDATE ${table} SET sync_status = 'synced' WHERE ${pk} = ?`, id);
      }
    },

    async markFailed(db, id) {
      await db.runAsync(`UPDATE ${table} SET sync_status = 'failed' WHERE ${pk} = ?`, id);
    },
  };

  return { list, get, findOne, findMany, save, saveInTransaction, remove, sync };
}
