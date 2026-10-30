import { randomUUID } from "expo-crypto";
import type { SQLiteDatabase } from "expo-sqlite";

// Outbox = tblSyncOutbox, the same shape the server uses (see migrations v4, v5).
// Row lifecycle, as on the server: PENDING → SENT (in the sync worker's inbox)
// → APPLIED | SKIPPED | FAILED (the worker's outcome on-prem).

export type SyncOperation = "create" | "update" | "delete";

type EventType = "CREATED" | "UPDATED" | "DELETED";
export type OutboxStatus =
  | "PENDING"
  | "SENT"
  | "APPLIED"
  | "SKIPPED"
  | "FAILED";

const EVENT_TYPES: Record<SyncOperation, EventType> = {
  create: "CREATED",
  update: "UPDATED",
  delete: "DELETED",
};
const OPERATIONS: Record<EventType, SyncOperation> = {
  CREATED: "create",
  UPDATED: "update",
  DELETED: "delete",
};

/** This app, as a sync node. */
const SOURCE_NODE_ID = "EKOLEKTA";
/** OSP-LIFEPLAN-OPERATION-API's node (SalesForceHelper.SystemCode). */
const DESTINATION_NODE_ID = "BPIS";

/** Server Guid "N" format: 32 hex chars, no dashes. */
const newId = () => randomUUID().replace(/-/g, "");

/** Who this device's events come from; saved at sign-up (see `saveNodeIdentity`). */
export type NodeIdentity = {
  /** The employee's branch, e.g. "Cubao Branch". */
  branch: string | null;
  salesForceCode: string | null;
};

const BRANCH_KEY = "node_branch";
const SALES_FORCE_CODE_KEY = "node_sales_force_code";

/** SourceNodeId = EKOLEKTA:<branch>, SenderNodeId = EKOLEKTA:<SalesForceCode>. */
function nodeIds({ branch, salesForceCode }: NodeIdentity) {
  const sourceNodeId = branch ? `${SOURCE_NODE_ID}:${branch}` : SOURCE_NODE_ID;
  return {
    sourceNodeId,
    senderNodeId: salesForceCode
      ? `${SOURCE_NODE_ID}:${salesForceCode}`
      : sourceNodeId,
  };
}

export async function getNodeIdentity(
  db: SQLiteDatabase,
): Promise<NodeIdentity> {
  return {
    branch: await getMeta(db, BRANCH_KEY),
    salesForceCode: await getMeta(db, SALES_FORCE_CODE_KEY),
  };
}

export async function saveNodeIdentity(
  db: SQLiteDatabase,
  { branch, salesForceCode }: NodeIdentity,
) {
  if (branch) await setMeta(db, BRANCH_KEY, branch);
  else await deleteMeta(db, BRANCH_KEY);
  if (salesForceCode) await setMeta(db, SALES_FORCE_CODE_KEY, salesForceCode);
  else await deleteMeta(db, SALES_FORCE_CODE_KEY);
}

type OutboxRow = {
  Sequence: number;
  OutboxId: string;
  EventId: string;
  SourceNodeId: string | null;
  SenderNodeId: string | null;
  DestinationNodeId: string | null;
  EventType: EventType;
  EntityType: string;
  EntityId: string;
  Payload: string | null;
  Status: OutboxStatus;
  AttemptCount: number;
  OccuredAt: string | null;
  LastError: string | null;
};

/** An outbox row, in the shape the sync engine works with. */
export type OutboxItem = {
  outboxId: string;
  eventId: string;
  sequence: number;
  sourceNodeId: string | null;
  senderNodeId: string | null;
  destinationNodeId: string | null;
  entity: string;
  recordId: string;
  operation: SyncOperation;
  payload: string | null;
  occuredAt: string | null;
};

const toItem = (r: OutboxRow): OutboxItem => ({
  outboxId: r.OutboxId,
  eventId: r.EventId,
  sequence: r.Sequence,
  sourceNodeId: r.SourceNodeId,
  senderNodeId: r.SenderNodeId,
  destinationNodeId: r.DestinationNodeId,
  entity: r.EntityType,
  recordId: r.EntityId,
  operation: OPERATIONS[r.EventType],
  payload: r.Payload,
  occuredAt: r.OccuredAt,
});

