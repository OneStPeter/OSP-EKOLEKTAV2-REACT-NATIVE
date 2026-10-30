// Shared mock Planholder data + helpers, consumed by the planholderProfile
// screen. Mirrors the shape the web Planholder Profile page receives so the
// two stay in sync when the real API is wired up.

export type PlanStatus = "Active" | "Lapsed" | "Terminated";
export type RequestStatus = "Pending" | "Approved" | "Denied";
export type AddressType = "RESIDENCE" | "OFFICE";
export type ContactType = "Email" | "MobileNo" | "LandlineNo";

export type PlanholderAddress = {
  addressType: AddressType;
  addressNo: string;
  street: string;
  barangay: string;
  district?: string;
  city: string;
  province: string;
  zipCode?: string;
};

export type PlanholderContact = {
  type: ContactType;
  value: string;
};

export type PlanDetail = {
  lpaNumber: string;
  planName: string;
  status: PlanStatus;
  /** Payment mode — Annual, Semi-Annual, Quarterly, Monthly. */
  mode: string;
  term: string;
  branch: string;
  installmentsPaid: number;
  installmentsTotal: number;
  /** MM/DD/YYYY — matches the due date shown on the plan card. */
  dueDate: string;
  amountDue: number;
  contractPrice: number;
  effectiveDate: string; // ISO date
  agent: string;
};

export type PlanholderRequest = {
  type: string;
  title: string;
  description: string;
  transactionId: string;
  currentStep: number;
  totalSteps: number;
  status: RequestStatus;
  date: string;
  /** Step labels used by the request tracker sheet. */
  steps: string[];
};

export type PlanholderEmployment = {
  employer: string;
  occupation: string;
  industry: string;
  monthlyIncome: number;
  yearsEmployed: number;
};

