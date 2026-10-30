// Brings a person's server records into the local database, from OSP-SYNC-WORKER-API:
//   GET  {WORKER}/person/{personId}   → one person          (on login: the account)
//   POST {WORKER}/person/batch        → up to 50 persons    (refreshes, see sync.service)
// A person arrives with their addresses, plans (with remarks and beneficiaries) and
// the reference rows those point at. Each goes into the local table of the same
// name (created by db/migrations.ts or services/schema.service.ts), matched by
// column name case-insensitively, as the worker does. Tables or columns this
// device does not have are skipped, and a row with a local change not yet applied
// on the server is left alone: the local edit wins until the worker applies it.

import type { SQLiteBindValue, SQLiteDatabase } from "expo-sqlite";

import { hasQueuedChanges } from "@/db/sync-queue";
import { ApiError, isSyncWorkerConfigured, syncWorkerRequest } from "@/services/api";

type Row = Record<string, unknown>;

/** GetPersonResponse in OSP-SYNC-WORKER-API; only the parts copied locally. */
export type WorkerPerson = Row & {
  personId: string;
  addresses?: Row[];
  plans?: (Row & { lpaNo: string; remarks?: Row | null; beneficiaries?: Row[] })[];
  references?: Record<string, Row[]>;
};

// GetPersonResponse.References → local table.
const REFERENCE_TABLES: Record<string, string> = {
  orgUnits: "refOrgUnit",
  accountClasses: "refAccountClass",
  accountStatuses: "refAccountStatus",
  terminationStatuses: "refTermiStat",
  catalogs: "refCatalog",
  modesOfPayment: "refModeOfPayment",
  planClasses: "refPlanClass",
  planTypes: "refPlanType",
  contactTypes: "refContactType",
  nationalities: "refNationality",
  occupations: "refOccupation",
  relationships: "refRelationship",
};

// The login wait is bounded; anything missed arrives with the next sync.
const ACCOUNT_TIMEOUT_MS = 10_000;

export type AccountSyncResult =
  | { status: "skipped"; reason: string }
  | { status: "ok"; found: boolean }
  | { status: "error"; error: string };

/**
 * Copies the signed-in account's records from the server. Called after the
 * server has verified the login; never throws, since the app keeps working
 * from local data when this fails.
 */
export async function migrateAccount(
  db: SQLiteDatabase,
  personId: string,
): Promise<AccountSyncResult> {
  if (!isSyncWorkerConfigured) {
    return { status: "skipped", reason: "Sync worker URL is not configured." };
  }
  try {
    const person = await syncWorkerRequest<WorkerPerson>(
      "GET",
      `/person/${encodeURIComponent(personId)}`,
      undefined,
      { timeoutMs: ACCOUNT_TIMEOUT_MS },
    );
    await applyPersons(db, [person]);
    return { status: "ok", found: true };
  } catch (e) {
    // Not on the server yet, e.g. a sign-up the worker has not applied.
    if (e instanceof ApiError && e.status === 404) return { status: "ok", found: false };
    return { status: "error", error: e instanceof Error ? e.message : String(e) };
  }
}

/** Writes persons as the worker returns them, each in one transaction. */
export async function applyPersons(db: SQLiteDatabase, persons: WorkerPerson[]) {
  const tables = new TableCache(db);
  for (const person of persons) {
    await db.withTransactionAsync(async () => {
      // References first: the rows below point at them.
      for (const [key, rows] of Object.entries(person.references ?? {})) {
        const table = REFERENCE_TABLES[key];
        if (table) await upsertRows(db, tables, table, rows);
      }

      await upsertRows(db, tables, "tblPerson", [person]);
      const owner = { PersonID: person.personId };
      await upsertRows(db, tables, "tblAddress", (person.addresses ?? []).map((a) => ({ ...a, ...owner })));
      // ContactInfo is left out, as in the worker: tblContactInfo's model key is
      // ContactTypeID alone, so one person's contact would overwrite another's.

      for (const plan of person.plans ?? []) {
        const { remarks, beneficiaries, ...planRow } = plan;
        const lpa = { LPANo: plan.lpaNo };
        await upsertRows(db, tables, "tblPlanholder", [{ ...planRow, ...owner }]);
        if (remarks) await upsertRows(db, tables, "tblPhRemarks", [{ ...remarks, ...lpa }]);
        await upsertRows(db, tables, "tblBeneficiary", (beneficiaries ?? []).map((b) => ({ ...b, ...lpa })));
      }
    });
  }
}

type TableInfo = { columns: Map<string, string>; primaryKey: string[] };

/** Local column names per table, looked up once per apply. */
class TableCache {
  private readonly cache = new Map<string, TableInfo | null>();
  constructor(private readonly db: SQLiteDatabase) {}

  async get(table: string): Promise<TableInfo | null> {
    if (this.cache.has(table)) return this.cache.get(table)!;
    const info = await this.db.getAllAsync<{ name: string; pk: number }>(
      `PRAGMA table_info(${quote(table)})`,
    );
    const result =
      info.length === 0
        ? null
        : {
            columns: new Map(info.map((c) => [c.name.toLowerCase(), c.name])),
            primaryKey: info
              .filter((c) => c.pk > 0)
              .sort((a, b) => a.pk - b.pk)
              .map((c) => c.name),
          };
    this.cache.set(table, result);
    return result;
  }
}

async function upsertRows(db: SQLiteDatabase, tables: TableCache, table: string, rows: Row[]) {
  const info = await tables.get(table);
  // Not created on this device yet (server schema not applied), or keyless: an
  // upsert needs a key to tell a new row from an existing one.
  if (!info || info.primaryKey.length === 0 || rows.length === 0) return;

  for (const row of rows) {
    const values = new Map<string, SQLiteBindValue>();
    for (const [key, value] of Object.entries(row)) {
      const column = info.columns.get(key.toLowerCase());
      if (!column || column === "sync_status" || column === "deleted") continue;
      // Nested objects are navigations / child lists, handled separately.
      if (value !== null && typeof value === "object") continue;
      values.set(column, toSqlite(value));
    }

    const key = info.primaryKey.map((c) => values.get(c));
    if (key.some((v) => v == null)) continue;
    // Same EntityId format as the server's outbox: key values joined with "|".
    if (await hasQueuedChanges(db, table, key.join("|"))) continue;

    const columns = [...values.keys()];
    const updates = columns
      .filter((c) => !info.primaryKey.includes(c))
      .map((c) => `${quote(c)} = excluded.${quote(c)}`);
    await db.runAsync(
      `INSERT INTO ${quote(table)} (${columns.map(quote).join(", ")}, sync_status, deleted)
       VALUES (${columns.map(() => "?").join(", ")}, 'synced', 0)
       ON CONFLICT (${info.primaryKey.map(quote).join(", ")}) DO UPDATE SET
         ${[...updates, "sync_status = 'synced'", "deleted = 0"].join(", ")}`,
      [...values.values()],
    );
  }
}

function toSqlite(value: unknown): SQLiteBindValue {
  if (value == null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number" || typeof value === "string") return value;
  return String(value);
}

function quote(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}