// ── Change notifications ────────────────────────────────────────────────────
// Lets the SyncProvider react to local writes without polling.
const listeners = new Set<() => void>();

export function onQueueChange(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyQueueChange() {
  listeners.forEach((l) => l());
}

// ── Outbox ──────────────────────────────────────────────────────────────────
/**
 * Adds a PENDING tblSyncOutbox row. Call inside the same transaction as the
 * local write so both succeed or fail together. `entity` is the table name
 * (EntityType) and `recordId` its primary key (EntityId).
 */
export async function enqueue(
  db: SQLiteDatabase,
  entity: string,
  recordId: string,
  operation: SyncOperation,
  payload?: unknown,
) {
  const now = new Date().toISOString();
  const { sourceNodeId, senderNodeId } = nodeIds(await getNodeIdentity(db));
  await db.runAsync(
    `INSERT INTO tblSyncOutbox (OutboxId, EventId, SourceNodeId, SenderNodeId, DestinationNodeId,
       EventType, EntityType, EntityId, Payload, Status, AttemptCount, NextAttemptAt, OccuredAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?, ?)`,
    newId(),
    newId(),
    sourceNodeId,
    senderNodeId,
    DESTINATION_NODE_ID,
    EVENT_TYPES[operation],
    entity,
    recordId,
    payload === undefined ? null : JSON.stringify(payload),
    now,
    now,
  );
}

export type NewOutboxEvent = {
  entity: string;
  recordId: string;
  operation: SyncOperation;
  payload: unknown;
};

/**
 * Outbox rows for events sent to the worker BEFORE they are stored (see
 * `insertSentOutbox`). Ids are generated and the next Sequence values reserved,
 * so the rows stored afterwards match what was sent. Assumes nothing else is
 * queued in between, which holds while a screen waits on its own send.
 * `identity` names the sender, since it is not saved yet during a sign-up.
 */
export async function prepareOutbox(
  db: SQLiteDatabase,
  events: NewOutboxEvent[],
  identity: NodeIdentity,
): Promise<OutboxItem[]> {
  const { sourceNodeId, senderNodeId } = nodeIds(identity);
  // AUTOINCREMENT never reuses a value, so start past the highest ever issued.
  const row = await db.getFirstAsync<{ last: number | null }>(
    `SELECT MAX(s) AS last FROM (
       SELECT seq AS s FROM sqlite_sequence WHERE name = 'tblSyncOutbox'
       UNION ALL SELECT MAX(Sequence) FROM tblSyncOutbox)`,
  );
  const first = (row?.last ?? 0) + 1;
  const now = new Date().toISOString();

  return events.map((e, i) => ({
    outboxId: newId(),
    eventId: newId(),
    sequence: first + i,
    sourceNodeId,
    senderNodeId,
    destinationNodeId: DESTINATION_NODE_ID,
    entity: e.entity,
    recordId: e.recordId,
    operation: e.operation,
    payload: JSON.stringify(e.payload),
    occuredAt: now,
  }));
}

/**
 * Stores rows from `prepareOutbox` that the worker's inbox already accepted, as
 * SENT: the next sync checks their outcome like any other sent row.
 */
export async function insertSentOutbox(
  db: SQLiteDatabase,
  items: OutboxItem[],
) {
  const now = new Date().toISOString();
  for (const item of items) {
    await db.runAsync(
      `INSERT INTO tblSyncOutbox (Sequence, OutboxId, EventId, SourceNodeId, SenderNodeId,
         DestinationNodeId, EventType, EntityType, EntityId, Payload, Status, AttemptCount,
         NextAttemptAt, LastAttemptAt, OccuredAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SENT', 1, ?, ?, ?)`,
      item.sequence,
      item.outboxId,
      item.eventId,
      item.sourceNodeId,
      item.senderNodeId,
      item.destinationNodeId,
      EVENT_TYPES[item.operation],
      item.entity,
      item.recordId,
      item.payload,
      now,
      now,
      item.occuredAt,
    );
  }
}

/** The next `limit` rows still to send, in the order they were queued. */
export async function getQueue(
  db: SQLiteDatabase,
  limit: number,
): Promise<OutboxItem[]> {
  const rows = await db.getAllAsync<OutboxRow>(
    "SELECT * FROM tblSyncOutbox WHERE Status = 'PENDING' ORDER BY Sequence ASC LIMIT ?",
    limit,
  );
  return rows.map(toItem);
}

/** Rows in the worker's inbox awaiting their outcome, least recently checked first. */
export async function getSentEvents(
  db: SQLiteDatabase,
  limit: number,
): Promise<OutboxItem[]> {
  const rows = await db.getAllAsync<OutboxRow>(
    `SELECT * FROM tblSyncOutbox WHERE Status = 'SENT' AND EventId IS NOT NULL
     ORDER BY LastAttemptAt ASC, Sequence ASC LIMIT ?`,
    limit,
  );
  return rows.map(toItem);
}

/** Local changes not yet on the server: unsent, or sent and not yet applied. */
export async function getPendingCount(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM tblSyncOutbox WHERE Status IN ('PENDING', 'SENT')",
  );
  return row?.n ?? 0;
}

