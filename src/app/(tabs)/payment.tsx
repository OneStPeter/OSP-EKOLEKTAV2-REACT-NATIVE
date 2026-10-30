import { useRouter } from "expo-router";
import {
  Calendar,
  Camera,
  ChevronDown,
  Clipboard,
  CreditCard,
  FileText,
  Minus,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react-native";
import type {
  DataTableProps,
  LookupColumn,
  StPeterTheme,
} from "osp-ui-kit-native";
import {
  alpha,
  BaseButton,
  BaseIconButton,
  BaseText,
  BottomSheet,
  Caption,
  Card,
  DataTable,
  DrawerPanel,
  EmptyStateCard,
  FloatingLabelInput,
  FloatingLabelSelect,
  FormStepper,
  InfoItem,
  LookupField,
  MessageDialog,
  OSPBadge,
  PrintIconButton,
  RowItem,
  SectionTitle,
  SegmentedControl,
  Small,
  useTheme,
  useThemedStyles,
} from "osp-ui-kit-native";
import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Pressable,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DateTimeField } from "@/components/DateTimeField";
import { DRS_ITEMS, type DrsItem } from "@/data/drs";
import { useAlertModal } from "@/hooks/use-alert-modal";

// ── Types ────────────────────────────────────────────────────────────────────

type PlanholderLookupItem = {
  LPANo: string;
  FirstName: string;
  MiddleName: string;
  LastName: string;
  PlanDescription: string;
  InstallmentAmount: number;
  EffectivityDate: string;
  DueDate: string;
};

type PaymentRecord = {
  LPANo: string;
  Name: string;
  SI: string;
  SIDate: string;
  SIAmount: number;
  InstNo: number;
  PayClass: string;
  Commission: number;
  TransportationExpense: number;
  EncodedDate: string;
};

type OptionItem = { value: string; label: string };

// ── Static data ─────────────────────────────────────────────────────────────

const PAY_TYPE_OPTIONS: OptionItem[] = [
  { value: "CH", label: "Cash" },
  { value: "CK", label: "Cheque" },
];

const PAY_CLASS_OPTIONS: OptionItem[] = [
  { value: "AF", label: "ASSIGNMENT FEE" },
  { value: "AO", label: "ACCOUNTS PAYABLE - OTHERS" },
  { value: "BC", label: "BANK CHARGE" },
  { value: "CB", label: "CASH BOND RESERVE" },
  { value: "CF", label: "REPLACEMENT OF COFPP" },
  { value: "CL", label: "CREDIT LIFE INSURANCE" },
  { value: "DC", label: "DEFERRED COLLECTION" },
  { value: "ER", label: "ENTERTAINMENT & CREATIONS" },
  { value: "MC", label: "MEETING AND CONFERENCE" },
  { value: "ME", label: "MARKETING EXPENSE" },
  { value: "MF", label: "CHANGE MODE" },
  { value: "MT", label: "MARKETING TRANSPORTATION" },
  { value: "NS", label: "NEW SALE" },
  { value: "OS", label: "OFFICE SUPPLIES" },
  { value: "OV", label: "OVERRIDING COMMISSION - SA" },
  { value: "PF", label: "PROCESSING FEE" },
  { value: "RB", label: "RETURNED BUDGET" },
  { value: "RF", label: "REINSTATEMENT FEE" },
  { value: "RI", label: "REINSTATEMENT PAYMENT" },
  { value: "RP", label: "REPRINTING OF PHID" },
  { value: "RS", label: "REPRINTING OF SFID" },
  { value: "SF", label: "SURCHARGE FEE" },
  { value: "SV", label: "SERVICE PAYMENT" },
  { value: "TF", label: "TRANSFER FEE" },
  { value: "TI", label: "TEMPORARY REINSTATEMENT" },
  { value: "TL", label: "TAXES AND LICENSES" },
  { value: "UP", label: "UPDATING" },
];

// Select shows "CODE — LABEL" as the option label, with the code kept as value.
const PAY_CLASS_SELECT_OPTIONS = PAY_CLASS_OPTIONS.map((o) => ({
  value: o.value,
  label: `${o.value} — ${o.label}`,
}));

