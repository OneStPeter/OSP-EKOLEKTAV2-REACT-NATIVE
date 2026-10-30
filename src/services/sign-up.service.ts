import type { SQLiteDatabase } from "expo-sqlite";

import { getUser, getUserByUserName } from "@/db/repositories/user.repository";
import {
  hasOutboxPayload,
  insertSentOutbox,
  notifyQueueChange,
  prepareOutbox,
  saveNodeIdentity,
  type NodeIdentity,
} from "@/db/sync-queue";
import { ApiError } from "@/services/api";
import { getDeviceId, getDeviceType } from "@/services/device.service";
import type { VerifiedEmployee } from "@/services/employee-verification.service";
import { sendToInbox } from "@/services/sync.service";
import type { TblDeviceRegistration } from "@/types/device-registration";

export type SignUpInput = {
  /** From `verifyEmployeeEmail`; the device is registered to this employee's person. */
  employee: VerifiedEmployee;
};

export type SignUpResult = {
  personId: string;
  deviceId: string;
};

export class SignUpError extends Error {
  name = "SignUpError";
}

/**
 * Registers this device to a verified employee through OSP-SYNC-WORKER-API only.
 * Online only: the tblDeviceRegistration row goes straight to the worker's inbox,
 * and only once it is accepted is it stored in tblSyncOutbox (as SENT) so the next
 * sync tracks its outcome. Any failure throws a SignUpError and nothing is stored,
 * so the user can simply try again. The local tblDeviceRegistration is filled from
 * the server once the row is applied there.
 *
 * The employee's tblPerson row already exists on the server, so the row uses its
 * PersonID (that is what ties the device to the verified email) and no person is created.
 */
export async function signUp(
  db: SQLiteDatabase,
  input: SignUpInput,
): Promise<SignUpResult> {
  const email = input.employee.email.trim().toLowerCase();
  const personId = input.employee.personId;

  // The server checked tblUsers at verification; these catch an account already
  // on this device, or a sign-up from it that is not yet applied.
  if (
    (await getUser(db, personId)) ||
    (await getUserByUserName(db, email)) ||
    (await hasOutboxPayload(db, "tblDeviceRegistration", "PersonID", personId))
  ) {
    throw new SignUpError(
      "This agent already has an account. Please log in instead.",
    );
  }

  const deviceId = await getDeviceId();
  // AuditUser is varchar(25); self-registration is audited as the new user.
  const auditUser = input.employee.salesForceCode;

  const device: TblDeviceRegistration = {
    DeviceID: deviceId,
    DeviceType: getDeviceType(),
    PersonID: personId,
    IsActive: 1,
    AuditUser: auditUser,
    AuditDate: new Date().toISOString(),
    EditUser: auditUser,
    EditDate: new Date().toISOString(),
  };

  const identity: NodeIdentity = {
    branch: input.employee.orgDescription,
    salesForceCode: input.employee.salesForceCode,
  };
  const events = await prepareOutbox(
    db,
    [
      {
        entity: "tblDeviceRegistration",
        recordId: deviceId,
        operation: "create",
        payload: device,
      },
    ],
    identity,
  );

  let accepted: Set<string>;
  try {
    accepted = await sendToInbox(events);
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 0;
    throw new SignUpError(
      status === 0
        ? "Unable to reach the server. Please check your connection and try again."
        : "The server could not accept your sign-up. Please try again.",
    );
  }
  if (!events.every((e) => accepted.has(e.eventId.toLowerCase()))) {
    throw new SignUpError(
      "The server could not accept your sign-up. Please try again.",
    );
  }

  // Later changes from this device are sent under the same node ids.
  await db.withTransactionAsync(async () => {
    await insertSentOutbox(db, events);
    await saveNodeIdentity(db, identity);
  });
  notifyQueueChange();

  return { personId, deviceId };
}
