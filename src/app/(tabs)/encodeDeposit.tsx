import { useLocalSearchParams, useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import {
  BaseButton,
  BaseText,
  Card,
  DataTable,
  EmptyStateCard,
  FloatingLabelInput,
  FloatingLabelSelect,
  LookupField,
  MessageDialog,
  OSPBadge,
  RowItem,
  useThemedStyles,
  type DataTableProps,
  type FloatingLabelSelectOption,
  type LookupColumn,
  type OSPBadgeType,
} from "osp-ui-kit-native";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import { DateTimeField } from "@/components/DateTimeField";
import { useAlertModal } from "@/hooks/use-alert-modal";
import {
  DRS_ITEMS,
  drsAmount,
  drsTotals,
  type DrsItem,
  type DrsPaymentRow,
  type DrsStatus,
} from "@/data/drs";

// ── Types ────────────────────────────────────────────────────────────────────

type BankBranch = { code: string; name: string; branch: string };

// ── Static data ─────────────────────────────────────────────────────────────

const BANK_BRANCHES: BankBranch[] = [
  { code: "BDO", name: "Banco De Oro", branch: "Quiapo" },
  { code: "BPI", name: "Bank of the Philippine Islands", branch: "Ortigas" },
  { code: "MBTC", name: "Metrobank", branch: "Makati" },
  { code: "LBP", name: "Landbank", branch: "Cubao" },
];

const BANK_BRANCH_OPTIONS: FloatingLabelSelectOption[] = BANK_BRANCHES.map(
  (b) => ({ value: b.code, label: `${b.name} — ${b.branch}` }),
);

const STATUS_BADGE: Record<DrsStatus, OSPBadgeType> = {
  Pending: "warning",
  Validated: "success",
  "For Deposit": "info",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(n: number) {
  return (
    "₱" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function fmtDateTime(d: Date) {
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Column definitions ───────────────────────────────────────────────────────

// Typed through the kit so the screen needs no direct @tanstack import.
type ColumnDefs<T> = DataTableProps<T>["columns"];

const PAYMENT_COLUMNS: ColumnDefs<DrsPaymentRow> = [
  {
    accessorKey: "SI",
    header: "SI No.",
    meta: { width: 88 },
    cell: ({ row }) => (
      <BaseText fontSize="xs" fontWeight="bold">
        {row.original.SI}
      </BaseText>
    ),
  },
  {
    accessorKey: "Name",
    header: "Name",
    meta: { width: 140 },
    cell: ({ row }) => (
      <BaseText fontSize="xs" color="mutedStrong" numberOfLines={2}>
        {row.original.Name}
      </BaseText>
    ),
  },
  {
    accessorKey: "PayClass",
    header: "Class",
    meta: { width: 76 },
    cell: ({ row }) => (
      <OSPBadge type="success">{row.original.PayClass}</OSPBadge>
    ),
  },
  {
    accessorKey: "SIAmount",
    header: "Amount",
    meta: { width: 100, numeric: true },
    cell: ({ row }) => (
      <BaseText fontSize="xs" fontWeight="bold" textAlign="right">
        {fmt$(row.original.SIAmount)}
      </BaseText>
    ),
  },
];

const DRS_LOOKUP_COLUMNS: LookupColumn<DrsItem>[] = [
  { key: "name", header: "DRS" },
  { key: "SlipDate", header: "Slip Date" },
  {
    key: "payments",
    header: "Amount",
    render: (_value, row) => fmt$(drsAmount(row)),
  },
  {
    key: "Status",
    header: "Status",
    render: (_value, row) => (
      <OSPBadge type={STATUS_BADGE[row.Status]}>{row.Status}</OSPBadge>
    ),
  },
];

// ── Screen ──────────────────────────────────────────────────────────────────

export default function EncodeDepositScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const router = useRouter();
  const styles = useThemedStyles((t) =>
    StyleSheet.create({
      content: { padding: 16, gap: 10 },

      formGrid: { flexDirection: "column", gap: 12 },
      formGridRow: { flexDirection: "row", flexWrap: "wrap" },
      formGridItem: { width: "48%" },

      tableWrap: { marginTop: 14 },

      totalsBox: {
        backgroundColor: t.colors.canvas,
        borderRadius: t.radii.sm,
        borderWidth: 1,
        borderColor: t.colors.hairline,
        paddingHorizontal: 10,
        marginTop: 12,
      },
    }),
  );

  const { drs } = useLocalSearchParams<{ drs?: string }>();

  const [selectedDrs, setSelectedDrs] = useState<DrsItem | null>(() => {
    if (!drs) return null;
    try {
      return JSON.parse(drs) as DrsItem;
    } catch {
      return null;
    }
  });

  // The tab screen stays mounted across navigations (lazy: false), so the
  // `drs` param can change on an already-mounted instance — re-sync state
  // whenever a new DRS is handed off instead of relying on initial mount.
  useEffect(() => {
    if (!drs) return;
    try {
      setSelectedDrs(JSON.parse(drs) as DrsItem);
    } catch {
      // ignore malformed param
    }
  }, [drs]);
  const [depositDate, setDepositDate] = useState(new Date());
  const [accountNumber, setAccountNumber] = useState("2010073262");
  const [amount, setAmount] = useState(0);
  const [bankBranch, setBankBranch] = useState("");
  const [confirmSaveVisible, setConfirmSaveVisible] = useState(false);
  const { alertState, showAlert, dismissAlert } = useAlertModal();

  // DRS_ITEMS is ordered most-recently-created first, so the oldest
  // (first-created) DRS — the only one eligible for encoding — is last.
  const eligibleId = DRS_ITEMS[DRS_ITEMS.length - 1]?.id;

  const totals = useMemo(
    () => (selectedDrs ? drsTotals(selectedDrs) : null),
    [selectedDrs],
  );

  useEffect(() => {
    setAmount(selectedDrs ? drsAmount(selectedDrs) : 0);
  }, [selectedDrs]);

  function handleSelectDrs(item: DrsItem | null) {
    if (!item) {
      setSelectedDrs(null);
      return;
    }
    if (item.id !== eligibleId) {
      showAlert(
        "warning",
        "Encode Deposit",
        "Please encode the first created DRS.",
      );
      return;
    }
    setSelectedDrs(item);
  }

  function handleSave() {
    if (!selectedDrs) return;
    setConfirmSaveVisible(true);
  }

  function performSave() {
    setConfirmSaveVisible(false);
    showAlert("success", "Success", "Deposit successfully saved.", () =>
      router.replace("/viewDrs" as never),
    );
  }

  return (
    <>
      <View style={[styles.content, { paddingTop: 16, paddingHorizontal: 8 }]}>
        {/* DRS search */}
        <LookupField<DrsItem>
          label="Digital Remittance Slip"
          placeholder="Search Digital Remittance Slip"
          modalTitle="Search Digital Remittance Slip"
          dataSource={DRS_ITEMS}
          searchKeys={["name"]}
          columns={DRS_LOOKUP_COLUMNS}
          value={selectedDrs}
          onSelect={handleSelectDrs}
          renderDisplay={(item) => `${item.name} (${fmt$(drsAmount(item))})`}
          variant="search"
        />

        {/* Deposit details */}
        <Card.Root title="Deposit Details" style={{ marginTop: 4 }}>
          <Card.Subtitle>
            | {selectedDrs ? selectedDrs.name : "Select a DRS first"}
          </Card.Subtitle>
          <Card.MainContent>
            {!selectedDrs ? (
              <EmptyStateCard
                icon={Search}
                title="No DRS Selected"
                description="Search and select a Digital Remittance Slip to start entering deposit details."
              />
            ) : (
              <>
                <View
                  style={[styles.formGrid, isTablet && styles.formGridRow]}
                >
                  <DateTimeField
                    label="Deposit Date Time"
                    mode="datetime"
                    value={depositDate}
                    onChange={setDepositDate}
                    format={fmtDateTime}
                    containerStyle={isTablet ? styles.formGridItem : undefined}
                  />
                  <FloatingLabelInput
                    label="Account Number"
                    type="number"
                    value={accountNumber}
                    onValueChange={setAccountNumber}
                    containerStyle={isTablet ? styles.formGridItem : undefined}
                  />
                  <FloatingLabelInput
                    label="Amount"
                    type="number"
                    value={String(amount)}
                    onValueChange={(t) => setAmount(Number(t) || 0)}
                    startText="₱"
                    containerStyle={isTablet ? styles.formGridItem : undefined}
                  />
                  <FloatingLabelSelect
                    label="Bank Branch"
                    value={bankBranch}
                    onValueChange={setBankBranch}
                    options={BANK_BRANCH_OPTIONS}
                    containerStyle={isTablet ? styles.formGridItem : undefined}
                  />
                </View>

                <View style={styles.tableWrap}>
                  <DataTable<DrsPaymentRow>
                    title="Payments"
                    description={`${totals?.count ?? 0} record(s)`}
                    data={selectedDrs.payments}
                    columns={PAYMENT_COLUMNS}
                    getRowId={(r) => r.SI}
                    size="sm"
                    features={{
                      search: false,
                      sorting: true,
                      pagination: false,
                      columnToggle: false,
                      filtering: false,
                      selection: false,
                      detailSidebar: false,
                    }}
                    emptyState={
                      <EmptyStateCard
                        title="No payments"
                        description="This DRS has no encoded payments."
                      />
                    }
                    mobileConfig={{
                      viewMode: "card",
                      primaryField: "Name",
                      titleTransform: "none",
                      secondaryField: "SI",
                      visibleFields: ["PayClass", "SIAmount"],
                      labelMap: { PayClass: "Class", SIAmount: "Amount" },
                      valueFormatter: {
                        SIAmount: (v) => fmt$(Number(v) || 0),
                      },
                    }}
                  />
                </View>

                {totals && (
                  <View style={styles.totalsBox}>
                    <RowItem
                      label="Total Payments"
                      value={totals.count.toLocaleString()}
                    />
                    <RowItem
                      label="Total Amount"
                      value={fmt$(totals.amount)}
                    />
                    <RowItem
                      label="Total Commission"
                      value={fmt$(totals.commission)}
                    />
                  </View>
                )}

                <BaseButton
                  size="lg"
                  fullWidth
                  style={{ marginTop: 14 }}
                  onPress={handleSave}
                >
                  Save Deposit
                </BaseButton>
              </>
            )}
          </Card.MainContent>
        </Card.Root>
      </View>

      {/* Save confirmation */}
      <MessageDialog
        open={confirmSaveVisible}
        onOpenChange={(o) => !o && setConfirmSaveVisible(false)}
        onConfirm={performSave}
        variant="confirmation"
        title="Confirmation"
        message="Do you want to save this deposit?"
        confirmText="Save"
      />

      {/* Status alert */}
      <MessageDialog
        open={alertState.open}
        onOpenChange={(o) => !o && dismissAlert()}
        variant={alertState.variant}
        title={alertState.title}
        message={alertState.message}
        confirmText="OK"
      />
    </>
  );
}
