// Offline-first sync engine, through OSP-SYNC-WORKER-API — the same route the
// lifeplan API's own SyncOutboxWorker takes. Every request that changes server
// data goes this way; the app never writes to a table through the API directly.
//
// The local SQLite database is the source of truth for the UI. Screens only read
// and write SQLite; every write also lands in `tblSyncOutbox` (the outbox). When the
// device is online this engine:
//   1. PUSH — sends PENDING outbox rows, in Sequence order, as inbox events:
//        POST {WORKER}/sync/inbox           body: SyncEventDto[]
//        → { acceptedEventIds }             accepted rows become SENT
//      The inbox dedupes on EventId, so a batch resent after a lost response is harmless.
//   2. CONFIRM — asks how far SENT rows have got on-prem:
//        POST {WORKER}/sync/inbox/status    body: EventId[]
//        APPLIED / SKIPPED → the record is synced; FAILED → the record is failed;
//        PENDING → asked again next time (tables the worker does not apply yet
//        stay here until it does); unknown → sent again.
//   3. PULL — people changed on-prem since the last pull, refreshed if held here:
//        GET  {WORKER}/changes?after={cursor}   → { personIds, next, hasMore }
//        POST {WORKER}/person/batch             → their records (see account-sync)

import type { SQLiteDatabase } from "expo-sqlite";

import { deviceRegistrationSync } from "@/db/repositories/device-registration.repository";
import { personSync } from "@/db/repositories/person.repository";
import { userSync } from "@/db/repositories/user.repository";
import {
  getMeta,
  getQueue,
  getSentEvents,
  hasQueuedChanges,
  markOutboxSent,
  notifyQueueChange,
  recordOutboxFailure,
  setMeta,
  setOutboxStatus,
  type OutboxItem,
  type OutboxStatus,
  type SyncOperation,
} from "@/db/sync-queue";
import {
  applyPersons,
  type WorkerPerson,
} from "@/services/account-sync.service";
import { isSyncWorkerConfigured, syncWorkerRequest } from "@/services/api";

export type SyncEntity = {
  /** Local table name; also the EntityType value in tblSyncOutbox. */
  name: string;
  primaryKey: string;
  /** The queued row as the shared model expects it. */
  toPayload: (record: Record<string, unknown>) => Record<string, unknown>;
  markSynced: (
    db: SQLiteDatabase,
    id: string,
    operation: SyncOperation,
  ) => Promise<void>;
  markFailed: (db: SQLiteDatabase, id: string) => Promise<void>;
};

// Every table the app writes. Rows of other tables are still sent, unconverted.
const ENTITIES: SyncEntity[] = [personSync, userSync, deviceRegistrationSync];

// The worker's limits: 500 events per inbox call, 50 people per batch read.
const PUSH_BATCH_SIZE = 100;
const STATUS_BATCH_SIZE = 500;
const PERSON_BATCH_SIZE = 50;
const CHANGES_CURSOR_KEY = "worker_changes_after";

export type SyncResult =
  | { status: "skipped"; reason: string }
  | { status: "ok"; pushed: number; pulled: number }
  | { status: "error"; error: string; pushed: number };

let inFlight: Promise<SyncResult> | null = null;

// EXPO_PUBLIC_SYNC_ENABLED=false keeps every change on the device (nothing is sent).
const isSyncEnabled = process.env.EXPO_PUBLIC_SYNC_ENABLED !== "false";

