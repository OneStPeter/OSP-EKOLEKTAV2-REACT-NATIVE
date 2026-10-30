import type { SQLiteDatabase } from "expo-sqlite";

// Schema is versioned with SQLite's built-in `PRAGMA user_version`.
// To change the schema, APPEND a new migration — never edit one that has shipped,
// because devices that already ran it will not run it again.
type Migration = { version: number; up: string };

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: `
      -- Key/value store for sync bookkeeping (e.g. last pull timestamp per entity).
      CREATE TABLE IF NOT EXISTS sync_meta (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );

      -- Outbox: every local write is recorded here and replayed to the API in order.
      CREATE TABLE IF NOT EXISTS sync_queue (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        entity     TEXT    NOT NULL,
        record_id  TEXT    NOT NULL,
        operation  TEXT    NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
        payload    TEXT,
        created_at TEXT    NOT NULL,
        attempts   INTEGER NOT NULL DEFAULT 0,
        last_error TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_sync_queue_record ON sync_queue (entity, record_id);

      -- Mirrors server tblUsers. MySQL → SQLite types:
      --   varchar → TEXT, datetime → TEXT (ISO 8601), tinyint(1)/int → INTEGER.
      -- PersonId is a FK to tblPerson on the server. Not enforced locally:
      -- the server owns integrity, and a strict local FK could reject valid
      -- data that arrives out of order during sync.
      -- Lower-case columns are local-only sync bookkeeping, never sent to the API.
      CREATE TABLE IF NOT EXISTS tblUsers (
        PersonId           TEXT    PRIMARY KEY NOT NULL,
        UserName           TEXT,
        UserPassword       TEXT,
        PasswordExpiration TEXT,
        IsActive           INTEGER NOT NULL DEFAULT 1,
        AuditUser          TEXT,
        AuditDate          TEXT,
        IsReported         INTEGER NOT NULL DEFAULT 0,
        EditUser           TEXT,
        EditDate           TEXT,
        LoginAttempt       INTEGER NOT NULL DEFAULT 0,

        sync_status        TEXT    NOT NULL DEFAULT 'synced'
                           CHECK (sync_status IN ('synced', 'pending', 'failed')),
        deleted            INTEGER NOT NULL DEFAULT 0
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_tblUsers_UserName ON tblUsers (UserName);
    `,
  },
  {
    version: 2,
    up: `
      -- Mirrors server tblPerson. OccupationID → refOccupation and
      -- NationalityID → refNationality are FKs on the server; not enforced here.
      CREATE TABLE IF NOT EXISTS tblPerson (
        PersonID           TEXT    PRIMARY KEY NOT NULL,
        Title              TEXT,
        LastName           TEXT,
        FirstName          TEXT,
        MiddleName         TEXT,
        Suffix             TEXT,
        DateofBirth        TEXT,
        PlaceOfBirth       TEXT,
        GenderAtBirth      TEXT,
        CivilStatus        TEXT,
        OccupationID       TEXT,
        EmployerName       TEXT,
        EmploymentStatus   TEXT,
        NationalityID      TEXT,
        NaturalizationDate TEXT,
        SSSNo              TEXT,
        GSISNo             TEXT,
        HMDFNo             TEXT,
        TIN                TEXT,
        Weight             TEXT,
        Height             TEXT,
        SourceOfFund       TEXT,
        IsActive           INTEGER NOT NULL DEFAULT 1,
        AvatarURL          TEXT,
        AuditUser          TEXT,
        AuditDate          TEXT,
        IsReported         INTEGER NOT NULL DEFAULT 0,
        EditUser           TEXT,
        EditDate           TEXT,

        sync_status        TEXT    NOT NULL DEFAULT 'synced'
                           CHECK (sync_status IN ('synced', 'pending', 'failed')),
        deleted            INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_tblPerson_Name ON tblPerson (LastName, FirstName);
    `,
  },
  {
    version: 3,
    up: `
      -- Mirrors server tblDeviceRegistration. PersonID → tblPerson is a FK on
      -- the server; not enforced here (see tblUsers).
      CREATE TABLE IF NOT EXISTS tblDeviceRegistration (
        DeviceID    TEXT    PRIMARY KEY NOT NULL,
        DeviceType  TEXT,
        PersonID    TEXT,
        IsActive    INTEGER NOT NULL DEFAULT 1,
        AuditUser   TEXT,
        AuditDate   TEXT,
        EditUser    TEXT,
        EditDate    TEXT,

        sync_status TEXT    NOT NULL DEFAULT 'synced'
                    CHECK (sync_status IN ('synced', 'pending', 'failed')),
        deleted     INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_tblDeviceRegistration_PersonID
        ON tblDeviceRegistration (PersonID);
    `,
  },
  {
    version: 4,
    up: `
      -- Outbox in the same shape as the server's tblSyncOutbox (replaces sync_queue).
      -- Server: OutboxId is the PK and Sequence an AUTO_INCREMENT unique key. SQLite
      -- only auto-increments an INTEGER PRIMARY KEY, so the roles are swapped here;
      -- OutboxId stays unique. Sequence = the order rows were queued in.
      CREATE TABLE IF NOT EXISTS tblSyncOutbox (
        Sequence          INTEGER PRIMARY KEY AUTOINCREMENT,
        OutboxId          TEXT    NOT NULL UNIQUE,
        EventId           TEXT,
        SourceNodeId      TEXT,
        DestinationNodeId TEXT,
        EventType         TEXT    CHECK (EventType IN ('CREATED', 'UPDATED', 'DELETED')),
        EntityType        TEXT,
        EntityId          TEXT,
        BaseVersion       INTEGER,
        EntityVersion     INTEGER,
        Payload           TEXT,
        Status            TEXT    NOT NULL DEFAULT 'PENDING'
                          CHECK (Status IN ('PENDING', 'SENT', 'FAILED')),
        AttemptCount      INTEGER NOT NULL DEFAULT 0,
        NextAttemptAt     TEXT,
        LastAttemptAt     TEXT,
        OccuredAt         TEXT,
        ReceivedAt        TEXT,
        LastError         TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_tblSyncOutbox_Status_Sequence
        ON tblSyncOutbox (Status, Sequence);
      CREATE INDEX IF NOT EXISTS idx_tblSyncOutbox_Entity
        ON tblSyncOutbox (EntityType, EntityId);

      -- Carry over anything still waiting in the old outbox, in its original order.
      -- IDs use the server's Guid "N" format (32 hex chars, no dashes).
      INSERT INTO tblSyncOutbox (OutboxId, EventId, SourceNodeId, DestinationNodeId,
        EventType, EntityType, EntityId, Payload, Status, AttemptCount,
        NextAttemptAt, OccuredAt, LastError)
      SELECT lower(hex(randomblob(16))), lower(hex(randomblob(16))), 'EKOLEKTA', 'BPIS',
        CASE operation WHEN 'create' THEN 'CREATED' WHEN 'update' THEN 'UPDATED' ELSE 'DELETED' END,
        entity, record_id, payload, 'PENDING', attempts,
        created_at, created_at, last_error
      FROM sync_queue ORDER BY id;

      DROP TABLE sync_queue;
    `,
  },
  {
    version: 5,
    up: `
      -- Writes now go through OSP-SYNC-WORKER-API, which reports how far each event
      -- got on-prem. Status gains the worker's final states, as on the server:
      --   PENDING → SENT (in the worker's inbox) → APPLIED | SKIPPED | FAILED.
      -- SQLite cannot change a CHECK constraint, so the table is rebuilt.
      CREATE TABLE tblSyncOutbox_v5 (
        Sequence          INTEGER PRIMARY KEY AUTOINCREMENT,
        OutboxId          TEXT    NOT NULL UNIQUE,
        EventId           TEXT,
        SourceNodeId      TEXT,
        DestinationNodeId TEXT,
        EventType         TEXT    CHECK (EventType IN ('CREATED', 'UPDATED', 'DELETED')),
        EntityType        TEXT,
        EntityId          TEXT,
        BaseVersion       INTEGER,
        EntityVersion     INTEGER,
        Payload           TEXT,
        Status            TEXT    NOT NULL DEFAULT 'PENDING'
                          CHECK (Status IN ('PENDING', 'SENT', 'APPLIED', 'SKIPPED', 'FAILED')),
        AttemptCount      INTEGER NOT NULL DEFAULT 0,
        NextAttemptAt     TEXT,
        LastAttemptAt     TEXT,
        OccuredAt         TEXT,
        ReceivedAt        TEXT,
        LastError         TEXT
      );
      INSERT INTO tblSyncOutbox_v5 SELECT * FROM tblSyncOutbox;

      -- Old meanings: SENT = accepted by the per-table API (done); FAILED = rejected
      -- there and awaiting retry, so it is queued again for the worker.
      UPDATE tblSyncOutbox_v5 SET Status = 'APPLIED' WHERE Status = 'SENT';
      UPDATE tblSyncOutbox_v5 SET Status = 'PENDING', LastError = NULL WHERE Status = 'FAILED';

      DROP TABLE tblSyncOutbox;
      ALTER TABLE tblSyncOutbox_v5 RENAME TO tblSyncOutbox;
      CREATE INDEX IF NOT EXISTS idx_tblSyncOutbox_Status_Sequence
        ON tblSyncOutbox (Status, Sequence);
      CREATE INDEX IF NOT EXISTS idx_tblSyncOutbox_Entity
        ON tblSyncOutbox (EntityType, EntityId);
      CREATE INDEX IF NOT EXISTS idx_tblSyncOutbox_EventId
        ON tblSyncOutbox (EventId);
    `,
  },
  {
    version: 6,
    up: `
      -- Node ids now name the user: SourceNodeId = EKOLEKTA:<branch>,
      -- SenderNodeId = EKOLEKTA:<SalesForceCode>. Older rows keep their ids;
      -- a NULL SenderNodeId is sent as the SourceNodeId.
      ALTER TABLE tblSyncOutbox ADD COLUMN SenderNodeId TEXT;
    `,
  },
];

export const DATABASE_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

/**
 * Runs on every app launch (via SQLiteProvider `onInit`). Opening the database
 * creates the file if it doesn't exist yet; `user_version` is 0 for a brand-new
 * file, so all migrations run. On later launches only newer migrations run.
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  // Per-connection settings — must be applied on every open, outside a transaction.
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return;

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.up);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}
