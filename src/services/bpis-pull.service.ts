// Pulls the agent's BPIS data into the local database through OSP-SYNC-WORKER-API,
// started once a sign-in succeeds (hooks/use-auth.ts). Like every other change it
// goes out through the outbox, as REQUEST events, and BPIS answers each with a
// RESPONSE carrying the same EventId:
//   1. REQUEST  one tblSyncOutbox row per table, to BPIS:<branch>
//        EntityType = the table, EntityId = SalesForceCode,
//        Payload    = { SalesForceCode, ReplyTo }
//      The sync engine pushes them to {WORKER}/sync/inbox like any outbox row.
//   2. RESPONSE pulled from {WORKER}/sync/outbox?nodeId={ReplyTo}
//        EntityType = the table, Payload = the rows, as a JSON array
//      Applied, then acknowledged (/sync/outbox/ack) and reported
//      (/sync/outbox/result: APPLIED, SKIPPED or FAILED).
// ReplyTo is EKOLEKTA:<SalesForceCode>, so the answer reaches this agent and not
// every device of the branch (the worker hands BPIS the SourceNodeId only).
//
// Reference tables (every local `ref*` table) come first, since every other row
// points at them. They are the only phase so far; agent records (tblPlanholder,
// tblPerson, tblBeneficiary, tblContactInfo, tblAddress, …) by OrgUnitCode and
// SalesForceCode follow the same way.
//
// Progress is kept in sync_meta, so responses arriving after a restart still
// count, and published to screens through `useBpisPull()`.

import type { SQLiteDatabase } from "expo-sqlite";
import { useSyncExternalStore } from "react";

import {
  enqueueRequests,
  getMeta,
  getNodeIdentity,
  nodeIds,
  notifyQueueChange,
  setMeta,
} from "@/db/sync-queue";
import { TableCache, upsertRows } from "@/services/account-sync.service";
import { isSyncWorkerConfigured, syncWorkerRequest } from "@/services/api";
import { ensureServerSchema } from "@/services/schema.service";


const REQUEST_KEY = "bpis_pull_request";
// sync_meta: SalesForceCode whose pull last completed without failures.
const COMPLETED_KEY = "bpis_pull_completed";
// An unanswered request older than this is asked again on the next sign-in.
const REQUEST_MAX_AGE_MS = 24 * 60 * 60 * 1000;
// After a sign-in, responses are polled for this long; later ones arrive with
// the next sync (sync.service calls `receiveResponses`).
const POLL_INTERVAL_MS = 5_000;
const POLL_DURATION_MS = 5 * 60 * 1000;
const PULL_PAGE_SIZE = 100;

/** One pull, as saved in sync_meta. */
type PullRequest = {
  requestedAt: string;
  salesForceCode: string;
  replyTo: string;
  /** EventId (lower-case) → table. */
  tables: Record<string, string>;
  /** EventIds answered and applied. */
  received: string[];
  /** Tables whose response could not be applied. */
  failed: string[];
};

export type BpisPullState = {
  status: "idle" | "running" | "done" | "error";
  message: string | null;
  completed: number;
  total: number;
  failed: string[];
  salesForceCode: string | null;
};

const IDLE: BpisPullState = {
  status: "idle",
  message: null,
  completed: 0,
  total: 0,
  failed: [],
  salesForceCode: null,
};

let state = IDLE;
const listeners = new Set<() => void>();

