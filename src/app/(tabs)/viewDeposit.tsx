import {
  Banknote,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Landmark,
  LayoutList,
  Trash2,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_HEADER_HEIGHT } from "@/components/navigation/AppHeader";
import { BOTTOM_NAV_HEIGHT } from "@/components/navigation/BottomNavBar";
import type { TableColDef } from "@/components/ui";
import {
  AlertModal,
  AppButton,
  Badge,
  BRAND_COLORS,
  ConfirmModal,
  EmptyState,
  FloatingLabelInput,
  LookupField,
  RowItem,
  SwipeDismissModal,
  Table,
  theme,
  useAlertModal,
  type FloatingLabelSelectOption,
} from "@/components/ui";
import { useScrollNav } from "@/hooks/use-scroll-nav";
import {
  DEPOSIT_ITEMS,
  type DepositItem,
  type DepositPaymentRow,
  type DepositStatus,
} from "@/data/deposit";

// ── Static data ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<DepositStatus, { color: string; bg: string }> = {
  Pending: { color: theme.color.warning, bg: theme.color.warningBg },
  Validated: { color: theme.color.accent, bg: theme.color.successBg },
  "For Deposit": { color: theme.color.info, bg: theme.color.infoBg },
};

type BankBranch = { code: string; name: string; branch: string };

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

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Column definitions ───────────────────────────────────────────────────────

