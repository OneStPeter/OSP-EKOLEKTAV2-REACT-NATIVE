import { useLocalSearchParams, useRouter } from "expo-router";
import { Banknote, PhilippinePeso, Search } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BOTTOM_NAV_HEIGHT } from "@/components/navigation/BottomNavBar";
import type { TableColDef } from "@/components/ui";
import {
  AlertModal,
  AppButton,
  Badge,
  Card,
  ConfirmModal,
  EmptyState,
  FloatingLabelInput,
  LookupField,
  RowItem,
  Table,
  theme,
  useAlertModal,
  type FloatingLabelSelectOption,
} from "@/components/ui";
import {
  DRS_ITEMS,
  drsAmount,
  drsTotals,
  type DrsItem,
  type DrsPaymentRow,
} from "@/data/drs";
import { useScrollNav } from "@/hooks/use-scroll-nav";

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

const PAYMENT_COLUMNS: TableColDef<DrsPaymentRow>[] = [
  {
    key: "SI",
    label: "SI No.",
    width: 88,
    renderCell: (r) => <Text style={styles.cellStrong}>{r.SI}</Text>,
  },
  {
    key: "Name",
    label: "Name",
    width: 140,
    renderCell: (r) => (
      <Text style={styles.cellBody} numberOfLines={2}>
        {r.Name}
      </Text>
    ),
  },
  {
    key: "PayClass",
    label: "Class",
    width: 76,
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
    width: 100,
    align: "right",
    renderCell: (r) => (
      <Text style={[styles.cellStrong, { textAlign: "right" }]}>
        {fmt$(r.SIAmount)}
      </Text>
    ),
  },
];

// ── Screen ──────────────────────────────────────────────────────────────────

export default function EncodeDepositScreen() {
  const scrollHandler = useScrollNav();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const router = useRouter();

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
        {/* DRS search */}
        <LookupField<DrsItem>
          label="Digital Remittance Slip"
          placeholder="Search Digital Remittance Slip"
          modalTitle="Search Digital Remittance Slip"
          data={DRS_ITEMS}
          searchKeys={["name"]}
          value={selectedDrs}
          onSelect={handleSelectDrs}
          renderDisplay={(item) => `${item.name} (${fmt$(drsAmount(item))})`}
          keyExtractor={(item) => item.id}
        />

        {/* Deposit details */}
        <Card
          icon={Banknote}
          title="Deposit Details"
          subtitle={selectedDrs ? selectedDrs.name : "Select a DRS first"}
          style={{ marginTop: 4 }}
        >
          {!selectedDrs ? (
            <EmptyState
              icon={Search}
              title="No DRS Selected"
              message="Search and select a Digital Remittance Slip to start entering deposit details."
            />
          ) : (
            <>
              <View style={[styles.formGrid, isTablet && styles.formGridRow]}>
                <FloatingLabelInput
                  label="Deposit Date Time"
                  type="datetime"
                  value={fmtDateTime(depositDate)}
                  onChangeText={() => {}}
                  pickerValue={depositDate}
                  onChangeValue={setDepositDate}
                  containerStyle={isTablet ? styles.formGridItem : undefined}
                />
                <FloatingLabelInput
                  label="Account Number"
                  type="number"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  containerStyle={isTablet ? styles.formGridItem : undefined}
                />
                <FloatingLabelInput
                  label="Amount"
                  type="number"
                  value={String(amount)}
                  onChangeText={(t) => setAmount(Number(t) || 0)}
                  leftIcon={
                    <PhilippinePeso size={14} color={theme.color.body} />
                  }
                  containerStyle={isTablet ? styles.formGridItem : undefined}
                />
                <FloatingLabelInput
                  label="Bank Branch"
                  type="select"
                  value={bankBranch}
                  onChangeText={setBankBranch}
                  options={BANK_BRANCH_OPTIONS}
                  onSelectOption={(opt) => setBankBranch(opt.label)}
                  selectModalTitle="Select Bank Branch"
                  searchable
                  searchPlaceholder="Search bank or branch…"
                  containerStyle={isTablet ? styles.formGridItem : undefined}
                />
              </View>

              <Table<DrsPaymentRow>
                title="Payments"
                subtitle={`${totals?.count ?? 0} record(s)`}
                data={selectedDrs.payments}
                columns={PAYMENT_COLUMNS}
                keyExtractor={(r) => r.SI}
                emptyTitle="No payments"
                emptyMessage="This DRS has no encoded payments."
                style={{ marginTop: 14 }}
              />

              {totals && (
                <View style={styles.totalsBox}>
                  <RowItem label="Total Payments" value={totals.count} />
                  <RowItem label="Total Amount" value={fmt$(totals.amount)} />
                  <RowItem
                    label="Total Commission"
                    value={fmt$(totals.commission)}
                  />
                </View>
              )}

              <AppButton
                size="lg"
                style={{ marginTop: 14 }}
                onPress={handleSave}
              >
                Save Deposit
              </AppButton>
            </>
          )}
        </Card>
      </Animated.ScrollView>

      {/* Save confirmation */}
      <ConfirmModal
        visible={confirmSaveVisible}
        onCancel={() => setConfirmSaveVisible(false)}
        onConfirm={performSave}
        variant="info"
        title="Confirmation"
        message="Do you want to save this deposit?"
        confirmLabel="Save"
      />

      {/* Status alert */}
      <AlertModal
        visible={alertState.visible}
        onDismiss={dismissAlert}
        variant={alertState.variant}
        title={alertState.title}
        message={alertState.message}
      />
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10 },

  formGrid: { flexDirection: "column", gap: 12 },
  formGridRow: { flexDirection: "row", flexWrap: "wrap" },
  formGridItem: { width: "48%" },

  totalsBox: {
    backgroundColor: theme.color.bg,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.color.border,
    paddingHorizontal: 10,
    marginTop: 12,
  },

  cellStrong: { fontSize: 12, fontWeight: "700", color: theme.color.ink },
  cellBody: { fontSize: 12, color: theme.color.body },
});
