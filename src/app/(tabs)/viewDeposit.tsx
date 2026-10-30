import {
  Banknote,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Landmark,
  LayoutList,
  Trash2,
} from "lucide-react-native";
import {
  alpha,
  BaseButton,
  BaseIconButton,
  BaseText,
  BottomSheet,
  DataTable,
  DrawerPanel,
  EmptyStateCard,
  FloatingLabelInput,
  FloatingLabelSelect,
  LookupField,
  MessageDialog,
  OSPBadge,
  RowItem,
  SectionTitle,
  Small,
  useTheme,
  useThemedStyles,
  type ColorToken,
  type DataTableProps,
  type FloatingLabelSelectOption,
  type LookupColumn,
  type OSPBadgeType,
} from "osp-ui-kit-native";
import React, { useMemo, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DateTimeField } from "@/components/DateTimeField";
import { useAlertModal } from "@/hooks/use-alert-modal";
import {
  DEPOSIT_ITEMS,
  type DepositItem,
  type DepositPaymentRow,
  type DepositStatus,
} from "@/data/deposit";

// ── Types ────────────────────────────────────────────────────────────────────

type BankBranch = { code: string; name: string; branch: string };

// Typed through the kit so the screen needs no direct @tanstack import.
type ColumnDefs<T> = DataTableProps<T>["columns"];

// ── Static data ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  DepositStatus,
  { badge: OSPBadgeType; color: ColorToken }
> = {
  Pending: { badge: "warning", color: "warning" },
  Validated: { badge: "success", color: "success" },
  "For Deposit": { badge: "info", color: "info" },
};

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

