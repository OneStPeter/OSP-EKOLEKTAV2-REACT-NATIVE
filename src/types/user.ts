import type { SyncStatus } from "@/db/repositories/synced-table";

// Mirrors server table tblUsers. Dates are ISO 8601 strings; tinyint(1) flags are 0 | 1.
export interface TblUser {
  PersonId: string; // PK, FK → tblPerson
  UserName: string | null;
  UserPassword: string | null; // server-side hash only — never store plaintext
  PasswordExpiration: string | null;
  IsActive: 0 | 1;
  AuditUser: string | null;
  AuditDate: string | null;
  IsReported: 0 | 1;
  EditUser: string | null;
  EditDate: string | null;
  LoginAttempt: number;
}

export type LocalUser = TblUser & { syncStatus: SyncStatus };