export type Planholder = {
  personId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix?: string;
  birthDate: string; // ISO date
  gender: "Male" | "Female";
  civilStatus: string;
  nationality: string;
  /** Whether the planholder is still insurable — drives the header badge. */
  isInsurable: boolean;
  /** Registration date shown on the list card. */
  registeredDate: string; // ISO date
  /** Servicing branch code shown on the list card. */
  branchCode: string;
  addresses: PlanholderAddress[];
  contacts: PlanholderContact[];
  plans: PlanDetail[];
  requests: PlanholderRequest[];
  employment: PlanholderEmployment;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export function planholderName(p: Planholder) {
  return [p.firstName, p.lastName, p.suffix].filter(Boolean).join(" ");
}

export function planholderInitials(p: Planholder) {
  return (p.firstName[0] ?? "") + (p.lastName[0] ?? "");
}

/** Single-line address, used on cards and rows. */
export function formatAddress(a: PlanholderAddress) {
  return [a.addressNo, a.street, a.barangay, a.city, a.province]
    .filter(Boolean)
    .join(", ");
}

export function findAddress(p: Planholder, type: AddressType) {
  return p.addresses.find((a) => a.addressType === type);
}

export function findContact(p: Planholder, type: ContactType) {
  return p.contacts.find((c) => c.type === type)?.value;
}

/** Primary phone — mobile first, landline as the fallback. */
export function primaryPhone(p: Planholder) {
  return findContact(p, "MobileNo") ?? findContact(p, "LandlineNo");
}

/** The plan surfaced on the list card — the first active one, else the first. */
export function headlinePlan(p: Planholder): PlanDetail | undefined {
  return p.plans.find((x) => x.status === "Active") ?? p.plans[0];
}

export function pendingRequests(p: Planholder) {
  return p.requests.filter((r) => r.status === "Pending");
}

// ── Static step templates ────────────────────────────────────────────────────

const REINSTATEMENT_STEPS = ["Filed", "Assessment", "Approval", "Reinstated"];
const CHANGE_OF_MODE_STEPS = ["Filed", "Validation", "Applied"];
const ROP_STEPS = ["Filed", "Computation", "Released"];
const TRANSFER_STEPS = ["Filed", "Verification", "Approval", "Transferred"];

// ── Mock records ─────────────────────────────────────────────────────────────

export const PLANHOLDERS: Planholder[] = [
  {
    personId: "PI10529",
    firstName: "Michelle",
    middleName: "Sarmiento",
    lastName: "De Sosa",
    birthDate: "1988-11-14",
    gender: "Female",
    civilStatus: "Married",
    nationality: "Filipino",
    isInsurable: true,
    registeredDate: "2025-04-04",
    branchCode: "ZAMBOE",
    addresses: [
      {
        addressType: "RESIDENCE",
        addressNo: "24",
        street: "Gov. Camins Ave.",
        barangay: "Baliwasan",
        district: "District I",
        city: "Zamboanga City",
        province: "Zamboanga del Sur",
        zipCode: "7000",
      },
      {
        addressType: "OFFICE",
        addressNo: "3F Unit 302",
        street: "Veterans Ave.",
        barangay: "Tetuan",
        city: "Zamboanga City",
        province: "Zamboanga del Sur",
        zipCode: "7000",
      },
    ],
    contacts: [
      { type: "MobileNo", value: "+63 996-936-3882" },
      { type: "LandlineNo", value: "(062) 991-2245" },
      { type: "Email", value: "michelle.desosa@example.com" },
    ],
    plans: [
      {
        lpaNumber: "L25048596I",
        planName: "ST. GEORGE",
        status: "Lapsed",
        mode: "Annual",
        term: "5 years",
        branch: "Zamboanga East",
        installmentsPaid: 1,
        installmentsTotal: 5,
        dueDate: "04/05/2027",
        amountDue: 10600,
        contractPrice: 53000,
        effectiveDate: "2025-04-05",
        agent: "R. Villanueva",
      },
      {
        lpaNumber: "L25048602I",
        planName: "ST. THERESE",
        status: "Active",
        mode: "Quarterly",
        term: "3 years",
        branch: "Zamboanga East",
        installmentsPaid: 7,
        installmentsTotal: 12,
        dueDate: "09/15/2026",
        amountDue: 3250,
        contractPrice: 39000,
        effectiveDate: "2024-09-15",
        agent: "R. Villanueva",
      },
    ],
    requests: [
      {
        type: "Reinstatement",
        title: "Reinstatement",
        description: "LPA No. 2025-001234 · Annual Premium",
        transactionId: "RI-2025-001234",
        currentStep: 2,
        totalSteps: 4,
        status: "Pending",
        date: "May 20, 2026",
        steps: REINSTATEMENT_STEPS,
      },
      {
        type: "Change of Mode",
        title: "Change of Mode",
        description: "LPA No. 2025-005678 · Quarterly to Monthly",
        transactionId: "COM-2025-005678",
        currentStep: 1,
        totalSteps: 3,
        status: "Pending",
        date: "May 24, 2026",
        steps: CHANGE_OF_MODE_STEPS,
      },
      {
        type: "Returned of Premium",
        title: "ROP Application",
        description: "LPA No. 2024-009876 · Maturity Benefit",
        transactionId: "ROP-2024-009876",
        currentStep: 3,
        totalSteps: 3,
        status: "Approved",
        date: "Nov 15, 2025",
        steps: ROP_STEPS,
      },
      {
        type: "Transfer of Rights",
        title: "Transfer of Rights",
        description: "LPA No. 2024-003456 · Beneficiary Change",
        transactionId: "TF-2024-003456",
        currentStep: 2,
        totalSteps: 4,
        status: "Denied",
        date: "Sep 3, 2025",
        steps: TRANSFER_STEPS,
      },
    ],
    employment: {
      employer: "Zamboanga Trading Corp.",
      occupation: "Branch Supervisor",
      industry: "Wholesale & Retail",
      monthlyIncome: 42000,
      yearsEmployed: 6,
    },
  },
  {
    personId: "PI10532",
    firstName: "Sophia",
    middleName: "Lim",
    lastName: "Kwan",
    birthDate: "1995-02-27",
    gender: "Female",
    civilStatus: "Single",
    nationality: "Filipino",
    isInsurable: true,
    registeredDate: "2025-10-12",
    branchCode: "ZAMBOA",
    addresses: [
      {
        addressType: "RESIDENCE",
        addressNo: "18-B",
        street: "Mayor Jaldon St.",
        barangay: "Canelar",
        district: "District II",
        city: "Zamboanga City",
        province: "Zamboanga del Sur",
        zipCode: "7000",
      },
    ],
    contacts: [
      { type: "MobileNo", value: "+63 955-540-5022" },
      { type: "Email", value: "sophia.kwan@example.com" },
    ],
    plans: [
      {
        lpaNumber: "L25053163I",
        planName: "ST. GREGORY",
        status: "Active",
        mode: "Semi-Annual",
        term: "5 years",
        branch: "Zamboanga A",
        installmentsPaid: 3,
        installmentsTotal: 10,
        dueDate: "10/12/2026",
        amountDue: 8400,
        contractPrice: 84000,
        effectiveDate: "2025-10-12",
        agent: "J. Andrada",
      },
    ],
    requests: [
      {
        type: "Change of Mode",
        title: "Change of Mode",
        description: "LPA No. 2025-053163 · Semi-Annual to Monthly",
        transactionId: "COM-2025-053163",
        currentStep: 1,
        totalSteps: 3,
        status: "Pending",
        date: "Jun 10, 2026",
        steps: CHANGE_OF_MODE_STEPS,
      },
    ],
    employment: {
      employer: "Southcoast BPO Inc.",
      occupation: "Team Lead",
      industry: "Business Process Outsourcing",
      monthlyIncome: 55000,
      yearsEmployed: 4,
    },
  },
  {
    personId: "PI10002",
    firstName: "Rogelio",
    middleName: "Bautista",
    lastName: "Redoble",
    birthDate: "1979-06-08",
    gender: "Male",
    civilStatus: "Married",
    nationality: "Filipino",
    isInsurable: false,
    registeredDate: "2025-04-23",
    branchCode: "ZAMBOA",
    addresses: [
      {
        addressType: "RESIDENCE",
        addressNo: "7",
        street: "San Jose Road",
        barangay: "Guiwan",
        city: "Zamboanga City",
        province: "Zamboanga del Sur",
        zipCode: "7000",
      },
    ],
    contacts: [
      { type: "MobileNo", value: "+63 916-708-1967" },
      { type: "LandlineNo", value: "(062) 985-4410" },
    ],
    plans: [
      {
        lpaNumber: "L25053168I",
        planName: "ST. GEORGE",
        status: "Active",
        mode: "Monthly",
        term: "10 years",
        branch: "Zamboanga A",
        installmentsPaid: 14,
        installmentsTotal: 120,
        dueDate: "08/23/2026",
        amountDue: 1180,
        contractPrice: 141600,
        effectiveDate: "2025-04-23",
        agent: "M. Ocampo",
      },
    ],
    requests: [],
    employment: {
      employer: "Self-employed",
      occupation: "Fish Trader",
      industry: "Agriculture & Fishery",
      monthlyIncome: 28000,
      yearsEmployed: 15,
    },
  },
  {
    personId: "PI10003",
    firstName: "Rogelio",
    middleName: "Bautista",
    lastName: "Redoble",
    suffix: "Jr.",
    birthDate: "2001-01-19",
    gender: "Male",
    civilStatus: "Single",
    nationality: "Filipino",
    isInsurable: true,
    registeredDate: "2026-01-19",
    branchCode: "ZAMBOA",
    addresses: [
      {
        addressType: "RESIDENCE",
        addressNo: "7",
        street: "San Jose Road",
        barangay: "Guiwan",
        city: "Zamboanga City",
        province: "Zamboanga del Sur",
        zipCode: "7000",
      },
    ],
    contacts: [{ type: "MobileNo", value: "+63 917-233-8890" }],
    plans: [
      {
        lpaNumber: "L26001194I",
        planName: "ST. MICHAEL",
        status: "Active",
        mode: "Annual",
        term: "5 years",
        branch: "Zamboanga A",
        installmentsPaid: 1,
        installmentsTotal: 5,
        dueDate: "01/19/2027",
        amountDue: 12750,
        contractPrice: 63750,
        effectiveDate: "2026-01-19",
        agent: "M. Ocampo",
      },
    ],
    requests: [],
    employment: {
      employer: "Zamboanga State College",
      occupation: "Student Assistant",
      industry: "Education",
      monthlyIncome: 9000,
      yearsEmployed: 1,
    },
  },
];