/** Runs a full push + confirm + pull. Concurrent calls share the same run. */
export function runSync(db: SQLiteDatabase): Promise<SyncResult> {
  if (!isSyncWorkerConfigured) {
    return Promise.resolve({
      status: "skipped",
      reason: "Sync worker URL is not configured.",
    });
  }
  if (!isSyncEnabled) {
    return Promise.resolve({ status: "skipped", reason: "Sync is disabled." });
  }
  inFlight ??= doSync(db).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doSync(db: SQLiteDatabase): Promise<SyncResult> {
  let pushed = 0;
  try {
    pushed = await pushChanges(db);
    await confirmSent(db);
    const pulled = await pullChanges(db);
    return { status: "ok", pushed, pulled };
  } catch (e) {
    return { status: "error", error: errorMessage(e), pushed };
  } finally {
    notifyQueueChange();
  }
}

/** Sends the queue batch by batch; a failed batch holds back everything behind it. */
async function pushChanges(db: SQLiteDatabase) {
  let pushed = 0;
  for (;;) {
    const batch = await getQueue(db, PUSH_BATCH_SIZE);
    if (batch.length === 0) return pushed;

    let accepted: Set<string>;
    try {
      accepted = await sendToInbox(batch);
    } catch (e) {
      for (const row of batch)
        await recordOutboxFailure(db, row.outboxId, errorMessage(e));
      throw e;
    }

    for (const row of batch) {
      if (accepted.has(row.eventId.toLowerCase())) {
        await markOutboxSent(db, row.outboxId);
        pushed++;
      } else {
        await recordOutboxFailure(
          db,
          row.outboxId,
          "Not accepted by the sync worker.",
        );
      }
    }
    if (accepted.size < batch.length)
      throw new Error("The sync worker did not accept every event.");
  }
}

/**
 * POSTs outbox rows to the worker's inbox; returns the accepted EventIds,
 * lower-cased. Writes nothing locally — callers record the outcome.
 */
export async function sendToInbox(rows: OutboxItem[]): Promise<Set<string>> {
  const res = await syncWorkerRequest<{ acceptedEventIds: string[] }>(
    "POST",
    "/Sync/inbox",
    rows.map(toEvent),
    {
      headers: { "X-Api-Key": process.env.EXPO_PUBLIC_SYNC_API_KEY ?? "" },
    },
  );
  return new Set(res.acceptedEventIds.map((id) => id.toLowerCase()));
}

function toEvent(row: OutboxItem) {
  const entity = findEntity(row.entity);
  const record = row.payload ? JSON.parse(row.payload) : null;
  return {
    EventId: row.eventId,
    // Built when the row was queued (see sync-queue `nodeIds`), so a resend
    // carries the same ids. Rows queued before SenderNodeId existed have none.
    SourceNodeId: row.sourceNodeId,
    SourceSequence: row.sequence,
    SenderNodeId: row.senderNodeId ?? row.sourceNodeId,
    DestinationNodeId: row.destinationNodeId,
    EventType: { create: "CREATED", update: "UPDATED", delete: "DELETED" }[
      row.operation
    ],
    EntityType: row.entity,
    EntityId: row.recordId,
    // Deletes queued before payloads carried the key: the worker needs it.
    Payload: JSON.stringify(
      record && entity
        ? entity.toPayload(record)
        : (record ?? (entity ? { [entity.primaryKey]: row.recordId } : null)),
    ),
    OccuredAt: row.occuredAt,
  };
}

type InboxStatus = {
  eventId: string;
  status: string | null;
  lastError: string | null;
};

// Applied beats still pending (another copy may yet apply), which beats failed.
const statusRank = (s: string | null) =>
  s === "APPLIED" || s === "SKIPPED" ? 2 : s === "FAILED" ? 0 : 1;

async function confirmSent(db: SQLiteDatabase) {
  const sent = await getSentEvents(db, STATUS_BATCH_SIZE);
  if (sent.length === 0) return;

  const statuses = await syncWorkerRequest<InboxStatus[]>(
    "POST",
    "/sync/inbox/status",
    sent.map((r) => r.eventId),
  );
  const byEventId = new Map<string, InboxStatus>();
  for (const s of statuses) {
    const key = s.eventId.toLowerCase();
    const current = byEventId.get(key);
    if (!current || statusRank(s.status) > statusRank(current.status))
      byEventId.set(key, s);
  }

  for (const row of sent) {
    const status = byEventId.get(row.eventId.toLowerCase());
    const entity = findEntity(row.entity);

    if (!status) {
      // Accepted but no longer in the inbox; resending is safe (deduped on EventId).
      await setOutboxStatus(
        db,
        row.outboxId,
        "PENDING",
        "Not found in the sync worker's inbox; resending.",
      );
    } else if (status.status === "APPLIED" || status.status === "SKIPPED") {
      await setOutboxStatus(
        db,
        row.outboxId,
        status.status as OutboxStatus,
        status.lastError,
      );
      // Only once every change to the record is on the server.
      if (entity && !(await hasQueuedChanges(db, row.entity, row.recordId))) {
        await entity.markSynced(db, row.recordId, row.operation);
      }
    } else if (status.status === "FAILED") {
      await setOutboxStatus(
        db,
        row.outboxId,
        "FAILED",
        `Failed on-prem: ${status.lastError ?? ""}`,
      );
      await entity?.markFailed(db, row.recordId);
    } else {
      // Still PENDING in the inbox: checked again on the next sync.
      await setOutboxStatus(db, row.outboxId, "SENT", null);
    }
  }
}

async function pullChanges(db: SQLiteDatabase) {
  const cursor = await getMeta(db, CHANGES_CURSOR_KEY);
  if (cursor === null) {
    // First pull: start from now. What this device holds is current — it came
    // from the login migration or was written here.
    const res = await syncWorkerRequest<{ next: number }>("GET", "/changes");
    await setMeta(db, CHANGES_CURSOR_KEY, String(res.next));
    return 0;
  }

  let after = cursor;
  let pulled = 0;
  for (;;) {
    const res = await syncWorkerRequest<{
      personIds: string[];
      next: number;
      hasMore: boolean;
    }>("GET", `/changes?after=${encodeURIComponent(after)}`);

    const held = await heldPersonIds(db, res.personIds);
    for (let i = 0; i < held.length; i += PERSON_BATCH_SIZE) {
      const persons = await syncWorkerRequest<WorkerPerson[]>(
        "POST",
        "/person/batch",
        held.slice(i, i + PERSON_BATCH_SIZE),
      );
      await applyPersons(db, persons);
      pulled += persons.length;
    }

    // Saved once the page is applied, so a failure re-reads it.
    after = String(res.next);
    await setMeta(db, CHANGES_CURSOR_KEY, after);
    if (!res.hasMore) return pulled;
  }
}

/** The people this device keeps; others' changes are none of its business. */
async function heldPersonIds(db: SQLiteDatabase, personIds: string[]) {
  if (personIds.length === 0) return [];
  const rows = await db.getAllAsync<{ PersonID: string }>(
    `SELECT PersonID FROM tblPerson WHERE PersonID IN (${personIds.map(() => "?").join(", ")})`,
    personIds,
  );
  return rows.map((r) => r.PersonID);
}

function findEntity(name: string) {
  return ENTITIES.find((e) => e.name.toLowerCase() === name.toLowerCase());
}

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}
