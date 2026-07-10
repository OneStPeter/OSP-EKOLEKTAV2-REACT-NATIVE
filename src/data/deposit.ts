// Shared mock Deposit data + helpers, consumed by the viewDeposit screen.

export type DepositStatus = "Pending" | "Validated" | "For Deposit";

export type DepositPaymentRow = {
  SI: string;
  Name: string;
  InstNo: number;
  PayClass: string;
  SIAmount: number;
};

export type DepositItem = {
  id: string;
  name: string;
  Status: DepositStatus;
  DepositDateTime: string; // ISO datetime
  Amount: number;
  AccountNo: string;
  BankBranch: string;
  BankCode: string;
  DepositedBy: string;
  payments: DepositPaymentRow[];
};

// Ordered most-recently-created first, matching the DRS/viewDrs convention.
export const DEPOSIT_ITEMS: DepositItem[] = [
  {
    id: "3",
    name: "DEP-2026-0003",
    Status: "Validated",
    DepositDateTime: "2026-07-07T10:15:00",
    Amount: 6300,
    AccountNo: "2010073262",
    BankBranch: "BDO — Quiapo",
    BankCode: "BDO",
    DepositedBy: "",
    payments: [
      {
        SI: "00000058",
        Name: "Pedro Reyes",
        InstNo: 6,
        PayClass: "RI",
        SIAmount: 4200,
      },
      {
        SI: "00000060",
        Name: "Luis Mendoza",
        InstNo: 3,
        PayClass: "SV",
        SIAmount: 2100,
      },
    ],
  },
  {
    id: "2",
    name: "DEP-2026-0002",
    Status: "Validated",
    DepositDateTime: "2026-06-28T09:40:00",
    Amount: 1900,
    AccountNo: "2010073262",
    BankBranch: "BPI — Ortigas",
    BankCode: "BPI",
    DepositedBy: "Carla Bautista",
    payments: [
      {
        SI: "00000054",
        Name: "Carla Bautista",
        InstNo: 5,
        PayClass: "DC",
        SIAmount: 1900,
      },
    ],
  },
  {
    id: "1",
    name: "DEP-2026-0001",
    Status: "Validated",
    DepositDateTime: "2026-06-21T14:05:00",
    Amount: 3800,
    AccountNo: "2010073262",
    BankBranch: "Metrobank — Makati",
    BankCode: "MBTC",
    DepositedBy: "Miguel Ramos",
    payments: [
      {
        SI: "00000049",
        Name: "Miguel Ramos",
        InstNo: 2,
        PayClass: "NS",
        SIAmount: 2200,
      },
      {
        SI: "00000050",
        Name: "Sofia Lopez",
        InstNo: 4,
        PayClass: "UP",
        SIAmount: 1600,
      },
    ],
  },
];

export function depositTotals(item: DepositItem) {
  return {
    count: item.payments.length,
    amount: item.payments.reduce((sum, p) => sum + p.SIAmount, 0),
  };
}
