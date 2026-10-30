import type { SyncStatus } from "@/db/repositories/synced-table";

// Mirrors server table tblDeviceRegistration. Dates are ISO 8601 strings; tinyint(1) flags are 0 | 1.
export interface TblDeviceRegistration {
  DeviceID: string; // PK
  DeviceType: string | null;
  PersonID: string | null; // FK → tblPerson
  IsActive: 0 | 1;
  AuditUser: string | null;
  AuditDate: string | null;
  EditUser: string | null;
  EditDate: string | null;
}

export type LocalDeviceRegistration = TblDeviceRegistration & { syncStatus: SyncStatus };
