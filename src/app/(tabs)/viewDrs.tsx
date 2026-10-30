import { useRouter } from "expo-router";
import {
  Banknote,
  Calendar,
  ChevronRight,
  FileText,
  Plus,
  Receipt,
  Trash2,
  Users,
} from "lucide-react-native";
import {
  alpha,
  BaseButton,
  BaseText,
  BottomSheet,
  Card,
  DataTable,
  DrawerPanel,
  EmptyStateCard,
  LookupField,
  MessageDialog,
  MetricCard,
  OSPBadge,
  RowItem,
  SectionTitle,
  Small,
  useTheme,
  useThemedStyles,
  type ColorToken,
  type DataTableProps,
  type IconComponent,
  type LookupColumn,
  type OSPBadgeType,
} from "osp-ui-kit-native";
import React, { useMemo, useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DRS_ITEMS,
  drsAmount,
  drsPlanholders,
  drsTotals,
  type DrsItem,
  type DrsPaymentRow,
  type DrsStatus,
} from "@/data/drs";
import { useAlertModal } from "@/hooks/use-alert-modal";

// ── Types ────────────────────────────────────────────────────────────────────

// `@tanstack/react-table`'s ColumnDef, taken from the kit's DataTable props
// (the package is a kit dependency, not a direct app dependency).
type ColumnDef<T> = DataTableProps<T>["columns"][number];

// ── Static data ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  DrsStatus,
  { badge: OSPBadgeType; color: ColorToken; bg: ColorToken; fg: ColorToken }
