// Local tables for the server's shared models (OneStPeterAPI/Shared/Models).
//
// db/migrations.ts creates the tables the app reads and writes today. Every other
// shared-model table comes from the server's description of its EF model:
//   GET {API}/Sync/schema   (anonymous)
//     → { version, tables: [{ name, primaryKey: string[], columns: [{ name, type }] }] }
// in two steps:
//   1. On database creation (offline too): a snapshot of that response bundled
//      with the app (db/server-schema.generated.ts, `npm run schema:generate`).
//   2. Once online: the live response, for anything changed since the snapshot.
// Missing tables are created (with the local `sync_status` / `deleted` columns,
// like the hand-written ones) and columns the server added later are appended to
// the tables created here. Nothing is ever dropped, and tables owned by the
// migrations are left alone. Versions are stored so an unchanged schema is skipped.

import type { SQLiteDatabase } from "expo-sqlite";

import { BUNDLED_SERVER_SCHEMA } from "@/db/server-schema.generated";
import { getMeta, setMeta } from "@/db/sync-queue";
import { apiRequest, isApiConfigured } from "@/services/api";

type ColumnType = "TEXT" | "INTEGER" | "REAL" | "BLOB";

export type ServerSchema = {
  version: string;
  tables: {
    name: string;
    primaryKey: string[];
    columns: { name: string; type: ColumnType }[];
  }[];
};

export type SchemaResult =
  | { status: "skipped"; reason: string }
  | { status: "current" }
  | { status: "applied"; created: string[] }
  | { status: "error"; error: string };

const VERSION_KEY = "server_schema_version";
/** Version of the bundled snapshot last applied (separate: versions are hashes, not ordered). */
const BUNDLED_VERSION_KEY = "bundled_schema_version";
/** JSON array of the tables this service created (and may therefore alter). */
const TABLES_KEY = "server_schema_tables";
const COLUMN_TYPES = new Set<ColumnType>(["TEXT", "INTEGER", "REAL", "BLOB"]);
// First launch waits on this, so keep it bounded; later checks happen in the background.
const SCHEMA_TIMEOUT_MS = 10_000;

let inFlight: Promise<SchemaResult> | null = null;
// One server check per app session is enough; the schema changes only on deploys.
let checkedThisSession = false;

/** True once the shared-model tables have been created on this device (bundled or live). */
export async function hasServerSchema(db: SQLiteDatabase) {
  return (
    (await getMeta(db, BUNDLED_VERSION_KEY)) !== null ||
    (await getMeta(db, VERSION_KEY)) !== null
  );
}

/**
 * Creates the shared-model tables from the snapshot bundled with the app. Runs
 * while the database is opened (before any screen), needs no network, and is a
 * no-op once this app version's snapshot has been applied.
 */
export async function applyBundledSchema(db: SQLiteDatabase): Promise<SchemaResult> {
  if ((await getMeta(db, BUNDLED_VERSION_KEY)) === BUNDLED_SERVER_SCHEMA.version) {
    return { status: "current" };
  }
  const created = await applySchema(db, BUNDLED_SERVER_SCHEMA, BUNDLED_VERSION_KEY);
  return { status: "applied", created };
}

/**
 * Creates any shared-model tables still missing locally. Safe to call often:
 * concurrent calls share one run, and after a successful check the rest of the
 * session is a no-op. Never throws — a failure is retried on the next call.
 */
export function ensureServerSchema(db: SQLiteDatabase): Promise<SchemaResult> {
  if (!isApiConfigured) {
    return Promise.resolve({ status: "skipped", reason: "API URL is not configured." });
  }
  if (checkedThisSession) return Promise.resolve({ status: "current" });
  inFlight ??= doEnsure(db).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doEnsure(db: SQLiteDatabase): Promise<SchemaResult> {
  try {
    const schema = await apiRequest<ServerSchema>("GET", "/Sync/schema", undefined, {
      timeoutMs: SCHEMA_TIMEOUT_MS,
    });
    const result: SchemaResult =
      (await getMeta(db, VERSION_KEY)) === schema.version
        ? { status: "current" }
        : { status: "applied", created: await applySchema(db, schema, VERSION_KEY) };
    checkedThisSession = true;
    return result;
  } catch (e) {
    return { status: "error", error: e instanceof Error ? e.message : String(e) };
  }
}

async function applySchema(db: SQLiteDatabase, schema: ServerSchema, versionKey: string) {
  const owned = new Set<string>(JSON.parse((await getMeta(db, TABLES_KEY)) ?? "[]"));
  const created: string[] = [];

  await db.withTransactionAsync(async () => {
    for (const table of schema.tables) {
      const key = table.name.toLowerCase();
      // Table and column names are case-insensitive in SQLite, as in MySQL.
      const existing = await db.getAllAsync<{ name: string }>(
        `PRAGMA table_info(${quote(table.name)})`,
      );

      if (existing.length === 0) {
        await db.execAsync(createTableSql(table));
        owned.add(key);
        created.push(table.name);
      } else if (owned.has(key)) {
        const have = new Set(existing.map((c) => c.name.toLowerCase()));
        for (const column of table.columns) {
          if (have.has(column.name.toLowerCase())) continue;
          await db.execAsync(
            `ALTER TABLE ${quote(table.name)} ADD COLUMN ${quote(column.name)} ${columnType(column.type)}`,
          );
        }
      }
    }
    await setMeta(db, TABLES_KEY, JSON.stringify([...owned]));
    await setMeta(db, versionKey, schema.version);
  });
  return created;
}

// Columns other than the primary key are nullable: the server owns integrity, and
// a strict local constraint could reject rows it already holds (see migrations.ts).
function createTableSql(table: ServerSchema["tables"][number]) {
  const lines = table.columns.map((c) => {
    const notNull = table.primaryKey.includes(c.name) ? " NOT NULL" : "";
    return `${quote(c.name)} ${columnType(c.type)}${notNull}`;
  });
  lines.push(
    `sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed'))`,
    "deleted INTEGER NOT NULL DEFAULT 0",
  );
  if (table.primaryKey.length > 0) {
    lines.push(`PRIMARY KEY (${table.primaryKey.map(quote).join(", ")})`);
  }
  return `CREATE TABLE IF NOT EXISTS ${quote(table.name)} (\n  ${lines.join(",\n  ")}\n);`;
}

// Names come from the server, so they are quoted rather than trusted.
function quote(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function columnType(type: string) {
  return COLUMN_TYPES.has(type as ColumnType) ? type : "TEXT";
}
