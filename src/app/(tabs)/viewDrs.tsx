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
  Card,
  ConfirmModal,
  EmptyState,
  LookupField,
  RowItem,
  SwipeDismissModal,
  Table,
  theme,
  useAlertModal,
} from "@/components/ui";
import { useScrollNav } from "@/hooks/use-scroll-nav";
import {
  DRS_ITEMS,
  drsAmount,
  drsPlanholders,
  drsTotals,
  type DrsItem,
  type DrsPaymentRow,
  type DrsStatus,
} from "@/data/drs";

// ── Static data ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<DrsStatus, { color: string; bg: string }> = {
  Pending: { color: theme.color.warning, bg: theme.color.warningBg },
  Validated: { color: theme.color.accent, bg: theme.color.successBg },
  "For Deposit": { color: theme.color.info, bg: theme.color.infoBg },
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

export default function ViewDrsScreen() {
  const scrollHandler = useScrollNav();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
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
      >
        {/* Summary stats */}
        <View style={isTablet ? styles.statsTablet : styles.statsPhone}>
          <Card
            icon={FileText}
            title="Remittance Slips"
            subtitle="Total encoded"
            style={{ flex: 1, marginBottom: 0 }}
            bodyStyle={{ paddingVertical: 12 }}
          >
            <View style={styles.statCenter}>
              <Text
                style={[styles.statCount, { color: BRAND_COLORS.primaryGreen }]}
              >
                {items.length}
              </Text>
            </View>
          </Card>
          <Card
            icon={Banknote}
            title="Total Value"
            subtitle="All slips combined"
            style={{ flex: 1, marginBottom: 0 }}
            bodyStyle={{ paddingVertical: 12 }}
          >
            <View style={styles.statCenter}>
              <Text style={styles.statAmount} numberOfLines={1}>
                {fmt$(totalAmount)}
              </Text>
            </View>
          </Card>
        </View>

        {/* New DRS action */}
        <AppButton
          variant="secondary"
          size="md"
          style={{ marginTop: 12 }}
          leftIcon={<Plus size={15} color={theme.color.accent} />}
          onPress={() => router.push("/payment" as never)}
        >
          New DRS
        </AppButton>

        {/* Search */}
        <LookupField<DrsItem>
          label="Search Remittance Slip"
          placeholder="Search by reference…"
          modalTitle="Search Remittance Slip"
          data={sortedItems}
          searchKeys={["name"]}
          value={null}
          onSelect={(item) => item && setSelected(item)}
          renderDisplay={(item) => item.name}
          renderMeta={(item) =>
            `${fmtDateStr(item.SlipDate)} · ${fmt$(drsAmount(item))}`
          }
          keyExtractor={(item) => item.id}
          style={{ marginTop: 14 }}
        />

        {/* Slip list */}
        <View style={styles.slipList}>
          {sortedItems.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No remittance slips"
              message="Encoded DRS records will appear here."
            />
          ) : (
            sortedItems.map((item) => {
              const style = STATUS_STYLES[item.Status];
              const totals = drsTotals(item);
              const planholders = drsPlanholders(item);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => setSelected(item)}
                  style={styles.slipCard}
                >
                  <View
                    style={[styles.slipStripe, { backgroundColor: style.color }]}
                  />
                  <View style={styles.slipHeader}>
                    <View style={styles.slipHeaderLeft}>
                      <View
                        style={[
                          styles.slipIconWrap,
                          { backgroundColor: style.color + "18" },
                        ]}
                      >
                        <FileText size={15} color={style.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.slipName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={styles.slipDateRow}>
                          <Calendar size={11} color={theme.color.muted} />
                          <Text style={styles.slipDateText}>
                            {fmtDateStr(item.SlipDate)}
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

                  <View style={styles.slipChips}>
                    <View style={styles.chip}>
                      <Banknote size={11} color={theme.color.body} />
                      <Text style={styles.chipText}>{fmt$(totals.amount)}</Text>
                    </View>
                    <View style={styles.chip}>
                      <Users size={11} color={theme.color.body} />
                      <Text style={styles.chipText}>
                        {planholders} planholder{planholders === 1 ? "" : "s"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.slipFooter}>
                    <Text style={styles.slipFooterHint}>
                      Tap to view details
                    </Text>
                    <ChevronRight size={14} color={theme.color.muted} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </Animated.ScrollView>

      {/* DRS detail sheet */}
      <SwipeDismissModal
        visible={selected !== null}
        onDismiss={() => setSelected(null)}
        title={selected?.name ?? "DRS Details"}
        sheetWidth={480}
      >
        {selected &&
          (() => {
            const style = STATUS_STYLES[selected.Status];
            const totals = drsTotals(selected);
            const isLatest = selected.id === latestId;
            const isOldest = selected.id === oldestId;
            return (
              <View style={styles.sheetBody}>
                <View
                  style={[
                    styles.sheetTile,
                    { backgroundColor: style.bg, borderColor: style.color + "33" },
                  ]}
                >
                  <View style={styles.sheetTileTop}>
                    <Text style={[styles.sheetTileName, { color: style.color }]}>
                      {selected.name}
                    </Text>
                    <Badge
                      label={selected.Status}
                      color={style.color}
                      backgroundColor={theme.color.card}
                    />
                  </View>
                  <View style={styles.sheetTileRow}>
                    <Calendar size={12} color={theme.color.body} />
                    <Text style={styles.sheetTileMeta}>
                      {fmtDateStr(selected.SlipDate)}
                    </Text>
                  </View>
                </View>

                <Card
                  title="Payments"
                  subtitle={`${totals.count} record(s)`}
                  icon={Receipt}
                  style={{ marginBottom: 12 }}
                >
                  <Table<DrsPaymentRow>
                    data={selected.payments}
                    columns={PAYMENT_COLUMNS}
                    keyExtractor={(r) => r.SI}
                    emptyTitle="No payments"
                    emptyMessage="This DRS has no encoded payments."
                  />
                  <View style={styles.totalsBox}>
                    <RowItem label="Total Payments" value={totals.count} />
                    <RowItem label="Total Amount" value={fmt$(totals.amount)} />
                    <RowItem
                      label="Total Commission"
                      value={fmt$(totals.commission)}
                    />
                  </View>
                </Card>

                <View style={{ gap: 8 }}>
                  {isOldest && (
                    <AppButton
                      size="lg"
                      onPress={() => handleEncodeDeposit(selected)}
                    >
                      Encode Deposit
                    </AppButton>
                  )}
                  <AppButton
                    variant="secondary"
                    size="lg"
                    onPress={() => handleAddDisbursement(selected)}
                  >
                    Add Disbursement
                  </AppButton>
                  {isLatest && (
                    <AppButton
                      variant="destructive"
                      size="lg"
                      leftIcon={<Trash2 size={15} color="#fff" />}
                      onPress={() => handleDelete(selected)}
                    >
                      Delete DRS
                    </AppButton>
                  )}
                </View>
              </View>
            );
          })()}
      </SwipeDismissModal>

      {/* Delete confirmation */}
      <ConfirmModal
        visible={confirmDeleteItem !== null}
        onCancel={() => setConfirmDeleteItem(null)}
        onConfirm={performDelete}
        variant="error"
        title="Delete DRS"
        message={`Do you want to delete ${confirmDeleteItem?.name}? This cannot be undone.`}
        cancelLabel="No"
        confirmLabel="Yes"
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

  // Summary stats
  statsTablet: { flexDirection: "row", gap: 12, alignItems: "stretch" },
  statsPhone: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  statCenter: { alignItems: "center", justifyContent: "center" },
  statCount: { fontSize: 32, fontWeight: "900", lineHeight: 38 },
  statAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.color.ink,
  },

  // Slip list
  slipList: { gap: 10, marginTop: 14 },
  slipCard: {
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
  slipHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  slipIconWrap: {
    width: 30,
    height: 30,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  slipName: { fontSize: 14, fontWeight: "700", color: theme.color.ink },
  slipDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  slipDateText: { fontSize: 11, color: theme.color.muted },
  slipChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    backgroundColor: BRAND_COLORS.subtleBg,
  },
  chipText: { fontSize: 11, fontWeight: "600", color: theme.color.body },
  slipFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.border,
    paddingTop: 8,
  },
  slipFooterHint: { fontSize: 11, color: theme.color.muted },

  // Detail sheet
  sheetBody: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8 },
  sheetTile: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  sheetTileTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sheetTileName: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  sheetTileRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sheetTileMeta: { fontSize: 12, color: theme.color.body },
  totalsBox: {
    backgroundColor: BRAND_COLORS.subtleBg,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.color.border,
    paddingHorizontal: 10,
    marginTop: 10,
  },

  // Table cells
  cellStrong: { fontSize: 12, fontWeight: "700", color: theme.color.ink },
  cellBody: { fontSize: 12, color: theme.color.body },
});