> = {
  Pending: { badge: "warning", color: "warning", bg: "warningTint", fg: "warningFg" },
  Validated: { badge: "success", color: "success", bg: "successTint", fg: "successFg" },
  "For Deposit": { badge: "info", color: "info", bg: "infoTint", fg: "infoFg" },
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

function fmtDateStr(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Column definitions ───────────────────────────────────────────────────────

const PAYMENT_COLUMNS: ColumnDef<DrsPaymentRow>[] = [
  {
    accessorKey: "SI",
    header: "SI No.",
    meta: { width: 88 },
    cell: ({ row }) => (
      <BaseText fontSize="xs" fontWeight="bold" color="heading">
        {row.original.SI}
      </BaseText>
    ),
  },
  {
    accessorKey: "Name",
    header: "Name",
    meta: { width: 140 },
    cell: ({ row }) => (
      <BaseText fontSize="xs" numberOfLines={2}>
        {row.original.Name}
      </BaseText>
    ),
  },
  {
    accessorKey: "InstNo",
    header: "Inst. No",
    meta: { width: 60 },
    cell: ({ row }) => (
      <BaseText fontSize="xs" textAlign="center">
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
];

const LOOKUP_COLUMNS: LookupColumn<DrsItem>[] = [
  { key: "name", header: "Reference" },
  {
    key: "SlipDate",
    header: "Slip Date",
    render: (_, row) => fmtDateStr(row.SlipDate),
  },
  {
    key: "Status",
    header: "Status",
    render: (_, row) => (
      <OSPBadge type={STATUS_STYLES[row.Status].badge}>{row.Status}</OSPBadge>
    ),
  },
  {
    key: "payments",
    header: "Amount",
    enableSorting: false,
    render: (_, row) => fmt$(drsAmount(row)),
  },
];

// ── Detail sheet (bottom sheet on phone, side panel on tablet+) ─────────────

function DetailSheet({
  open,
  onClose,
  title,
  isTablet,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  isTablet: boolean;
  footer?: ReactNode;
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

// ── Section card (Card with an icon + title header row) ─────────────────────

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: IconComponent;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Card.Root style={{ padding: 16 }}>
      <Card.MainContent>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: theme.radii.pill,
              backgroundColor: alpha(theme.colors.primary, 0.12),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={14} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <SectionTitle>{title}</SectionTitle>
            {subtitle ? <Small color="mutedStrong">{subtitle}</Small> : null}
          </View>
        </View>
        {children}
      </Card.MainContent>
    </Card.Root>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────

export default function ViewDrsScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isWide = width >= 1024;
  const router = useRouter();

  const [items, setItems] = useState<DrsItem[]>(DRS_ITEMS);
  const [selected, setSelected] = useState<DrsItem | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<DrsItem | null>(
    null,
  );
  const { alertState, showAlert, dismissAlert } = useAlertModal();

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => Number(b.id) - Number(a.id)),
    [items],
  );
  // Newest-first order: the first (index 0) is the last-created DRS, the
  // only one eligible for deletion; the last (oldest) is the only one
  // eligible for deposit encoding.
  const latestId = sortedItems[0]?.id;
  const oldestId = sortedItems[sortedItems.length - 1]?.id;
  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + drsAmount(item), 0),
    [items],
  );

  function handleDelete(item: DrsItem) {
    setConfirmDeleteItem(item);
  }

  function performDelete() {
    if (!confirmDeleteItem) return;
    setItems((prev) => prev.filter((x) => x.id !== confirmDeleteItem.id));
    setSelected(null);
    setConfirmDeleteItem(null);
  }

  function handleEncodeDeposit(item: DrsItem) {
    if (item.id !== oldestId) {
      showAlert("warning", "Encode Deposit", "Please encode the oldest DRS first.");
      return;
    }
    setSelected(null);
    router.push({
      pathname: "/encodeDeposit" as never,
      params: { drs: JSON.stringify(item) },
    });
  }

  function handleAddDisbursement(item: DrsItem) {
    setSelected(null);
    router.push({
      pathname: "/disbursement" as never,
      params: { drs: JSON.stringify(item) },
    });
  }

  return (
    <>
      <View style={styles.content}>
        {/* Summary stats */}
        <View style={isTablet ? styles.statsTablet : styles.statsPhone}>
          <MetricCard
            icon={FileText}
            label="Remittance Slips"
            subtitle="| Total encoded"
            value={String(items.length)}
            accent="primary"
            style={isTablet ? { flex: 1 } : undefined}
          />
          <MetricCard
            icon={Banknote}
            label="Total Value"
            subtitle="| All slips combined"
            value={fmt$(totalAmount)}
            accent="success"
            style={isTablet ? { flex: 1 } : undefined}
          />
        </View>

        {/* New DRS action */}
        <BaseButton
          variant="outline"
          size="md"
          fullWidth
          style={{ marginTop: 12 }}
          leftIcon={Plus}
          onPress={() => router.push("/payment" as never)}
        >
          New DRS
        </BaseButton>

        {/* Search */}
        <View style={{ marginTop: 14 }}>
          <LookupField<DrsItem>
            label="Search Remittance Slip"
            placeholder="Search by reference…"
            modalTitle="Search Remittance Slip"
            dataSource={sortedItems}
            searchKeys={["name"]}
            columns={LOOKUP_COLUMNS}
            value={null}
            onSelect={(item) => item && setSelected(item)}
            renderDisplay={(item) => item.name}
            variant="search"
          />
        </View>

        {/* Slip list */}
        <View style={styles.slipList}>
          {sortedItems.length === 0 ? (
            <EmptyStateCard
              icon={FileText}
              title="No remittance slips"
              description="Encoded DRS records will appear here."
            />
          ) : (
            sortedItems.map((item) => {
              const status = STATUS_STYLES[item.Status];
              const statusColor = theme.colors[status.color];
              const totals = drsTotals(item);
              const planholders = drsPlanholders(item);
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => setSelected(item)}
                  style={({ pressed }) => [
                    styles.slipCard,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View
                    style={[styles.slipStripe, { backgroundColor: statusColor }]}
                  />
                  <View style={styles.slipHeader}>
                    <View style={styles.slipHeaderLeft}>
                      <View
                        style={[
                          styles.slipIconWrap,
                          { backgroundColor: alpha(statusColor, 0.12) },
                        ]}
                      >
                        <FileText size={15} color={statusColor} />
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
                        <View style={styles.slipDateRow}>
                          <Calendar size={11} color={theme.colors.muted} />
                          <Small color="muted">
                            {fmtDateStr(item.SlipDate)}
                          </Small>
                        </View>
                      </View>
                    </View>
                    <OSPBadge type={status.badge}>{item.Status}</OSPBadge>
                  </View>

                  <View style={styles.slipChips}>
                    <View style={styles.chip}>
                      <Banknote size={11} color={theme.colors.mutedStrong} />
                      <Small fontWeight="semibold" color="mutedStrong">
                        {fmt$(totals.amount)}
                      </Small>
                    </View>
                    <View style={styles.chip}>
                      <Users size={11} color={theme.colors.mutedStrong} />
                      <Small fontWeight="semibold" color="mutedStrong">
                        {planholders} planholder{planholders === 1 ? "" : "s"}
                      </Small>
                    </View>
                  </View>

                  <View style={styles.slipFooter}>
                    <Small color="muted">Tap to view details</Small>
                    <ChevronRight size={14} color={theme.colors.muted} />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </View>

      {/* DRS detail sheet */}
      <DetailSheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "DRS Details"}
        isTablet={isWide}
        footer={
          selected ? (
            <View style={{ gap: 8 }}>
              {selected.id === oldestId && (
                <BaseButton
                  size="lg"
                  fullWidth
                  onPress={() => handleEncodeDeposit(selected)}
                >
                  Encode Deposit
                </BaseButton>
              )}
              <BaseButton
                variant="outline"
                size="lg"
                fullWidth
                onPress={() => handleAddDisbursement(selected)}
              >
                Add Disbursement
              </BaseButton>
              {selected.id === latestId && (
                <BaseButton
                  tone="danger"
                  size="lg"
                  fullWidth
                  leftIcon={Trash2}
                  onPress={() => handleDelete(selected)}
                >
                  Delete DRS
                </BaseButton>
              )}
            </View>
          ) : undefined
        }
      >
        {selected &&
          (() => {
            const status = STATUS_STYLES[selected.Status];
            const totals = drsTotals(selected);
            return (
              <>
                <View
                  style={[
                    styles.sheetTile,
                    {
                      backgroundColor: theme.colors[status.bg],
                      borderColor: alpha(theme.colors[status.color], 0.2),
                    },
                  ]}
                >
                  <View style={styles.sheetTileTop}>
                    <BaseText
                      fontSize="md"
                      fontWeight="extrabold"
                      color={status.fg}
                      style={{ letterSpacing: 0.2 }}
                    >
                      {selected.name}
                    </BaseText>
                    <OSPBadge type={status.badge}>{selected.Status}</OSPBadge>
                  </View>
                  <View style={styles.sheetTileRow}>
                    <Calendar size={12} color={theme.colors.mutedStrong} />
                    <Small color="mutedStrong">
                      {fmtDateStr(selected.SlipDate)}
                    </Small>
                  </View>
                </View>

                <SectionCard
                  title="Payments"
                  subtitle={`${totals.count} record(s)`}
                  icon={Receipt}
                >
                  <DataTable<DrsPaymentRow>
                    data={selected.payments}
                    columns={PAYMENT_COLUMNS}
                    getRowId={(r) => r.SI}
                    features={{
                      search: false,
                      sorting: false,
                      pagination: false,
                      columnToggle: false,
                      filtering: false,
                      selection: false,
                      detailSidebar: false,
                    }}
                    emptyState="This DRS has no encoded payments."
                    mobileConfig={{
                      viewMode: "card",
                      primaryField: "Name",
                      titleTransform: "none",
                      secondaryField: "SI",
                      badgeField: "PayClass",
                      visibleFields: ["InstNo", "SIAmount"],
                      labelMap: {
                        SI: "SI No.",
                        InstNo: "Inst. No",
                        SIAmount: "Amount",
                      },
                      valueFormatter: {
                        SIAmount: (v) => fmt$(Number(v)),
                      },
                    }}
                  />
                  <View style={styles.totalsBox}>
                    <RowItem label="Total Payments" value={totals.count} />
                    <RowItem label="Total Amount" value={fmt$(totals.amount)} />
                    <RowItem
                      label="Total Commission"
                      value={fmt$(totals.commission)}
                    />
                  </View>
                </SectionCard>
              </>
            );
          })()}
      </DetailSheet>

      {/* Delete confirmation */}
      <MessageDialog
        open={confirmDeleteItem !== null}
        onOpenChange={(o) => !o && setConfirmDeleteItem(null)}
        onConfirm={performDelete}
        variant="confirmation"
        title="Delete DRS"
        message={`Do you want to delete ${confirmDeleteItem?.name}? This cannot be undone.`}
        cancelText="No"
        confirmText="Yes"
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

// ── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (t: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    content: { paddingVertical: 8 },

    // Summary stats
    statsTablet: { flexDirection: "row", gap: 12, alignItems: "stretch" },
    statsPhone: { gap: 10 },

    // Slip list
    slipList: { gap: 10, marginTop: 14 },
    slipCard: {
      position: "relative",
      overflow: "hidden",
      borderRadius: t.radii.card,
      backgroundColor: t.colors.surface,
      boxShadow: t.shadows.card,
      paddingLeft: 16,
      paddingRight: 14,
      paddingTop: 12,
      paddingBottom: 10,
    },
    slipStripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
    },
    slipHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 8,
    },
    slipHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    slipIconWrap: {
      width: 30,
      height: 30,
      borderRadius: t.radii.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    slipDateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    slipChips: {
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
      borderRadius: t.radii.pill,
      backgroundColor: t.colors.canvas,
    },
    slipFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.hairline,
      paddingTop: 8,
    },

    // Detail sheet
    sheetTile: {
      borderRadius: t.radii.card,
      borderWidth: 1,
      padding: 14,
    },
    sheetTileTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    sheetTileRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    totalsBox: {
      backgroundColor: t.colors.canvas,
      borderRadius: t.radii.sm,
      borderWidth: 1,
      borderColor: t.colors.hairline,
      paddingHorizontal: 10,
      marginTop: 10,
    },
  });