const PAYMENT_COLUMNS: TableColDef<DepositPaymentRow>[] = [
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
    key: "InstNo",
    label: "Inst. No",
    width: 60,
    align: "center",
    renderCell: (r) => (
      <Text style={[styles.cellBody, { textAlign: "center" }]}>
        {r.InstNo}
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

type ViewMode = "list" | "detail";

export default function ViewDepositScreen() {
  const scrollHandler = useScrollNav();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [items, setItems] = useState<DepositItem[]>(DEPOSIT_ITEMS);
  const [view, setView] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [supplementaryOpen, setSupplementaryOpen] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const { alertState, showAlert, dismissAlert } = useAlertModal();

  const [suppDate, setSuppDate] = useState(new Date());
  const [suppAccountNo, setSuppAccountNo] = useState("");
  const [suppBankBranch, setSuppBankBranch] = useState("");
  const [suppBankCode, setSuppBankCode] = useState("");
  const [suppAmount, setSuppAmount] = useState("");
  const [suppDepositedBy, setSuppDepositedBy] = useState("");

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => Number(b.id) - Number(a.id)),
    [items],
  );

  const selectedItem = useMemo(
    () => sortedItems.find((item) => item.id === selectedId) ?? null,
    [selectedId, sortedItems],
  );

  function handleSelectItem(item: DepositItem) {
    setSelectedId(item.id);
    setView("detail");
  }

  function handleBackToList() {
    setView("list");
  }

  function resetSupplementaryForm() {
    setSuppDate(new Date());
    setSuppAccountNo("");
    setSuppBankBranch("");
    setSuppBankCode("");
    setSuppAmount("");
    setSuppDepositedBy("");
  }

  function handleOpenSupplementary() {
    resetSupplementaryForm();
    setSupplementaryOpen(true);
  }

  function handleSaveSupplementary() {
    setSupplementaryOpen(false);
    showAlert(
      "success",
      "Supplementary Encoded",
      `Additional deposit of ${suppAmount ? fmt$(Number(suppAmount) || 0) : "₱0.00"} was added to ${selectedItem?.name}.`,
    );
  }

  function handleDelete() {
    if (!selectedItem) return;
    setConfirmDeleteVisible(true);
  }

  function performDelete() {
    if (!selectedItem) return;
    setItems((prev) => prev.filter((x) => x.id !== selectedItem.id));
    setSelectedId(null);
    setView("list");
    setConfirmDeleteVisible(false);
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
            paddingTop: APP_HEADER_HEIGHT + insets.top + 16,
            paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 16,
            paddingHorizontal: isTablet ? 24 : 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {view === "list" ? (
          <>
            {/* Header */}
            <View style={styles.listHeader}>
              <View style={styles.listHeaderIcon}>
                <LayoutList size={16} color={theme.color.body} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listHeaderTitle}>Validated Deposits</Text>
                <Text style={styles.listHeaderSubtitle}>
                  {sortedItems.length} deposit(s)
                </Text>
              </View>
            </View>

            {/* Search */}
            <LookupField<DepositItem>
              placeholder="Search by reference…"
              modalTitle="Search Deposit"
              data={sortedItems}
              searchKeys={["name"]}
              value={null}
              onSelect={(item) => item && handleSelectItem(item)}
              renderDisplay={(item) => item.name}
              renderMeta={(item) =>
                `${fmtDateTime(item.DepositDateTime)} · ${fmt$(item.Amount)}`
              }
              keyExtractor={(item) => item.id}
              style={{ marginTop: 12 }}
            />

            {/* Deposit list */}
            <View style={styles.depositList}>
              {sortedItems.length === 0 ? (
                <EmptyState
                  icon={Banknote}
                  title="No deposits"
                  message="Validated deposits will appear here."
                />
              ) : (
                sortedItems.map((item) => {
                  const style = STATUS_STYLES[item.Status];
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      onPress={() => handleSelectItem(item)}
                      style={styles.depositCard}
                    >
                      <View
                        style={[
                          styles.depositStripe,
                          { backgroundColor: style.color },
                        ]}
                      />
                      <View style={styles.depositCardHeader}>
                        <View style={styles.depositCardHeaderLeft}>
                          <View style={styles.depositIconWrap}>
                            <Banknote size={16} color={theme.color.body} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.depositName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <View style={styles.depositDateRow}>
                              <Calendar size={11} color={theme.color.muted} />
                              <Text style={styles.depositDateText}>
                                {fmtDateTime(item.DepositDateTime)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Badge
                          label={item.Status}
                          color={style.color}
                          backgroundColor={style.bg}
                        />
                      </View>

                      <View style={styles.depositChips}>
                        <View style={styles.chip}>
                          <Banknote size={11} color={theme.color.body} />
                          <Text style={styles.chipText}>
                            {fmt$(item.Amount)}
                          </Text>
                        </View>
                        {item.BankBranch ? (
                          <View style={styles.chip}>
                            <Landmark size={11} color={theme.color.body} />
                            <Text style={styles.chipText} numberOfLines={1}>
                              {item.BankBranch}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.depositFooter}>
                        <Text style={styles.depositFooterHint}>
                          Tap to view details
                        </Text>
                        <ChevronRight size={14} color={theme.color.muted} />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        ) : !selectedItem ? (
          <EmptyState
            icon={Banknote}
            title="No Deposit Selected"
            message="Select a deposit from the list to view details"
          />
        ) : (
          (() => {
            const style = STATUS_STYLES[selectedItem.Status];
            return (
              <>
                {/* Detail header */}
                <View style={styles.detailHeader}>
                  <TouchableOpacity
                    onPress={handleBackToList}
                    style={styles.backBtn}
                    hitSlop={8}
                  >
                    <ChevronLeft size={18} color={theme.color.accent} />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailTitle} numberOfLines={1}>
                      {selectedItem.name}
                    </Text>
                    <View style={styles.depositDateRow}>
                      <Calendar size={11} color={theme.color.muted} />
                      <Text style={styles.depositDateText}>
                        {fmtDateTime(selectedItem.DepositDateTime)}
                      </Text>
                    </View>
                  </View>
                  <Badge
                    label={selectedItem.Status}
                    color={style.color}
                    backgroundColor={style.bg}
                  />
                </View>

                <Table<DepositPaymentRow>
                  title="Payments"
                  subtitle={`${selectedItem.payments.length} record(s)`}
                  data={selectedItem.payments}
                  columns={PAYMENT_COLUMNS}
                  keyExtractor={(r) => r.SI}
                  emptyTitle="No payments"
                  emptyMessage="This deposit has no linked payments."
                  style={{ marginTop: 12 }}
                />

                <View style={styles.metaBox}>
                  <RowItem
                    label="Date / Time"
                    value={fmtDateTime(selectedItem.DepositDateTime)}
                  />
                  <RowItem label="Amount" value={fmt$(selectedItem.Amount)} />
                  <RowItem
                    label="Account No"
                    value={selectedItem.AccountNo}
                  />
                  <RowItem
                    label="Bank Branch"
                    value={selectedItem.BankBranch}
                  />
                  <RowItem label="Bank Code" value={selectedItem.BankCode} />
                  <RowItem
                    label="Deposited By"
                    value={selectedItem.DepositedBy || "—"}
                  />
                </View>

                <View style={styles.detailActions}>
                  <AppButton size="lg" onPress={handleOpenSupplementary}>
                    Encode Supplementary
                  </AppButton>
                  <AppButton
                    variant="destructive"
                    size="lg"
                    leftIcon={<Trash2 size={15} color="#fff" />}
                    onPress={handleDelete}
                  >
                    Delete Deposit
                  </AppButton>
                </View>
              </>
            );
          })()
        )}
      </Animated.ScrollView>

      {/* Encode Supplementary sheet */}
      <SwipeDismissModal
        visible={supplementaryOpen}
        onDismiss={() => setSupplementaryOpen(false)}
        title={`Encode Supplementary — ${selectedItem?.name ?? ""}`}
        sheetWidth={460}
      >
        <View style={styles.suppBody}>
          <View style={styles.formGrid}>
            <FloatingLabelInput
              label="Deposit Date Time"
              type="datetime"
              value={fmtDateTime(suppDate.toISOString())}
              onChangeText={() => {}}
              pickerValue={suppDate}
              onChangeValue={setSuppDate}
            />
            <FloatingLabelInput
              label="Account No#"
              type="number"
              value={suppAccountNo}
              onChangeText={setSuppAccountNo}
            />
            <FloatingLabelInput
              label="Bank Branch"
              type="select"
              value={suppBankBranch}
              onChangeText={setSuppBankBranch}
              options={BANK_BRANCH_OPTIONS}
              onSelectOption={(opt) => setSuppBankBranch(opt.label)}
              selectModalTitle="Select Bank Branch"
              searchable
              searchPlaceholder="Search bank or branch…"
            />
            <FloatingLabelInput
              label="Bank Code"
              value={suppBankCode}
              onChangeText={setSuppBankCode}
            />
            <FloatingLabelInput
              label="Amount"
              type="number"
              value={suppAmount}
              onChangeText={setSuppAmount}
            />
            <FloatingLabelInput
              label="Deposited By"
              value={suppDepositedBy}
              onChangeText={setSuppDepositedBy}
            />
          </View>

          <View style={styles.suppActions}>
            <AppButton
              variant="secondary"
              size="lg"
              style={{ flex: 1 }}
              onPress={() => setSupplementaryOpen(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              size="lg"
              style={{ flex: 1 }}
              onPress={handleSaveSupplementary}
            >
              Save
            </AppButton>
          </View>
        </View>
      </SwipeDismissModal>

      {/* Delete confirmation */}
      <ConfirmModal
        visible={confirmDeleteVisible}
        onCancel={() => setConfirmDeleteVisible(false)}
        onConfirm={performDelete}
        variant="error"
        title="Delete Deposit"
        message={`Do you want to delete ${selectedItem?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
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
  content: { padding: 16, gap: 0 },

  // List header
  listHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  listHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND_COLORS.mutedBg,
  },
  listHeaderTitle: { fontSize: 16, fontWeight: "700", color: theme.color.ink },
  listHeaderSubtitle: { fontSize: 12, color: theme.color.muted, marginTop: 1 },

  // Deposit list
  depositList: { gap: 10, marginTop: 14 },
  depositCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.card,
    paddingLeft: 16,
    paddingRight: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  depositStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  depositCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  depositCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  depositIconWrap: {
    width: 30,
    height: 30,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND_COLORS.mutedBg,
  },
  depositName: { fontSize: 14, fontWeight: "700", color: theme.color.ink },
  depositDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  depositDateText: { fontSize: 11, color: theme.color.muted },
  depositChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    backgroundColor: BRAND_COLORS.subtleBg,
    maxWidth: 220,
  },
  chipText: { fontSize: 11, fontWeight: "600", color: theme.color.body },
  depositFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.border,
    paddingTop: 8,
  },
  depositFooterHint: { fontSize: 11, color: theme.color.muted },

  // Detail header
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.color.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.color.card,
  },
  detailTitle: { fontSize: 15, fontWeight: "700", color: theme.color.ink },

  // Deposit meta
  metaBox: {
    backgroundColor: BRAND_COLORS.subtleBg,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.color.border,
    paddingHorizontal: 10,
    marginTop: 12,
  },
  detailActions: { gap: 8, marginTop: 14 },

  // Encode Supplementary sheet
  suppBody: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8 },
  formGrid: { flexDirection: "column", gap: 12 },
  suppActions: { flexDirection: "row", gap: 10, marginTop: 16 },

  // Table cells
  cellStrong: { fontSize: 12, fontWeight: "700", color: theme.color.ink },
  cellBody: { fontSize: 12, color: theme.color.body },
});
