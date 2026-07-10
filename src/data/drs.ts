// Shared mock DRS (Digital Remittance Slip) data + helpers, consumed by the
// viewDrs and encodeDeposit screens so both reference the same records.

export type DrsStatus = "Pending" | "Validated" | "For Deposit";

export type DrsPaymentRow = {
  SI: string;
  Name: string;
  InstNo: number;
  PayClass: string;
  SIAmount: number;
  Commission: number;
};

export type DrsItem = {
  id: string;
  name: string;
  SlipDate: string;
  Status: DrsStatus;
  payments: DrsPaymentRow[];
};

// Ordered most-recently-created first — index 0 (the last-created DRS) is the
// only one eligible for deletion, while the last item (the first-created,
// #1 DRS) is the only one eligible for deposit encoding, matching the web
// app's business rule.
export const DRS_ITEMS: DrsItem[] = [
  {
    id: "5",
    name: "DRS-2026-0005",
    SlipDate: "2026-07-06",
    Status: "Pending",
    payments: [
      {
        SI: "00000061",
        Name: "Juan Dela Cruz",
        InstNo: 4,
        PayClass: "NS",
        SIAmount: 2500,
        Commission: 342,
      },
      {
        SI: "00000062",
        Name: "Maria Santos",
        InstNo: 2,
        PayClass: "DC",
        SIAmount: 1800,
        Commission: 342,
      },
    ],
  },
  {
    id: "4",
    name: "DRS-2026-0004",
    SlipDate: "2026-07-02",
    Status: "For Deposit",
    payments: [
      {
        SI: "00000058",
        Name: "Pedro Reyes",
        InstNo: 6,
        PayClass: "RI",
        SIAmount: 4200,
        Commission: 342,
      },
      {
        SI: "00000059",
        Name: "Ana Garcia",
        InstNo: 1,
        PayClass: "NS",
        SIAmount: 2500,
        Commission: 342,
      },
      {
        SI: "00000060",
        Name: "Luis Mendoza",
        InstNo: 3,
        PayClass: "SV",
        SIAmount: 2100,
        Commission: 342,
      },
    ],
  },
  {
    id: "3",
    name: "DRS-2026-0003",
    SlipDate: "2026-06-27",
    Status: "Validated",
    payments: [
      {
        SI: "00000054",
        Name: "Carla Bautista",
        InstNo: 5,
        PayClass: "DC",
        SIAmount: 1900,
        Commission: 342,
      },
    ],
  },
  {
    id: "2",
    name: "DRS-2026-0002",
    SlipDate: "2026-06-20",
    Status: "Validated",
    payments: [
      {
        SI: "00000049",
        Name: "Miguel Ramos",
        InstNo: 2,
        PayClass: "NS",
        SIAmount: 2200,
        Commission: 342,
      },
      {
        SI: "00000050",
        Name: "Sofia Lopez",
        InstNo: 4,
        PayClass: "UP",
        SIAmount: 1600,
        Commission: 342,
      },
    ],
  },
  {
    id: "1",
    name: "DRS-2026-0001",
    SlipDate: "2026-06-14",
    Status: "Validated",
    payments: [
      {
        SI: "00000045",
        Name: "Jose Villanueva",
        InstNo: 1,
        PayClass: "NS",
        SIAmount: 2300,
        Commission: 342,
      },
    ],
  },
];

export function drsAmount(item: DrsItem) {
  return item.payments.reduce((sum, p) => sum + p.SIAmount, 0);
}

export function drsPlanholders(item: DrsItem) {
  return new Set(item.payments.map((p) => p.Name)).size;
}

export function drsTotals(item: DrsItem) {
  return {
    count: item.payments.length,
    amount: item.payments.reduce((sum, p) => sum + p.SIAmount, 0),
    commission: item.payments.reduce((sum, p) => sum + p.Commission, 0),
  };
}
