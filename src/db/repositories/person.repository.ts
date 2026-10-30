import { createSyncedTable } from "@/db/repositories/synced-table";
import type { TblPerson } from "@/types/person";

const persons = createSyncedTable<TblPerson>({
  table: "tblPerson",
  primaryKey: "PersonID",
  columns: [
    "PersonID",
    "Title",
    "LastName",
    "FirstName",
    "MiddleName",
    "Suffix",
    "DateofBirth",
    "PlaceOfBirth",
    "GenderAtBirth",
    "CivilStatus",
    "OccupationID",
    "EmployerName",
    "EmploymentStatus",
    "NationalityID",
    "NaturalizationDate",
    "SSSNo",
    "GSISNo",
    "HMDFNo",
    "TIN",
    "Weight",
    "Height",
    "SourceOfFund",
    "IsActive",
    "AvatarURL",
    "AuditUser",
    "AuditDate",
    "IsReported",
    "EditUser",
    "EditDate",
  ],
  booleans: ["IsActive", "IsReported"],
  integers: ["Weight"],
  orderBy: "LastName COLLATE NOCASE, FirstName COLLATE NOCASE",
});

export const listPersons = persons.list;
export const getPerson = persons.get;
export const savePerson = persons.save;
export const savePersonInTransaction = persons.saveInTransaction;
export const deletePerson = persons.remove;
export const personSync = persons.sync;