const PLANHOLDER_LOOKUP: PlanholderLookupItem[] = [
  {
    LPANo: "LPA-10023",
    FirstName: "Juan",
    MiddleName: "Santos",
    LastName: "Dela Cruz",
    PlanDescription: "ST. GREGORY",
    InstallmentAmount: 2500,
    EffectivityDate: "2023-04-01",
    DueDate: "2026-07-15",
  },
  {
    LPANo: "LPA-10047",
    FirstName: "Maria",
    MiddleName: "Reyes",
    LastName: "Santos",
    PlanDescription: "ST. GEORGE",
    InstallmentAmount: 1800,
    EffectivityDate: "2022-11-10",
    DueDate: "2026-07-10",
  },
  {
    LPANo: "LPA-10088",
    FirstName: "Pedro",
    MiddleName: "Garcia",
    LastName: "Reyes",
    PlanDescription: "ST. ANNE",
    InstallmentAmount: 4200,
    EffectivityDate: "2024-01-20",
    DueDate: "2026-07-20",
  },
  {
    LPANo: "LPA-10125",
    FirstName: "Ana",
    MiddleName: "Lopez",
    LastName: "Garcia",
    PlanDescription: "ST. JOHN",
    InstallmentAmount: 2500,
    EffectivityDate: "2023-09-05",
    DueDate: "2026-07-05",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const COMMISSION_PER_PLANHOLDER = 342;
const TRANSPORTATION_EXPENSE_PER_PLANHOLDER = 76;
const VAT_RATE = 0.12;
const EWT_RATE = 0.02;

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Parses "YYYY-MM-DD" as a local date (`new Date(iso)` would read it as UTC). */
function fromIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function todayIso() {
  return toIsoDate(new Date());
}

function fmt$(n: number) {
  return (
    "₱" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function fmtDateStr(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fullPlanholderName(item: PlanholderLookupItem) {
  return [item.LastName, item.FirstName, item.MiddleName]
    .filter(Boolean)
    .join(" ");
}

function planholderDisplayLabel(item: PlanholderLookupItem) {
  return `PLAN: ${item.LPANo} — ${fullPlanholderName(item)}`;
}

function generateDrsNo() {
  return `DRS${Math.floor(100000000000 + Math.random() * 900000000000)}`;
}

function getNextInstNo(payments: PaymentRecord[], lpaNo: string) {
  const rows = payments.filter((p) => p.LPANo === lpaNo);
  if (rows.length === 0) return 1;
  return Math.max(...rows.map((p) => p.InstNo)) + 1;
}

// Illustrative VAT/EWT split — Life Plan SI amounts are VAT-inclusive; no
// computation spec was ported from web, so this is a reasonable placeholder.
function computePayments(installmentAmount: number) {
  const commission = installmentAmount > 0 ? COMMISSION_PER_PLANHOLDER : 0;
  const transportationExpense =
    installmentAmount > 0 ? TRANSPORTATION_EXPENSE_PER_PLANHOLDER : 0;
  const vatableSales = installmentAmount / (1 + VAT_RATE);
  const vatAmount = installmentAmount - vatableSales;
  const withholdingTax = commission * EWT_RATE;
  const totalAmountDue = installmentAmount - withholdingTax;

  return {
    comCBI: commission,
    ncomCBI: transportationExpense,
    commission,
    transportationExpense,
    vatableSales,
    vatExemptSales: 0,
    totalSales: installmentAmount,
    vatAmount,
    amountNetOfVat: vatableSales,
    withholdingTax,
    totalAmountDue,
  };
}

// ── Lookup columns ───────────────────────────────────────────────────────────

const PLANHOLDER_LOOKUP_COLUMNS: LookupColumn<PlanholderLookupItem>[] = [
  { key: "LPANo", header: "LPA No." },
  {
    key: "LastName",
    header: "Name",
    render: (_value, row) => fullPlanholderName(row),
  },
  { key: "PlanDescription", header: "Plan" },
];

// ── Responsive sheet (bottom sheet on phone, side drawer on tablet) ──────────

function ResponsiveSheet({
  open,
  onClose,
  title,
  isTablet,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  isTablet: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  if (isTablet) {
    return (
      <DrawerPanel
        open={open}
        onOpenChange={(o) => !o && onClose()}
        title={title}
        placement="end"
        size="md"
      >
        {children}
      </DrawerPanel>
    );
  }
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      bottomInset={insets.bottom}
    >
      {children}
    </BottomSheet>
  );
}

// ── Table cells ──────────────────────────────────────────────────────────────

// `@tanstack/react-table` is only a dependency of the kit, so take its
// `ColumnDef<T>[]` through the kit's own DataTable props.
type PaymentColumns = DataTableProps<PaymentRecord>["columns"];

function payClassBadge(r: PaymentRecord) {
  return <OSPBadge type="info">{r.PayClass}</OSPBadge>;
}

// ── Screen ──────────────────────────────────────────────────────────────────

export default function EncodePaymentScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const router = useRouter();
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [selectedPlanholder, setSelectedPlanholder] =
    useState<PlanholderLookupItem | null>(null);

  const [paymentClass, setPaymentClass] = useState("DC");
  const [paymentType, setPaymentType] = useState("CH");
  const [siNumber, setSiNumber] = useState("00000050");
  const [siExtension, setSiExtension] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState(0);
  const [siDate, setSiDate] = useState(todayIso());

  const [chequeData, setChequeData] = useState({
    accountNumber: "",
    accountName: "",
    bankName: "",
    bankBranch: "",
    chequeNumber: "",
  });
  const [scanningCheque, setScanningCheque] = useState(false);

  const [taxSheetVisible, setTaxSheetVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<PaymentRecord | null>(null);

  const { alertState, showAlert, dismissAlert } = useAlertModal();
  const [confirmDrsVisible, setConfirmDrsVisible] = useState(false);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const [currentStep, setCurrentStep] = useState(0);

  const [drsNo, setDrsNo] = useState(() => generateDrsNo());

  const computed = useMemo(
    () => computePayments(installmentAmount),
    [installmentAmount],
  );

  const drsTotals = useMemo(
    () => ({
      amount: payments.reduce((sum, p) => sum + p.SIAmount, 0),
      commission: payments.reduce((sum, p) => sum + p.Commission, 0),
      transportation: payments.reduce(
        (sum, p) => sum + p.TransportationExpense,
        0,
      ),
    }),
    [payments],
  );

  const paymentTypeLabel = useMemo(
    () =>
      PAY_TYPE_OPTIONS.find((o) => o.value === paymentType)?.label ??
      paymentType,
    [paymentType],
  );

  const preparedByName = selectedPlanholder
    ? `${selectedPlanholder.FirstName} ${selectedPlanholder.LastName}`.trim()
    : "—";

  useEffect(() => {
    setInstallmentAmount(selectedPlanholder?.InstallmentAmount ?? 0);
  }, [selectedPlanholder]);

  useEffect(() => {
    if (payments.length === 0) {
      setSiNumber("00000050");
      return;
    }
    const maxSi = payments.reduce(
      (max, p) => Math.max(max, parseInt(p.SI, 10) || 0),
      0,
    );
    setSiNumber(String(maxSi + 1).padStart(8, "0"));
  }, [payments]);

  function handleDecrease() {
    const step = selectedPlanholder?.InstallmentAmount ?? 0;
    setInstallmentAmount((prev) => Math.max(step, prev - step));
  }

  function handleIncrease() {
    const step = selectedPlanholder?.InstallmentAmount ?? 0;
    setInstallmentAmount((prev) => prev + step);
  }

  function handleScanCheque() {
    setScanningCheque(true);
    setChequeData({
      accountNumber: "",
      accountName: "",
      bankName: "",
      bankBranch: "",
      chequeNumber: "",
    });
    setTimeout(() => {
      setChequeData({
        accountNumber: "1234567890",
        accountName: "JUAN DELA CRUZ",
        bankName: "BDO",
        bankBranch: "QUIAPO",
        chequeNumber: "00012345",
      });
      setScanningCheque(false);
    }, 1200);
  }

  function handleAddPayment() {
    if (!selectedPlanholder) {
      showAlert(
        "warning",
        "Select a Planholder",
        "Please search and select a planholder first.",
      );
      return;
    }
    const instNo = getNextInstNo(payments, selectedPlanholder.LPANo);
    const formattedSi = /^\d+$/.test(siNumber.trim())
      ? siNumber.trim().padStart(8, "0")
      : siNumber.trim();

    const record: PaymentRecord = {
      LPANo: selectedPlanholder.LPANo,
      Name: fullPlanholderName(selectedPlanholder),
      SI: formattedSi,
      SIDate: siDate,
      SIAmount: installmentAmount,
      InstNo: instNo,
      PayClass: paymentClass,
      Commission: computed.commission,
      TransportationExpense: computed.transportationExpense,
      EncodedDate: todayIso(),
    };

    setPayments((prev) => [record, ...prev]);
    showAlert(
      "success",
      "Payment Added",
      `SI: ${formattedSi} · Inst. No: ${instNo}`,
    );
  }

  function handleDeleteAll() {
    setPayments([]);
  }

  function handleDeleteRow(si: string) {
    setPayments((prev) => prev.filter((p) => p.SI !== si));
  }

  // Gate for leaving the "Encode Payment" step (Next button or step header).
  function validateEncodeStep() {
    if (payments.length === 0) {
      showAlert(
        "warning",
        "No Payments Encoded",
        "Encode at least one payment before preparing the DRS.",
      );
      return false;
    }
    return true;
  }

  function handleGenerateDrs() {
    setConfirmDrsVisible(false);

    const newDrs: DrsItem = {
      id: String(Math.max(0, ...DRS_ITEMS.map((d) => Number(d.id))) + 1),
      name: drsNo,
      SlipDate: todayIso(),
      Status: "Pending",
      payments: payments.map((p) => ({
        SI: p.SI,
        Name: p.Name,
        InstNo: p.InstNo,
        PayClass: p.PayClass,
        SIAmount: p.SIAmount,
        Commission: p.Commission,
        TransportationExpense: p.TransportationExpense,
      })),
    };
    DRS_ITEMS.unshift(newDrs);

    const paymentCount = payments.length;
    const totalAmount = drsTotals.amount;

    setSelectedPlanholder(null);
    setPayments([]);
    setCurrentStep(0);
    setPaymentClass("DC");
    setPaymentType("CH");
    setSiExtension("");
    setSiDate(todayIso());
    setChequeData({
      accountNumber: "",
      accountName: "",
      bankName: "",
      bankBranch: "",
      chequeNumber: "",
    });
    setDrsNo(generateDrsNo());

    showAlert(
      "success",
      "DRS Generated",
      `Digital Remittance Slip prepared for ${paymentCount} payment(s) totaling ${fmt$(totalAmount)}.`,
      () => router.push("/viewDrs" as never),
    );
  }

  function handleConfirmGenerateDrs() {
    if (payments.length === 0) return;
    setConfirmDrsVisible(true);
  }

  async function handleShareDrs() {
    const lines = [
      "REMITTANCE (HEAD OFFICE)",
      `Prepared by: ${preparedByName}`,
      `DRS No: ${drsNo}`,
      `Payment Type: ${paymentTypeLabel}`,
      "",
      ...payments.map(
        (p) =>
          `${p.SI} · ${p.Name} · Inst #${p.InstNo} · ${p.PayClass} · ${fmt$(p.SIAmount)}`,
      ),
      "",
      `Total Payments: ${payments.length}`,
      `Total Amount: ${fmt$(drsTotals.amount)}`,
      `Total Commission: ${fmt$(drsTotals.commission)}`,
      `Total Transportation Expense: ${fmt$(drsTotals.transportation)}`,
    ];
    try {
      await Share.share({
        title: `Digital Remittance Slip ${drsNo}`,
        message: lines.join("\n"),
      });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  }

  // ── Table columns ──────────────────────────────────────────────────────────

  const columns: PaymentColumns = useMemo(
    () => [
      {
        accessorKey: "SI",
        header: "SI No.",
        meta: { width: 96 },
        cell: ({ row }) => (
          <BaseText fontSize="xs" fontWeight="bold" color="heading">
            {row.original.SI}
          </BaseText>
        ),
      },
      {
        accessorKey: "Name",
        header: "Name",
        meta: { width: 150 },
        cell: ({ row }) => (
          <BaseText fontSize="xs" numberOfLines={2}>
            {row.original.Name}
          </BaseText>
        ),
      },
      {
        accessorKey: "InstNo",
        header: "Inst. No",
        meta: { width: 64 },
        cell: ({ row }) => (
          <BaseText fontSize="xs" textAlign="center">
            {row.original.InstNo}
          </BaseText>
        ),
      },
      {
        accessorKey: "PayClass",
        header: "Pay Class",
        meta: { width: 88 },
        cell: ({ row }) => payClassBadge(row.original),
      },
      {
        accessorKey: "SIAmount",
        header: "Amount",
        meta: { width: 104, numeric: true },
        cell: ({ row }) => (
          <BaseText
            fontSize="xs"
            fontWeight="bold"
            color="heading"
            textAlign="right"
          >
            {fmt$(row.original.SIAmount)}
          </BaseText>
        ),
      },
      {
        accessorKey: "EncodedDate",
        header: "Encoded",
        meta: { width: 96 },
        cell: ({ row }) => (
          <BaseText fontSize="xs" color="mutedStrong">
            {fmtDateStr(row.original.EncodedDate)}
          </BaseText>
        ),
      },
      {
        id: "action",
        header: "",
        enableSorting: false,
        meta: { width: 48 },
        cell: ({ row }) =>
          row.original.SI === payments[0]?.SI ? (
            <BaseIconButton
              accessibilityLabel="Delete payment"
              icon={Trash2}
              variant="ghost"
              tone="danger"
              size="sm"
              onPress={() => handleDeleteRow(row.original.SI)}
              hitSlop={8}
            />
          ) : null,
      },
    ],
    [payments],
  );

  const drsColumns: PaymentColumns = useMemo(
    () => [
      {
        accessorKey: "SI",
        header: "SI No.",
        meta: { width: 96 },
        cell: ({ row }) => (
          <BaseText fontSize="xs" fontWeight="bold" color="heading">
            {row.original.SI}
          </BaseText>
        ),
      },
      {
        accessorKey: "Name",
        header: "Name",
        meta: { width: 150 },
        cell: ({ row }) => (
          <BaseText fontSize="xs" numberOfLines={2}>
            {row.original.Name}
          </BaseText>
        ),
      },
      {
        accessorKey: "InstNo",
        header: "Inst. No",
        meta: { width: 64 },
        cell: ({ row }) => (
          <BaseText fontSize="xs" textAlign="center">
            {row.original.InstNo}
          </BaseText>
        ),
      },
      {
        accessorKey: "PayClass",
        header: "Pay Class",
        meta: { width: 88 },
        cell: ({ row }) => payClassBadge(row.original),
      },
      {
        accessorKey: "SIAmount",
        header: "Amount",
        meta: { width: 104, numeric: true },
        cell: ({ row }) => (
          <BaseText
            fontSize="xs"
            fontWeight="bold"
            color="heading"
            textAlign="right"
          >
            {fmt$(row.original.SIAmount)}
          </BaseText>
        ),
      },
      {
        accessorKey: "Commission",
        header: "Commission",
        meta: { width: 96, numeric: true },
        cell: ({ row }) => (
          <BaseText fontSize="xs" textAlign="right">
            {fmt$(row.original.Commission)}
          </BaseText>
        ),
      },
    ],
    [],
  );

  const tableFeatures = {
    search: false,
    sorting: false,
    filtering: false,
    pagination: true,
    columnToggle: false,
    selection: false,
    detailSidebar: false,
  };

  // ── Step 1: Encode Payment ─────────────────────────────────────────────────

  const encodeStepContent = (
    <View style={styles.stepContent}>
      {/* Planholder search trigger */}
      <LookupField<PlanholderLookupItem>
        placeholder="Search by Name / LPA#"
        modalTitle="Search Planholder"
        variant="search"
        dataSource={PLANHOLDER_LOOKUP}
        columns={PLANHOLDER_LOOKUP_COLUMNS}
        searchKeys={["LPANo", "FirstName", "MiddleName", "LastName"]}
        value={selectedPlanholder}
        onSelect={setSelectedPlanholder}
        renderDisplay={planholderDisplayLabel}
      />

      {/* Selected planholder summary */}
      {selectedPlanholder && (
        <Card.Root title={fullPlanholderName(selectedPlanholder)}>
          <Card.Subtitle>{selectedPlanholder.LPANo}</Card.Subtitle>
          <Card.MainContent>
            <View style={styles.infoStack}>
              <InfoItem
                icon={FileText}
                label="Plan"
                value={selectedPlanholder.PlanDescription}
              />
              <View style={styles.infoRowPair}>
                <View style={styles.flex1}>
                  <InfoItem
                    icon={Calendar}
                    label="Effectivity"
                    value={fmtDateStr(selectedPlanholder.EffectivityDate)}
                  />
                </View>
                <View style={styles.flex1}>
                  <InfoItem
                    icon={Calendar}
                    label="Due"
                    value={fmtDateStr(selectedPlanholder.DueDate)}
                  />
                </View>
              </View>
              <View style={styles.infoRowPair}>
                <View style={styles.flex1}>
                  <InfoItem
                    icon={User}
                    label="Agent"
                    value={selectedPlanholder.FirstName}
                  />
                </View>
                <View style={styles.flex1}>
                  <InfoItem
                    icon={User}
                    label="Agent 2"
                    value={selectedPlanholder.LastName}
                  />
                </View>
              </View>
            </View>
          </Card.MainContent>
        </Card.Root>
      )}

      {/* Payment details */}
      <Card.Root title="Payment Details">
        <Card.Subtitle>
          {!selectedPlanholder
            ? "Select a planholder first"
            : payments.length > 0
              ? `${payments.length} payment(s) encoded`
              : "Enter payment information"}
        </Card.Subtitle>
        <Card.MainContent>
          {!selectedPlanholder ? (
            <EmptyStateCard
              icon={Search}
              title="No Planholder Selected"
              description="Search and select a planholder to start entering payment details."
            />
          ) : (
            <View style={styles.formStack}>
              <FloatingLabelSelect
                label="Payment Class"
                value={paymentClass}
                onValueChange={setPaymentClass}
                options={PAY_CLASS_SELECT_OPTIONS}
              />

              <View style={styles.fieldGroup}>
                <Small color="mutedStrong" fontWeight="semibold">
                  Payment Type
                </Small>
                <SegmentedControl
                  options={PAY_TYPE_OPTIONS}
                  value={paymentType}
                  onValueChange={setPaymentType}
                />
              </View>

              <View style={[styles.formGrid, isTablet && styles.formGridRow]}>
                <FloatingLabelInput
                  label="Sales Invoice Number"
                  value={siNumber}
                  onValueChange={setSiNumber}
                  onBlur={() => {
                    const raw = siNumber.trim();
                    if (/^\d+$/.test(raw)) setSiNumber(raw.padStart(8, "0"));
                  }}
                  keyboardType="number-pad"
                  containerStyle={isTablet ? styles.formGridItem : undefined}
                />
                <FloatingLabelInput
                  label="Sales Invoice Extension"
                  value={siExtension}
                  onValueChange={setSiExtension}
                  containerStyle={isTablet ? styles.formGridItem : undefined}
                />
                <DateTimeField
                  label="Sales Invoice Date"
                  value={fromIsoDate(siDate)}
                  onChange={(d) => setSiDate(toIsoDate(d))}
                  format={toIsoDate}
                  containerStyle={isTablet ? styles.formGridItem : undefined}
                />
              </View>

              <View style={styles.stepperRow}>
                <BaseIconButton
                  accessibilityLabel="Decrease amount"
                  icon={Minus}
                  variant="outline"
                  onPress={handleDecrease}
                />
                <FloatingLabelInput
                  label="Amount"
                  type="number"
                  value={String(installmentAmount)}
                  onValueChange={(t) => setInstallmentAmount(Number(t) || 0)}
                  containerStyle={styles.flex1}
                />
                <BaseIconButton
                  accessibilityLabel="Increase amount"
                  icon={Plus}
                  variant="outline"
                  onPress={handleIncrease}
                />
              </View>

              <View style={styles.computedBox}>
                <RowItem label="Com CBI" value={computed.comCBI.toFixed(2)} />
                <RowItem
                  label="NCom CBI"
                  value={computed.ncomCBI.toFixed(2)}
                />
                <RowItem
                  label="Commission"
                  value={computed.commission.toFixed(2)}
                />
                <RowItem
                  label="Transportation Expense"
                  value={computed.transportationExpense.toFixed(2)}
                />
              </View>

              {paymentType === "CK" && (
                <View style={styles.chequeSection}>
                  <SectionTitle>Cheque Details</SectionTitle>
                  <View
                    style={[styles.formGrid, isTablet && styles.formGridRow]}
                  >
                    <FloatingLabelInput
                      label="Account Number"
                      value={chequeData.accountNumber}
                      onValueChange={(t) =>
                        setChequeData((p) => ({ ...p, accountNumber: t }))
                      }
                      disabled={scanningCheque}
                      containerStyle={
                        isTablet ? styles.formGridItem : undefined
                      }
                    />
                    <FloatingLabelInput
                      label="Account Name"
                      value={chequeData.accountName}
                      onValueChange={(t) =>
                        setChequeData((p) => ({ ...p, accountName: t }))
                      }
                      disabled={scanningCheque}
                      containerStyle={
                        isTablet ? styles.formGridItem : undefined
                      }
                    />
                    <FloatingLabelInput
                      label="Bank Name"
                      value={chequeData.bankName}
                      onValueChange={(t) =>
                        setChequeData((p) => ({ ...p, bankName: t }))
                      }
                      disabled={scanningCheque}
                      containerStyle={
                        isTablet ? styles.formGridItem : undefined
                      }
                    />
                    <FloatingLabelInput
                      label="Bank Branch"
                      value={chequeData.bankBranch}
                      onValueChange={(t) =>
                        setChequeData((p) => ({ ...p, bankBranch: t }))
                      }
                      disabled={scanningCheque}
                      containerStyle={
                        isTablet ? styles.formGridItem : undefined
                      }
                    />
                    <FloatingLabelInput
                      label="Cheque Number"
                      value={chequeData.chequeNumber}
                      onValueChange={(t) =>
                        setChequeData((p) => ({ ...p, chequeNumber: t }))
                      }
                      disabled={scanningCheque}
                      containerStyle={
                        isTablet ? styles.formGridItem : undefined
                      }
                    />
                  </View>
                  <BaseButton
                    variant="outline"
                    leftIcon={Camera}
                    loading={scanningCheque}
                    loadingText="Scanning cheque…"
                    onPress={handleScanCheque}
                    fullWidth
                  >
                    Scan Cheque Slip
                  </BaseButton>
                  {!scanningCheque && chequeData.accountNumber ? (
                    <Caption color="primary">✔ Cheque data loaded</Caption>
                  ) : null}
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.taxRow,
                  pressed && styles.taxRowPressed,
                ]}
                onPress={() => setTaxSheetVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Tax Details"
              >
                <BaseText fontSize="sm" fontWeight="bold" color="successFg">
                  Tax Details
                </BaseText>
                <View style={styles.taxRowRight}>
                  <BaseText fontSize="md" fontWeight="extrabold" color="primary">
                    {fmt$(computed.totalAmountDue)}
                  </BaseText>
                  <ChevronDown size={16} color={theme.colors.primary} />
                </View>
              </Pressable>

              <BaseButton size="lg" fullWidth onPress={handleAddPayment}>
                Save Payment
              </BaseButton>
            </View>
          )}
        </Card.MainContent>
      </Card.Root>

      {/* Encoded payments */}
      <DataTable<PaymentRecord>
        title="Encoded Payment(s)"
        description={`${payments.length} record(s)`}
        headerActions={
          payments.length > 0 ? (
            <BaseButton tone="danger" size="sm" onPress={handleDeleteAll}>
              Delete All
            </BaseButton>
          ) : undefined
        }
        data={payments}
        columns={columns}
        features={tableFeatures}
        getRowId={(r) => r.SI}
        onRowClick={setDetailRecord}
        emptyState={
          <EmptyStateCard
            title="No payments encoded"
            description="Search a planholder above and save a payment to see it listed here."
          />
        }
      />
    </View>
  );

  // ── Step 2: Prepare DRS ────────────────────────────────────────────────────

  const drsStepContent = (
    <View style={styles.stepContent}>
      <Card.Root title="Digital Remittance">
        <Card.Subtitle>{drsNo}</Card.Subtitle>
        <Card.ButtonSection>
          <PrintIconButton
            accessibilityLabel="Share DRS"
            onPress={handleShareDrs}
          />
        </Card.ButtonSection>
        <Card.MainContent>
          {payments.length === 0 ? (
            <EmptyStateCard
              icon={FileText}
              title="No payments to remit"
              description="Go back and encode at least one payment first."
            />
          ) : (
            <View style={styles.formStack}>
              <View style={styles.drsMetaRow}>
                <View style={styles.flex1}>
                  <Caption>REMITTANCE (HEAD OFFICE)</Caption>
                  <BaseText
                    fontSize="sm"
                    fontWeight="bold"
                    color="heading"
                    numberOfLines={1}
                  >
                    {preparedByName}
                  </BaseText>
                </View>
                <View style={styles.drsMetaRight}>
                  <View style={styles.drsPayTypeRow}>
                    <Caption>Payment Type</Caption>
                    <OSPBadge type="success">{paymentTypeLabel}</OSPBadge>
                  </View>
                  <BaseText fontSize="sm" fontWeight="bold" color="heading">
                    {drsNo}
                  </BaseText>
                </View>
              </View>

              <DataTable<PaymentRecord>
                data={payments}
                columns={drsColumns}
                features={tableFeatures}
                getRowId={(r) => r.SI}
                onRowClick={setDetailRecord}
                emptyState={
                  <EmptyStateCard
                    title="No payments encoded"
                    description="Encode a payment first."
                  />
                }
              />

              <View style={styles.computedBox}>
                <RowItem label="Total Payments" value={payments.length} />
                <RowItem label="Total Amount" value={fmt$(drsTotals.amount)} />
                <RowItem
                  label="Total Commission"
                  value={fmt$(drsTotals.commission)}
                />
                <RowItem
                  label="Total Transportation Expense"
                  value={fmt$(drsTotals.transportation)}
                />
              </View>
            </View>
          )}
        </Card.MainContent>
      </Card.Root>
    </View>
  );

  return (
    <>
      <View style={styles.content}>
        <FormStepper
          stepsData={[
            {
              title: "Encode Payment",
              icon: CreditCard,
              content: encodeStepContent,
              validateBeforeNext: validateEncodeStep,
            },
            {
              title: "Prepare DRS",
              icon: Clipboard,
              content: drsStepContent,
            },
          ]}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          onStepsComplete={handleConfirmGenerateDrs}
          submitButtonText="Generate DRS"
          submitDisabled={payments.length === 0}
        />
      </View>

      {/* Tax details sheet */}
      <ResponsiveSheet
        open={taxSheetVisible}
        onClose={() => setTaxSheetVisible(false)}
        title="Tax Details"
        isTablet={isTablet}
      >
        <View style={styles.sheetBody}>
          <RowItem
            label="Vatable Sales"
            value={computed.vatableSales.toFixed(2)}
          />
          <RowItem
            label="VAT Exempt Sales"
            value={computed.vatExemptSales.toFixed(2)}
          />
          <RowItem label="Total Sales" value={computed.totalSales.toFixed(2)} />
          <RowItem label="Add 12% VAT" value={computed.vatAmount.toFixed(2)} />
          <RowItem
            label="Amount Net of VAT"
            value={computed.amountNetOfVat.toFixed(2)}
          />
          <RowItem
            label="Withholding Tax"
            value={computed.withholdingTax.toFixed(2)}
          />
          <RowItem
            label="Total Amount Due"
            value={computed.totalAmountDue.toFixed(2)}
          />
        </View>
      </ResponsiveSheet>

      {/* Row detail sheet */}
      <ResponsiveSheet
        open={detailRecord !== null}
        onClose={() => setDetailRecord(null)}
        title="Payment Detail"
        isTablet={isTablet}
      >
        {detailRecord && (
          <View style={styles.sheetBody}>
            <RowItem label="Name" value={detailRecord.Name} />
            <RowItem label="SI Date" value={fmtDateStr(detailRecord.SIDate)} />
            <RowItem
              label="Installment No."
              value={String(detailRecord.InstNo)}
            />
            <RowItem label="Pay Class" value={detailRecord.PayClass} />
            <RowItem label="Amount" value={fmt$(detailRecord.SIAmount)} />
            <RowItem label="Commission" value={fmt$(detailRecord.Commission)} />
            <RowItem
              label="Transportation Expense"
              value={fmt$(detailRecord.TransportationExpense)}
            />
            <RowItem
              label="Encoded Date"
              value={fmtDateStr(detailRecord.EncodedDate)}
            />
          </View>
        )}
      </ResponsiveSheet>

      {/* Status alert */}
      <MessageDialog
        open={alertState.open}
        onOpenChange={(o) => !o && dismissAlert()}
        variant={alertState.variant}
        title={alertState.title}
        message={alertState.message}
      />

      {/* Generate DRS confirmation */}
      <MessageDialog
        open={confirmDrsVisible}
        onOpenChange={(o) => !o && setConfirmDrsVisible(false)}
        onConfirm={handleGenerateDrs}
        variant="confirmation"
        title="Generate DRS"
        message="Would you like to create a Digital Remittance Slip for these payments?"
        cancelText="No"
        confirmText="Yes"
      />
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(t: StPeterTheme) {
  const c = t.colors;
  return StyleSheet.create({
    content: { gap: 10 },
    stepContent: { gap: 10 },
    flex1: { flex: 1 },

    // Selected planholder summary
    infoStack: { gap: 10 },
    infoRowPair: { flexDirection: "row", gap: 12 },

    // Form fields
    formStack: { gap: 12 },
    fieldGroup: { gap: 6 },
    formGrid: { flexDirection: "column", gap: 12 },
    formGridRow: { flexDirection: "row", flexWrap: "wrap" },
    formGridItem: { width: "48%" },

    // Amount stepper
    stepperRow: { flexDirection: "row", alignItems: "center", gap: 8 },

    // Computed values box
    computedBox: {
      backgroundColor: c.canvas,
      borderRadius: t.radii.control,
      borderWidth: 1,
      borderColor: c.hairline,
      paddingHorizontal: 10,
    },

    // Prepare DRS
    drsMetaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    drsMetaRight: { alignItems: "flex-end", gap: 2 },
    drsPayTypeRow: { flexDirection: "row", alignItems: "center", gap: 6 },

    // Cheque details
    chequeSection: { gap: 12 },

    // Tax details row
    taxRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.successTint,
      borderRadius: t.radii.card,
      borderWidth: 1,
      borderColor: alpha(c.primary, 0.2),
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    taxRowPressed: { opacity: 0.75 },
    taxRowRight: { flexDirection: "row", alignItems: "center", gap: 6 },

    // Tax / detail sheet body
    sheetBody: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8 },
  });
}
