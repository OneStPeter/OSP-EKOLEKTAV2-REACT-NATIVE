import type { SyncStatus } from "@/db/repositories/synced-table";

// Mirrors server table tblPerson. Dates are ISO 8601 strings; tinyint(1) flags are 0 | 1.
export interface TblPerson {
  PersonID: string; // PK
  Title: string | null;
  LastName: string | null;
  FirstName: string | null;
  MiddleName: string | null;
  Suffix: string | null;
  DateofBirth: string | null;
  PlaceOfBirth: string | null;
  GenderAtBirth: string | null;
  CivilStatus: string | null;
  OccupationID: string | null; // FK → refOccupation
  EmployerName: string | null;
  EmploymentStatus: string | null;
  NationalityID: string | null; // FK → refNationality
  NaturalizationDate: string | null;
  SSSNo: string | null;
  GSISNo: string | null;
  HMDFNo: string | null;
  TIN: string | null;
  Weight: string | null;
  Height: string | null;
  SourceOfFund: string | null;
  IsActive: 0 | 1;
  AvatarURL: string | null;
  AuditUser: string | null;
  AuditDate: string | null;
  IsReported: 0 | 1;
  EditUser: string | null;
  EditDate: string | null;
}

export type LocalPerson = TblPerson & { syncStatus: SyncStatus };
