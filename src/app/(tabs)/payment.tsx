import {
  Calendar,
  Camera,
  ChevronDown,
  ChevronRight,
  Clipboard,
  CreditCard,
  FileText,
  Minus,
  Plus,
  Printer,
  Receipt,
  Search,
  Trash2,
  User,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BOTTOM_NAV_HEIGHT } from "@/components/navigation/BottomNavBar";
import type { StepperStep, TableColDef } from "@/components/ui";
import {
  AlertModal,
  AppButton,
  AppCaption,
  Badge,
  BRAND_COLORS,
  Card,
  ConfirmModal,
  EmptyState,
  FloatingLabelInput,
  InfoRow,
  LookupField,
  PillSelect,
  RowItem,
  SectionHeader,
  Stepper,
  SwipeDismissModal,
  Table,
  theme,
  useAlertModal,
} from "@/components/ui";
import { useScrollNav } from "@/hooks/use-scroll-nav";

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

const ENCODE_STEPS: StepperStep[] = [
  { label: "Encode Payment", icon: CreditCard },
  { label: "Prepare DRS", icon: Clipboard },
];

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

// ── Screen ──────────────────────────────────────────────────────────────────

export default function EncodePaymentScreen() {
  const scrollHandler = useScrollNav();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

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

  const [drsNo] = useState(
    () => `DRS${Math.floor(100000000000 + Math.random() * 900000000000)}`,
  );

  const computed = useMemo(
    () => computePayments(installmentAmount),
    [installmentAmount],
  );

  const selectedPayClass = useMemo(
    () => PAY_CLASS_OPTIONS.find((o) => o.value === paymentClass) ?? null,
    [paymentClass],
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

  function handleStepPress(index: number) {
    if (index === 1 && payments.length === 0) {
      showAlert(
        "warning",
        "No Payments Encoded",
        "Encode at least one payment before preparing the DRS.",
      );
      return;
    }
    setCurrentStep(index);
  }

  function handleGenerateDrs() {
    setConfirmDrsVisible(false);
    showAlert(
      "success",
      "DRS Generated",
      `Digital Remittance Slip prepared for ${payments.length} payment(s) totaling ${fmt$(drsTotals.amount)}.`,
    );
  }

  function handleConfirmGenerateDrs() {
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

  const columns: TableColDef<PaymentRecord>[] = useMemo(
    () => [
      {
        key: "SI",
        label: "SI No.",
        width: 96,
        renderCell: (r) => <Text style={styles.cellStrong}>{r.SI}</Text>,
      },
      {
        key: "Name",
        label: "Name",
        width: 150,
        renderCell: (r) => (
          <Text style={styles.cellBody} numberOfLines={2}>
            {r.Name}
          </Text>
        ),
      },
      {
        key: "InstNo",
        label: "Inst. No",
        width: 64,
        align: "center",
        renderCell: (r) => (
          <Text style={[styles.cellBody, { textAlign: "center" }]}>
            {r.InstNo}
          </Text>
        ),
      },
      {
        key: "PayClass",
        label: "Pay Class",
        width: 88,
        renderCell: (r) => (
          <Badge
            label={r.PayClass}
            color={theme.color.accent}
            backgroundColor={theme.color.accent + "18"}
          />
        ),
      },
      {
        key: "SIAmount",
        label: "Amount",
        width: 104,
        align: "right",
        renderCell: (r) => (
          <Text style={[styles.cellStrong, { textAlign: "right" }]}>
            {fmt$(r.SIAmount)}
          </Text>
        ),
      },
      {
        key: "EncodedDate",
        label: "Encoded",
        width: 96,
        renderCell: (r) => (
          <Text style={styles.cellMuted}>{fmtDateStr(r.EncodedDate)}</Text>
        ),
      },
      {
        key: "action",
        label: "",
        width: 40,
        align: "center",
        renderCell: (r) =>
          r.SI === payments[0]?.SI ? (
            <TouchableOpacity onPress={() => handleDeleteRow(r.SI)} hitSlop={8}>
              <Trash2 size={15} color={theme.color.error} />
            </TouchableOpacity>
          ) : null,
      },
    ],
    [payments],
  );

  const drsColumns: TableColDef<PaymentRecord>[] = useMemo(
    () => [
      {
        key: "SI",
        label: "SI No.",
        width: 96,
        renderCell: (r) => <Text style={styles.cellStrong}>{r.SI}</Text>,
      },
      {
        key: "Name",
        label: "Name",
        width: 150,
        renderCell: (r) => (
          <Text style={styles.cellBody} numberOfLines={2}>
            {r.Name}
          </Text>
        ),
      },
      {
        key: "InstNo",
        label: "Inst. No",
        width: 64,
        align: "center",
        renderCell: (r) => (
          <Text style={[styles.cellBody, { textAlign: "center" }]}>
            {r.InstNo}
          </Text>
        ),
      },
      {
        key: "PayClass",
        label: "Pay Class",
        width: 88,
        renderCell: (r) => (
          <Badge
            label={r.PayClass}
            color={theme.color.accent}
            backgroundColor={theme.color.accent + "18"}
          />
        ),
      },
      {
        key: "SIAmount",
        label: "Amount",
        width: 104,
        align: "right",
        renderCell: (r) => (
          <Text style={[styles.cellStrong, { textAlign: "right" }]}>
            {fmt$(r.SIAmount)}
          </Text>
        ),
      },
      {
        key: "Commission",
        label: "Commission",
        width: 96,
        align: "right",
        renderCell: (r) => (
          <Text style={[styles.cellBody, { textAlign: "right" }]}>
            {fmt$(r.Commission)}
          </Text>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={{ backgroundColor: theme.color.bg }}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 16,
            paddingHorizontal: isTablet ? 24 : 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Stepper
          steps={ENCODE_STEPS}
          currentStep={currentStep}
          onStepPress={handleStepPress}
          style={{ marginBottom: 4 }}
        />

        {currentStep === 0 && (
          <>
            {/* Planholder search trigger */}
            <LookupField<PlanholderLookupItem>
              placeholder="Search by Name / LPA#"
              modalTitle="Search Planholder"
              data={PLANHOLDER_LOOKUP}
              searchKeys={["LPANo", "FirstName", "MiddleName", "LastName"]}
              value={selectedPlanholder}
              onSelect={setSelectedPlanholder}
              renderDisplay={planholderDisplayLabel}
              renderMeta={(item) => `${item.LPANo} · ${item.PlanDescription}`}
              keyExtractor={(item) => item.LPANo}
            />

            {/* Selected planholder summary */}
            {selectedPlanholder && (
              <Card
                style={{ marginTop: 2 }}
                icon={User}
                title={fullPlanholderName(selectedPlanholder)}
                subtitle={selectedPlanholder.LPANo}
              >
                <InfoRow
                  icon={FileText}
                  label="Plan"
                  value={selectedPlanholder.PlanDescription}
                />
                <View style={styles.infoRowPair}>
                  <InfoRow
                    icon={Calendar}
                    label="Effectivity"
                    value={fmtDateStr(selectedPlanholder.EffectivityDate)}
                    style={{ flex: 1 }}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Due"
                    value={fmtDateStr(selectedPlanholder.DueDate)}
                    style={{ flex: 1 }}
                  />
                </View>
                <View style={styles.infoRowPair}>
                  <InfoRow
                    icon={User}
                    label="Agent"
                    value={selectedPlanholder.FirstName}
                    style={{ flex: 1 }}
                  />
                  <InfoRow
                    icon={User}
                    label="Agent 2"
                    value={selectedPlanholder.LastName}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            )}

            {/* Payment details */}
            <Card
              icon={Receipt}
              title="Payment Details"
              subtitle={
                !selectedPlanholder
                  ? "Select a planholder first"
                  : payments.length > 0
                    ? `${payments.length} payment(s) encoded`
                    : "Enter payment information"
              }
            >
              {!selectedPlanholder ? (
                <EmptyState
                  icon={Search}
                  title="No Planholder Selected"
                  message="Search and select a planholder to start entering payment details."
                />
              ) : (
                <>
                  <FloatingLabelInput
                    label="Payment Class"
                    type="select"
                    value={
                      selectedPayClass
                        ? `${selectedPayClass.value} — ${selectedPayClass.label}`
                        : ""
                    }
                    onChangeText={() => {}}
                    options={PAY_CLASS_OPTIONS}
                    onSelectOption={(opt) => setPaymentClass(opt.value)}
                    selectModalTitle="Select Payment Class"
                    containerStyle={{ marginBottom: 12 }}
                  />
                  <PillSelect
                    label="Payment Type"
                    options={PAY_TYPE_OPTIONS}
                    value={paymentType}
                    onChange={setPaymentType}
                  />

                  <View
                    style={[styles.formGrid, isTablet && styles.formGridRow]}
                  >
                    <FloatingLabelInput
                      label="Sales Invoice Number"
                      value={siNumber}
                      onChangeText={setSiNumber}
                      onBlur={() => {
                        const raw = siNumber.trim();
                        if (/^\d+$/.test(raw))
                          setSiNumber(raw.padStart(8, "0"));
                      }}
                      keyboardType="number-pad"
                      containerStyle={
                        isTablet ? styles.formGridItem : undefined
                      }
                    />
                    <FloatingLabelInput
                      label="Sales Invoice Extension"
                      value={siExtension}
                      onChangeText={setSiExtension}
                      containerStyle={
                        isTablet ? styles.formGridItem : undefined
                      }
                    />
                    <FloatingLabelInput
                      label="Sales Invoice Date"
                      type="date"
                      value={siDate}
                      onChangeText={setSiDate}
                      pickerValue={new Date(siDate)}
                      formatValue={toIsoDate}
                      containerStyle={
                        isTablet ? styles.formGridItem : undefined
                      }
                    />
                  </View>

                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={handleDecrease}
                      activeOpacity={0.75}
                    >
                      <Minus size={16} color={theme.color.body} />
                    </TouchableOpacity>
                    <FloatingLabelInput
                      label="Amount"
                      type="number"
                      value={String(installmentAmount)}
                      onChangeText={(t) => setInstallmentAmount(Number(t) || 0)}
                      containerStyle={{ flex: 1, marginTop: 0 }}
                    />
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={handleIncrease}
                      activeOpacity={0.75}
                    >
                      <Plus size={16} color={theme.color.body} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.computedBox}>
                    <RowItem
                      label="Com CBI"
                      value={computed.comCBI.toFixed(2)}
                    />
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
                      <SectionHeader title="Cheque Details" />
                      <View
                        style={[
                          styles.formGrid,
                          isTablet && styles.formGridRow,
                        ]}
                      >
                        <FloatingLabelInput
                          label="Account Number"
                          value={chequeData.accountNumber}
                          onChangeText={(t) =>
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
                          onChangeText={(t) =>
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
                          onChangeText={(t) =>
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
                          onChangeText={(t) =>
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
                          onChangeText={(t) =>
                            setChequeData((p) => ({ ...p, chequeNumber: t }))
                          }
                          disabled={scanningCheque}
                          containerStyle={
                            isTablet ? styles.formGridItem : undefined
                          }
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.scanBtn}
                        onPress={handleScanCheque}
                        activeOpacity={0.75}
                        disabled={scanningCheque}
                      >
                        {scanningCheque ? (
                          <ActivityIndicator
                            size="small"
                            color={theme.color.accent}
                          />
                        ) : (
                          <Camera size={15} color={theme.color.accent} />
                        )}
                        <Text style={styles.scanBtnText}>
                          {scanningCheque
                            ? "Scanning cheque…"
                            : "Scan Cheque Slip"}
                        </Text>
                      </TouchableOpacity>
                      {!scanningCheque && chequeData.accountNumber ? (
                        <AppCaption color="accent" style={{ marginTop: 6 }}>
                          ✔ Cheque data loaded
                        </AppCaption>
                      ) : null}
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.taxRow}
                    onPress={() => setTaxSheetVisible(true)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.taxRowLabel}>Tax Details</Text>
                    <View style={styles.taxRowRight}>
                      <Text style={styles.taxRowValue}>
                        {fmt$(computed.totalAmountDue)}
                      </Text>
                      <ChevronDown
                        size={16}
                        color={BRAND_COLORS.primaryGreen}
                      />
                    </View>
                  </TouchableOpacity>

                  <AppButton
                    size="lg"
                    style={{ marginTop: 14 }}
                    onPress={handleAddPayment}
                  >
                    Save Payment
                  </AppButton>
                </>
              )}
            </Card>

            {/* Encoded payments */}
            <Table<PaymentRecord>
              title="Encoded Payment(s)"
              subtitle={`${payments.length} record(s)`}
              headerAction={
                payments.length > 0 ? (
                  <AppButton
                    variant="destructive"
                    size="sm"
                    onPress={handleDeleteAll}
                  >
                    Delete All
                  </AppButton>
                ) : undefined
              }
              data={payments}
              columns={columns}
              keyExtractor={(r) => r.SI}
              onRowClick={setDetailRecord}
              emptyTitle="No payments encoded"
              emptyMessage="Search a planholder above and save a payment to see it listed here."
            />

            {payments.length > 0 && (
              <AppButton
                size="lg"
                style={{ marginTop: 10 }}
                onPress={() => handleStepPress(1)}
                rightIcon={<ChevronRight size={16} color="#fff" />}
              >
                Next: Prepare DRS
              </AppButton>
            )}
          </>
        )}

        {currentStep === 1 && (
          <Card
            icon={FileText}
            title="Digital Remittance"
            subtitle={drsNo}
            headerAction={
              <TouchableOpacity
                onPress={handleShareDrs}
                style={styles.iconBtn}
                hitSlop={8}
              >
                <Printer size={16} color={theme.color.accent} />
              </TouchableOpacity>
            }
          >
            {payments.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No payments to remit"
                message="Go back and encode at least one payment first."
              />
            ) : (
              <>
                <View style={styles.drsMetaRow}>
                  <View style={{ flex: 1 }}>
                    <AppCaption>REMITTANCE (HEAD OFFICE)</AppCaption>
                    <Text style={styles.drsMetaValue} numberOfLines={1}>
                      {preparedByName}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <View style={styles.drsPayTypeRow}>
                      <AppCaption>Payment Type</AppCaption>
                      <Badge
                        label={paymentTypeLabel}
                        color={BRAND_COLORS.primaryGreen}
                        backgroundColor={BRAND_COLORS.primaryGreen + "18"}
                      />
                    </View>
                    <Text style={styles.drsMetaValue}>{drsNo}</Text>
                  </View>
                </View>

                <Table<PaymentRecord>
                  data={payments}
                  columns={drsColumns}
                  keyExtractor={(r) => r.SI}
                  onRowClick={setDetailRecord}
                  emptyTitle="No payments encoded"
                  emptyMessage="Encode a payment first."
                />

                <View style={[styles.computedBox, { marginTop: 12 }]}>
                  <RowItem label="Total Payments" value={payments.length} />
                  <RowItem
                    label="Total Amount"
                    value={fmt$(drsTotals.amount)}
                  />
                  <RowItem
                    label="Total Commission"
                    value={fmt$(drsTotals.commission)}
                  />
                  <RowItem
                    label="Total Transportation Expense"
                    value={fmt$(drsTotals.transportation)}
                  />
                </View>

                <AppButton
                  size="lg"
                  style={{ marginTop: 4 }}
                  onPress={handleConfirmGenerateDrs}
                >
                  Generate DRS
                </AppButton>
                <AppButton
                  variant="secondary"
                  size="lg"
                  style={{ marginTop: 8 }}
                  onPress={() => setCurrentStep(0)}
                >
                  Back to Encode Payment
                </AppButton>
              </>
            )}
          </Card>
        )}
      </Animated.ScrollView>

      {/* Tax details sheet */}
      <SwipeDismissModal
        visible={taxSheetVisible}
        onDismiss={() => setTaxSheetVisible(false)}
        title="Tax Details"
        sheetWidth={420}
      >
        <View style={styles.taxSheetBody}>
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
      </SwipeDismissModal>

      {/* Row detail sheet */}
      <SwipeDismissModal
        visible={detailRecord !== null}
        onDismiss={() => setDetailRecord(null)}
        title="Payment Detail"
        sheetWidth={420}
      >
        {detailRecord && (
          <View style={styles.taxSheetBody}>
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
      </SwipeDismissModal>

      {/* Status alert */}
      <AlertModal
        visible={alertState.visible}
        onDismiss={dismissAlert}
        variant={alertState.variant}
        title={alertState.title}
        message={alertState.message}
      />

      {/* Generate DRS confirmation */}
      <ConfirmModal
        visible={confirmDrsVisible}
        onCancel={() => setConfirmDrsVisible(false)}
        onConfirm={handleGenerateDrs}
        variant="info"
        title="Generate DRS"
        message="Would you like to create a Digital Remittance Slip for these payments?"
        cancelLabel="No"
        confirmLabel="Yes"
      />
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10 },

  // Selected planholder summary
  infoRowPair: { flexDirection: "row", gap: 12 },

  // Form fields
  formGrid: { flexDirection: "column", gap: 12 },
  formGridRow: { flexDirection: "row", flexWrap: "wrap" },
  formGridItem: { width: "48%" },

  // Amount stepper
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 9,
    marginBottom: 12,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.color.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.color.card,
  },

  // Computed values box
  computedBox: {
    backgroundColor: BRAND_COLORS.subtleBg,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.color.border,
    paddingHorizontal: 10,
    marginTop: 2,
    marginBottom: 10,
  },

  // Prepare DRS
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.color.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.color.card,
  },
  drsMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  drsMetaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.color.ink,
    marginTop: 2,
  },
  drsPayTypeRow: { flexDirection: "row", alignItems: "center", gap: 6 },

  // Cheque details
  chequeSection: { marginTop: 4, marginBottom: 4 },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.sm,
    paddingVertical: 11,
    backgroundColor: theme.color.card,
    marginTop: 2,
  },
  scanBtnText: { fontSize: 13, fontWeight: "600", color: theme.color.accent },

  // Tax details row
  taxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.color.successBg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: BRAND_COLORS.primaryGreen + "33",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 2,
  },
  taxRowLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.darkGreen,
  },
  taxRowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  taxRowValue: {
    fontSize: 14,
    fontWeight: "800",
    color: BRAND_COLORS.primaryGreen,
  },

  // Table cells
  cellStrong: { fontSize: 12, fontWeight: "700", color: theme.color.ink },
  cellBody: { fontSize: 12, color: theme.color.body },
  cellMuted: { fontSize: 11, color: theme.color.muted },

  // Tax / detail sheet body
  taxSheetBody: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8 },
});