const PAYMENT_COLUMNS: ColumnDefs<DepositPaymentRow> = [
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
    accessorKey: "InstNo",
    header: "Inst. No",
    meta: { width: 60 },
    cell: ({ row }) => (
      <BaseText fontSize="xs" color="mutedStrong" textAlign="center">
        {row.original.InstNo}
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

const DEPOSIT_LOOKUP_COLUMNS: LookupColumn<DepositItem>[] = [
  { key: "name", header: "Reference" },
  {
    key: "DepositDateTime",
    header: "Date / Time",
    render: (_value, row) => fmtDateTime(row.DepositDateTime),
  },
  {
    key: "Amount",
    header: "Amount",
    render: (_value, row) => fmt$(row.Amount),
  },
  {
    key: "Status",
    header: "Status",
    render: (_value, row) => (
      <OSPBadge type={STATUS_STYLES[row.Status].badge}>{row.Status}</OSPBadge>
    ),
  },
];

// ── Edit sheet ───────────────────────────────────────────────────────────────
// Bottom sheet on phones, end-side drawer panel on tablets — the same split the
// old SwipeDismissModal made.

function EditSheet({
  open,
  onClose,
  title,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;

  if (isTablet) {
    return (
      <DrawerPanel
        open={open}
        onOpenChange={(o) => !o && onClose()}
        title={title}
        placement="end"
        size="md"
        footer={footer}
        insets={{ top: insets.top, bottom: insets.bottom }}
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
      footer={footer}
      bottomInset={insets.bottom}
    >
      {children}
    </BottomSheet>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────

type ViewMode = "list" | "detail";

export default function ViewDepositScreen() {
  const theme = useTheme();
  const styles = useThemedStyles((t) =>
    StyleSheet.create({
      content: { padding: 16, gap: 0 },

      // List header
      listHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
      listHeaderIcon: {
        width: 34,
        height: 34,
        borderRadius: t.radii.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: alpha(t.colors.mutedStrong, 0.12),
      },
      lookupWrap: { marginTop: 12 },

      // Deposit list
      depositList: { gap: 10, marginTop: 14 },
      depositCard: {
        position: "relative",
        overflow: "hidden",
        borderRadius: t.radii.card,
        borderWidth: 1,
        borderColor: t.colors.hairline,
        backgroundColor: t.colors.surface,
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
        borderRadius: t.radii.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: alpha(t.colors.mutedStrong, 0.12),
      },
      depositDateRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
      },
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
        borderRadius: t.radii.full,
        backgroundColor: t.colors.canvas,
        maxWidth: 220,
      },
      depositFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: t.colors.hairline,
        paddingTop: 8,
      },

      // Detail header
      detailHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 4,
      },
      tableWrap: { marginTop: 12 },

      // Deposit meta
      metaBox: {
        backgroundColor: t.colors.canvas,
        borderRadius: t.radii.sm,
        borderWidth: 1,
        borderColor: t.colors.hairline,
        paddingHorizontal: 10,
        marginTop: 12,
      },
      detailActions: { gap: 8, marginTop: 14 },

      // Encode Supplementary sheet
      formGrid: { flexDirection: "column", gap: 12 },
      suppActions: { flexDirection: "row", gap: 10 },
    }),
  );

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
      <View style={[styles.content, { paddingTop: 16, paddingHorizontal: 8 }]}>
        {view === "list" ? (
          <>
            {/* Header */}
            <View style={styles.listHeader}>
              <View style={styles.listHeaderIcon}>
                <LayoutList size={16} color={theme.colors.mutedStrong} />
              </View>
              <View style={{ flex: 1 }}>
                <SectionTitle>Validated Deposits</SectionTitle>
                <Small color="mutedStrong" style={{ marginTop: 1 }}>
                  {sortedItems.length} deposit(s)
                </Small>
              </View>
            </View>

            {/* Search */}
            <View style={styles.lookupWrap}>
              <LookupField<DepositItem>
                placeholder="Search by reference…"
                modalTitle="Search Deposit"
                dataSource={sortedItems}
                searchKeys={["name"]}
                columns={DEPOSIT_LOOKUP_COLUMNS}
                value={null}
                onSelect={(item) => item && handleSelectItem(item)}
                renderDisplay={(item) => item.name}
                variant="search"
              />
            </View>

            {/* Deposit list */}
            <View style={styles.depositList}>
              {sortedItems.length === 0 ? (
                <EmptyStateCard
                  icon={Banknote}
                  title="No deposits"
                  description="Validated deposits will appear here."
                />
              ) : (
                sortedItems.map((item) => {
                  const status = STATUS_STYLES[item.Status];
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectItem(item)}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.depositCard,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <View
                        style={[
                          styles.depositStripe,
                          { backgroundColor: theme.colors[status.color] },
                        ]}
                      />
                      <View style={styles.depositCardHeader}>
                        <View style={styles.depositCardHeaderLeft}>
                          <View style={styles.depositIconWrap}>
                            <Banknote
                              size={16}
                              color={theme.colors.mutedStrong}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <BaseText
                              fontSize="sm"
                              fontWeight="bold"
                              color="heading"
                              numberOfLines={1}
                            >
                              {item.name}
                            </BaseText>
                            <View style={styles.depositDateRow}>
                              <Calendar size={11} color={theme.colors.muted} />
                              <Small color="muted">
                                {fmtDateTime(item.DepositDateTime)}
                              </Small>
                            </View>
                          </View>
                        </View>
                        <OSPBadge type={status.badge}>{item.Status}</OSPBadge>
                      </View>

                      <View style={styles.depositChips}>
                        <View style={styles.chip}>
                          <Banknote size={11} color={theme.colors.mutedStrong} />
                          <Small fontWeight="semibold" color="mutedStrong">
                            {fmt$(item.Amount)}
                          </Small>
                        </View>
                        {item.BankBranch ? (
                          <View style={styles.chip}>
                            <Landmark
                              size={11}
                              color={theme.colors.mutedStrong}
                            />
                            <Small
                              fontWeight="semibold"
                              color="mutedStrong"
                              numberOfLines={1}
                            >
                              {item.BankBranch}
                            </Small>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.depositFooter}>
                        <Small color="muted">Tap to view details</Small>
                        <ChevronRight size={14} color={theme.colors.muted} />
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </>
        ) : !selectedItem ? (
          <EmptyStateCard
            icon={Banknote}
            title="No Deposit Selected"
            description="Select a deposit from the list to view details"
          />
        ) : (
          (() => {
            const status = STATUS_STYLES[selectedItem.Status];
            return (
              <>
                {/* Detail header */}
                <View style={styles.detailHeader}>
                  <BaseIconButton
                    icon={ChevronLeft}
                    accessibilityLabel="Back to deposit list"
                    variant="outline"
                    size="sm"
                    rounded="full"
                    hitSlop={8}
                    onPress={handleBackToList}
                  />
                  <View style={{ flex: 1 }}>
                    <SectionTitle numberOfLines={1}>
                      {selectedItem.name}
                    </SectionTitle>
                    <View style={styles.depositDateRow}>
                      <Calendar size={11} color={theme.colors.muted} />
                      <Small color="muted">
                        {fmtDateTime(selectedItem.DepositDateTime)}
                      </Small>
                    </View>
                  </View>
                  <OSPBadge type={status.badge}>{selectedItem.Status}</OSPBadge>
                </View>

                <View style={styles.tableWrap}>
                  <DataTable<DepositPaymentRow>
                    title="Payments"
                    description={`${selectedItem.payments.length} record(s)`}
                    data={selectedItem.payments}
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
                        description="This deposit has no linked payments."
                      />
                    }
                    mobileConfig={{
                      viewMode: "card",
                      primaryField: "Name",
                      titleTransform: "none",
                      secondaryField: "SI",
                      visibleFields: ["InstNo", "PayClass", "SIAmount"],
                      labelMap: {
                        InstNo: "Inst. No",
                        PayClass: "Class",
                        SIAmount: "Amount",
                      },
                      valueFormatter: {
                        SIAmount: (v) => fmt$(Number(v) || 0),
                      },
                    }}
                  />
                </View>

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
                  <BaseButton
                    size="lg"
                    fullWidth
                    onPress={handleOpenSupplementary}
                  >
                    Encode Supplementary
                  </BaseButton>
                  <BaseButton
                    tone="danger"
                    size="lg"
                    fullWidth
                    leftIcon={Trash2}
                    onPress={handleDelete}
                  >
                    Delete Deposit
                  </BaseButton>
                </View>
              </>
            );
          })()
        )}
      </View>

      {/* Encode Supplementary sheet */}
      <EditSheet
        open={supplementaryOpen}
        onClose={() => setSupplementaryOpen(false)}
        title={`Encode Supplementary — ${selectedItem?.name ?? ""}`}
        footer={
          <View style={styles.suppActions}>
            <BaseButton
              variant="outline"
              size="lg"
              style={{ flex: 1 }}
              onPress={() => setSupplementaryOpen(false)}
            >
              Cancel
            </BaseButton>
            <BaseButton
              size="lg"
              style={{ flex: 1 }}
              onPress={handleSaveSupplementary}
            >
              Save
            </BaseButton>
          </View>
        }
      >
        <View style={styles.formGrid}>
          <DateTimeField
            label="Deposit Date Time"
            mode="datetime"
            value={suppDate}
            onChange={setSuppDate}
          />
          <FloatingLabelInput
            label="Account No#"
            type="number"
            value={suppAccountNo}
            onValueChange={setSuppAccountNo}
          />
          <FloatingLabelSelect
            label="Bank Branch"
            value={suppBankBranch}
            onValueChange={setSuppBankBranch}
            options={BANK_BRANCH_OPTIONS}
          />
          <FloatingLabelInput
            label="Bank Code"
            value={suppBankCode}
            onValueChange={setSuppBankCode}
          />
          <FloatingLabelInput
            label="Amount"
            type="number"
            value={suppAmount}
            onValueChange={setSuppAmount}
          />
          <FloatingLabelInput
            label="Deposited By"
            value={suppDepositedBy}
            onValueChange={setSuppDepositedBy}
          />
        </View>
      </EditSheet>

      {/* Delete confirmation */}
      <MessageDialog
        open={confirmDeleteVisible}
        onOpenChange={(o) => !o && setConfirmDeleteVisible(false)}
        onConfirm={performDelete}
        variant="confirmation"
        title="Delete Deposit"
        message={`Do you want to delete ${selectedItem?.name}? This cannot be undone.`}
        confirmText="Delete"
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