/** True while a change to this record has not been applied on the server yet. */
export async function hasQueuedChanges(
  db: SQLiteDatabase,
  entity: string,
  recordId: string,
) {
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM tblSyncOutbox
     WHERE EntityType = ? AND EntityId = ? AND Status IN ('PENDING', 'SENT')`,
    entity,
    recordId,
  );
  return (row?.n ?? 0) > 0;
}

/**
 * True while a change to `entity` whose payload has `field` = `value` is queued
 * or already applied (anything but FAILED). Covers records that exist only as
 * outbox rows, e.g. a sign-up, which is never written to its local tables.
 */
export async function hasOutboxPayload(
  db: SQLiteDatabase,
  entity: string,
  field: string,
  value: string,
) {
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM tblSyncOutbox
     WHERE EntityType = ? AND Status <> 'FAILED' AND EventType <> 'DELETED'
       AND json_extract(Payload, ?) = ? COLLATE NOCASE`,
    entity,
    `$.${field}`,
    value,
  );
  return (row?.n ?? 0) > 0;
}

/** Marks a row accepted into the worker's inbox; its outcome is checked next. */
export async function markOutboxSent(db: SQLiteDatabase, outboxId: string) {
  await db.runAsync(
    `UPDATE tblSyncOutbox
     SET Status = 'SENT', AttemptCount = AttemptCount + 1, LastAttemptAt = ?, LastError = NULL
     WHERE OutboxId = ?`,
    new Date().toISOString(),
    outboxId,
  );
}

/** Records a failed send; the row stays PENDING and goes out again on the next sync. */
export async function recordOutboxFailure(
  db: SQLiteDatabase,
  outboxId: string,
  error: string,
) {
  await db.runAsync(
    `UPDATE tblSyncOutbox
     SET AttemptCount = AttemptCount + 1, LastAttemptAt = ?, LastError = ?
     WHERE OutboxId = ?`,
    new Date().toISOString(),
    error.slice(0, 500), // varchar(500) on the server
    outboxId,
  );
}

/**
 * Records a status check of a SENT row: its outcome (APPLIED / SKIPPED / FAILED),
 * PENDING to send it again, or SENT again when the worker has not applied it yet.
 * Rows are kept (not deleted) as a local audit trail, like the server.
 */
export async function setOutboxStatus(
  db: SQLiteDatabase,
  outboxId: string,
  status: OutboxStatus,
  error: string | null,
) {
  await db.runAsync(
    "UPDATE tblSyncOutbox SET Status = ?, LastAttemptAt = ?, LastError = ? WHERE OutboxId = ?",
    status,
    new Date().toISOString(),
    error?.slice(0, 500) ?? null,
    outboxId,
  );
}

// ── Sync metadata ───────────────────────────────────────────────────────────
export async function getMeta(db: SQLiteDatabase, key: string) {
  const row = await db.getFirstAsync<{ value: string | null }>(
    "SELECT value FROM sync_meta WHERE key = ?",
    key,
  );
  return row?.value ?? null;
}

export async function deleteMeta(db: SQLiteDatabase, key: string) {
  await db.runAsync("DELETE FROM sync_meta WHERE key = ?", key);
}

export async function setMeta(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    `INSERT INTO sync_meta (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    key,
    value,
  );
}