function publish(patch: Partial<BpisPullState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current pull's progress; re-renders as it advances. */
export function useBpisPull() {
  return useSyncExternalStore(subscribe, () => state);
}

function publishRequest(request: PullRequest, message: string | null) {
  const total = Object.keys(request.tables).length;
  const completed = request.received.length;
  const finished = completed >= total;
  publish({
    status: !finished ? "running" : request.failed.length > 0 ? "error" : "done",
    message: finished && request.failed.length > 0
      ? `${request.failed.length} of ${total} tables could not be saved.`
      : message,
    completed,
    total,
    failed: request.failed,
    salesForceCode: request.salesForceCode,
  });
}

// SQLiteProvider can replace and close its handle while a background pull runs.
const pullsInFlight = new WeakMap<SQLiteDatabase, Promise<void>>();

/**
 * Asks BPIS for the agent's data and waits a while for the answers, in the
 * background. Concurrent calls share one run; never throws — the app keeps
 * working from local data when this fails.
 */
export function startBpisPull(db: SQLiteDatabase): Promise<void> {
  const existing = pullsInFlight.get(db);
  if (existing) return existing;

  let pull: Promise<void>;
  pull = runPull(db)
    .catch((e) => publish({ status: "error", message: errorMessage(e) }))
    .finally(() => {
      if (pullsInFlight.get(db) === pull) pullsInFlight.delete(db);
    });
  pullsInFlight.set(db, pull);
  return pull;
}

async function runPull(db: SQLiteDatabase) {
  if (!isSyncWorkerConfigured) {
    publish({ ...IDLE, status: "error", message: "Sync worker URL is not configured." });
    return;
  }

  // Saved from the signed-in account (use-auth.ts) or at sign-up.
  const identity = await getNodeIdentity(db);
  const salesForceCode = identity.salesForceCode;
  if (!salesForceCode) {
    publish({
      ...IDLE,
      status: "error",
      message: "Your sales force code is not known yet. Sign in online to download your data.",
    });
    return;
  }
  const requester = { ...identity, salesForceCode };

  let request = await loadRequest(db);
  if (!request || isFinished(request) || isStale(request) || request.salesForceCode !== salesForceCode) {
    publish({ ...IDLE, status: "running", message: "Requesting reference tables…", salesForceCode });
    request = await requestReferenceTables(db, requester);
  }
  publishRequest(request, "Waiting for BPIS…");

  const deadline = Date.now() + POLL_DURATION_MS;
  while (!isFinished(request) && Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    try {
      await receiveResponses(db);
    } catch (e) {
      // Offline, say: the requests wait in the outbox and the polling goes on.
      console.log("BPIS responses not received:", errorMessage(e));
    }
    request = (await loadRequest(db)) ?? request;
  }

  if (!isFinished(request)) {
    publishRequest(request, "Still waiting for BPIS; continues with the next sync.");
  }
}

/** Queues one REQUEST per local reference table and has the sync engine send them. */
async function requestReferenceTables(
  db: SQLiteDatabase,
  requester: { branch: string | null; salesForceCode: string },
): Promise<PullRequest> {
  // Creates reference tables the live server schema added since the bundled one.
  await ensureServerSchema(db);
  const tables = await referenceTables(db);
  const replyTo = nodeIds(requester).senderNodeId;

  let request!: PullRequest;
  await db.withTransactionAsync(async () => {
    const eventIds = await enqueueRequests(
      db,
      requester,
      tables.map((table) => ({
        entity: table,
        recordId: requester.salesForceCode,
        payload: { SalesForceCode: requester.salesForceCode, ReplyTo: replyTo },
      })),
    );
    request = {
      requestedAt: new Date().toISOString(),
      salesForceCode: requester.salesForceCode,
      replyTo,
      tables: Object.fromEntries(eventIds.map((id, i) => [id.toLowerCase(), tables[i]])),
      received: [],
      failed: [],
    };
    await saveRequest(db, request);
  });

  // SyncProvider pushes the outbox shortly after a change.
  notifyQueueChange();
  return request;
}

type WorkerEvent = {
  eventId: string;
  eventType: string | null;
  entityType: string | null;
  payload: string | null;
};

type EventResult = { eventId: string; status: "APPLIED" | "SKIPPED" | "FAILED"; lastError?: string };

const responsesInFlight = new WeakMap<SQLiteDatabase, Promise<number>>();

/**
 * Applies the RESPONSE events waiting for this agent in the sync worker, then
 * acknowledges and reports them. Returns how many were applied. Called while a
 * pull is polled and on every sync; concurrent calls share one run.
 */
export function receiveResponses(db: SQLiteDatabase): Promise<number> {
  const existing = responsesInFlight.get(db);
  if (existing) return existing;

  let receiving: Promise<number>;
  receiving = doReceive(db).finally(() => {
    if (responsesInFlight.get(db) === receiving) responsesInFlight.delete(db);
  });
  responsesInFlight.set(db, receiving);
  return receiving;
}

async function doReceive(db: SQLiteDatabase): Promise<number> {
  const request = await loadRequest(db);
  // Nothing asked for, so nothing to wait for.
  if (!request) return 0;

  const nodeId = request.replyTo;
  const tables = new TableCache(db);
  let applied = 0;

  for (;;) {
    const events = await syncWorkerRequest<WorkerEvent[]>(
      "GET",
      `/sync/outbox?nodeId=${encodeURIComponent(nodeId)}&limit=${PULL_PAGE_SIZE}`,
    );
    if (events.length === 0) break;

    const results: EventResult[] = [];
    for (const event of events) {
      const result = await applyResponse(db, tables, request, event);
      if (result.status === "APPLIED") applied++;
      results.push(result);
    }
    // Saved before acknowledging: a lost acknowledgement only re-sends events,
    // and applying one again writes the same rows.
    await saveRequest(db, request);
    publishRequest(request, "Receiving reference tables…");

    const eventIds = events.map((e) => e.eventId);
    await syncWorkerRequest("POST", "/sync/outbox/ack", { nodeId, eventIds });
    await syncWorkerRequest("POST", "/sync/outbox/result", { nodeId, results });

    if (events.length < PULL_PAGE_SIZE) break;
  }
  return applied;
}

async function applyResponse(
  db: SQLiteDatabase,
  tables: TableCache,
  request: PullRequest,
  event: WorkerEvent,
): Promise<EventResult> {
  const eventId = event.eventId;
  const table = event.entityType ?? "";
  // Reference tables only, for now; a response to an earlier request still counts.
  if (event.eventType !== "RESPONSE" || !/^ref/i.test(table)) {
    return { eventId, status: "SKIPPED", lastError: "Not a reference table response." };
  }

  const key = eventId.toLowerCase();
  const isAwaited = key in request.tables && !request.received.includes(key);
  try {
    const parsed: unknown = event.payload ? JSON.parse(event.payload) : [];
    const rows = (Array.isArray(parsed) ? parsed : [parsed]) as Record<string, unknown>[];
    await db.withTransactionAsync(() => upsertRows(db, tables, table, rows));
    if (isAwaited) request.received.push(key);
    request.failed = request.failed.filter((t) => t !== table);
    return { eventId, status: "APPLIED" };
  } catch (e) {
    // Counted as answered, so the pull can finish; asked again next sign-in.
    if (isAwaited) request.received.push(key);
    if (!request.failed.includes(table)) request.failed.push(table);
    return { eventId, status: "FAILED", lastError: errorMessage(e).slice(0, 500) };
  }
}

async function referenceTables(db: SQLiteDatabase) {
  // LIKE is case-insensitive: refOrgUnit, RefPlanClass, …
  const rows = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'ref%' ORDER BY name",
  );
  return rows.map((r) => r.name);
}

async function loadRequest(db: SQLiteDatabase): Promise<PullRequest | null> {
  const json = await getMeta(db, REQUEST_KEY);
  return json ? (JSON.parse(json) as PullRequest) : null;
}

async function saveRequest(db: SQLiteDatabase, request: PullRequest) {
  await setMeta(db, REQUEST_KEY, JSON.stringify(request));
  // Sticky: a later re-pull (stale or after sign-in) does not undo it, so the
  // agent keeps signing in offline while it runs.
  if (isFinished(request) && request.failed.length === 0) {
    await setMeta(db, COMPLETED_KEY, request.salesForceCode);
  }
}

/**
 * True once a pull for this device's agent has delivered every table without a
 * failure: the local database then holds what the app needs to run offline.
 */
export async function hasCompletedBpisPull(db: SQLiteDatabase): Promise<boolean> {
  const { salesForceCode } = await getNodeIdentity(db);
  return !!salesForceCode && (await getMeta(db, COMPLETED_KEY)) === salesForceCode;
}

function isFinished(request: PullRequest) {
  return request.received.length >= Object.keys(request.tables).length;
}

function isStale(request: PullRequest) {
  return Date.now() - Date.parse(request.requestedAt) > REQUEST_MAX_AGE_MS;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}
