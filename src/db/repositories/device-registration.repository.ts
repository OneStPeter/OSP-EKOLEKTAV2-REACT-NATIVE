import type { SQLiteDatabase } from "expo-sqlite";

import { createSyncedTable } from "@/db/repositories/synced-table";
import {
  deleteMeta,
  getMeta,
  hasOutboxPayload,
  notifyQueueChange,
  setMeta,
} from "@/db/sync-queue";
import { getDeviceId, getDeviceType } from "@/services/device.service";
import type { LocalDeviceRegistration, TblDeviceRegistration } from "@/types/device-registration";

const devices = createSyncedTable<TblDeviceRegistration>({
  table: "tblDeviceRegistration",
  primaryKey: "DeviceID",
  columns: [
    "DeviceID",
    "DeviceType",
    "PersonID",
    "IsActive",
    "AuditUser",
    "AuditDate",
    "EditUser",
    "EditDate",
  ],
  booleans: ["IsActive"],
  orderBy: "AuditDate DESC",
});

export const listDeviceRegistrations = devices.list;
export const getDeviceRegistration = devices.get;
export const saveDeviceRegistration = devices.save;
export const deleteDeviceRegistration = devices.remove;
export const deviceRegistrationSync = devices.sync;

/**
 * Same as `registerCurrentDevice`, but inside a transaction the caller already
 * opened. `deviceId` must be resolved beforehand (`getDeviceId()`), since the
 * lookup touches secure storage and shouldn't run while the transaction is open.
 * Caller must `notifyQueueChange()` after commit.
 */
export async function registerDeviceInTransaction(
  db: SQLiteDatabase,
  deviceId: string,
  personId: string,
  auditUser: string,
) {
  const existing = await devices.get(db, deviceId);
  if (existing && existing.PersonID === personId && existing.IsActive === 1) return;

  await devices.saveInTransaction(
    db,
    {
      DeviceID: deviceId,
      DeviceType: getDeviceType(),
      PersonID: personId,
      IsActive: 1,
      AuditUser: existing?.AuditUser ?? null,
      AuditDate: existing?.AuditDate ?? null,
      EditUser: existing?.EditUser ?? null,
      EditDate: existing?.EditDate ?? null,
    },
    auditUser.slice(0, 25), // varchar(25) on the server
  );
}

/**
 * Registers (or re-assigns) this device to `personId`. Saved locally and queued
 * for upload, so it works offline. Re-registering the same person is a no-op.
 */
export async function registerCurrentDevice(
  db: SQLiteDatabase,
  personId: string,
  auditUser: string,
) {
  const deviceId = await getDeviceId();
  await db.withTransactionAsync(() =>
    registerDeviceInTransaction(db, deviceId, personId, auditUser),
  );
  notifyQueueChange();
  return devices.get(db, deviceId);
}

// sync_meta key holding the time the server last confirmed this device is active.
const verifiedKey = (deviceId: string) => `device_verified:${deviceId}`;

/**
 * True when this device is known to be registered and active: a local
 * tblDeviceRegistration row, a sign-up queued in tblSyncOutbox (not yet failed
 * on-prem), or a previous confirmation from the server.
 */
export async function isCurrentDeviceRegistered(db: SQLiteDatabase): Promise<boolean> {
  const deviceId = await getDeviceId();
  const row = await devices.findOne(db, "DeviceID = ? AND IsActive = 1", deviceId);
  return (
    row !== null ||
    (await hasOutboxPayload(db, "tblDeviceRegistration", "DeviceID", deviceId)) ||
    (await getMeta(db, verifiedKey(deviceId))) !== null
  );
}

/**
 * Stores the server's yes/no for this device so the next offline launch reaches
 * the same decision. On "no", the confirmation and any synced local copy are
 * dropped as stale, but a registration still waiting to upload is kept.
 */
export async function cacheServerDeviceVerification(
  db: SQLiteDatabase,
  deviceId: string,
  exists: boolean,
) {
  if (exists) {
    await setMeta(db, verifiedKey(deviceId), new Date().toISOString());
    return;
  }
  await db.withTransactionAsync(async () => {
    await deleteMeta(db, verifiedKey(deviceId));
    await db.runAsync(
      "DELETE FROM tblDeviceRegistration WHERE DeviceID = ? AND sync_status = 'synced'",
      deviceId,
    );
  });
}

export function listDeviceRegistrationsForPerson(
  db: SQLiteDatabase,
  personId: string,
): Promise<LocalDeviceRegistration[]> {
  return devices.findMany(db, "PersonID = ?", personId);
}
