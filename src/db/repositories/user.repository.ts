import type { SQLiteDatabase } from "expo-sqlite";

import { createSyncedTable } from "@/db/repositories/synced-table";
import type { TblUser } from "@/types/user";

const users = createSyncedTable<TblUser>({
  table: "tblUsers",
  primaryKey: "PersonId",
  columns: [
    "PersonId",
    "UserName",
    "UserPassword",
    "PasswordExpiration",
    "IsActive",
    "AuditUser",
    "AuditDate",
    "IsReported",
    "EditUser",
    "EditDate",
    "LoginAttempt",
  ],
  booleans: ["IsActive", "IsReported"],
  orderBy: "UserName COLLATE NOCASE",
});

export const listUsers = users.list;
export const getUser = users.get;
export const saveUser = users.save;
export const saveUserInTransaction = users.saveInTransaction;
export const deleteUser = users.remove;
export const userSync = users.sync;

export function getUserByUserName(db: SQLiteDatabase, userName: string) {
  return users.findOne(db, "UserName = ? COLLATE NOCASE", userName);
}
