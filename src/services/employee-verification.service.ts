// Sign-up step 1: is this email allowed to create an account?
//
//   POST {API}/Auth/employee/verify   { email }   (anonymous, OSP-LIFEPLAN-OPERATION-PISv6-API)
//     200 → { status, employee? }
//       VERIFIED            one active sales force member owns this email, no tblUsers row yet
//       NOT_FOUND           the email is not an email contact of any sales force member
//       INELIGIBLE          inactive, or the email is shared by several members
//       ALREADY_REGISTERED  the member's person, or the email, already has an account
//
// POST so the email stays out of URLs and request logs.
// Online only: the answer comes from the server's employee records, never local data.

import { ApiError, apiRequest, isApiConfigured } from "@/services/api";

export type VerifiedEmployee = {
  /** The verified email; becomes the account's UserName. */
  email: string;
  salesForceCode: string;
  personId: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  suffix: string | null;
  posCode: string | null;
  /** The position's name, e.g. "Sales Agent". */
  position: string | null;
  /** The employee's branch, e.g. "Cubao Branch". */
  orgDescription: string | null;
  /** "YYYY-MM-DD", or null when the record has none. */
  dateOfBirth: string | null;
};

export type EmployeeVerification =
  | { status: "verified"; employee: VerifiedEmployee }
  | { status: "not_found" | "ineligible" | "already_registered" }
  /** Network or server failure; worth retrying. */
  | { status: "error"; message: string };

type VerifyResponse = {
  status: "VERIFIED" | "NOT_FOUND" | "INELIGIBLE" | "ALREADY_REGISTERED";
  employee: VerifiedEmployee | null;
};

const VERIFY_TIMEOUT_MS = 30_000;

export async function verifyEmployeeEmail(
  email: string,
): Promise<EmployeeVerification> {
  if (!isApiConfigured) {
    return {
      status: "error",
      message: "Verification is unavailable: the server is not configured.",
    };
  }

  let res: VerifyResponse;
  try {
    res = await apiRequest<VerifyResponse>(
      "POST",
      "/Auth/employee/verify",
      { email: email.trim() },
      { timeoutMs: VERIFY_TIMEOUT_MS },
    );
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 0;
    return {
      status: "error",
      message:
        status === 0
          ? "Unable to reach the server. Please check your connection and try again."
          : "Verification failed because of a server error. Please try again.",
    };
  }

  switch (res.status) {
    case "VERIFIED":
      return res.employee
        ? { status: "verified", employee: res.employee }
        : {
            status: "error",
            message:
              "The server sent an incomplete response. Please try again.",
          };
    case "NOT_FOUND":
      return { status: "not_found" };
    case "INELIGIBLE":
      return { status: "ineligible" };
    case "ALREADY_REGISTERED":
      return { status: "already_registered" };
    default:
      return {
        status: "error",
        message: "The server sent an unexpected response. Please try again.",
      };
  }
}
