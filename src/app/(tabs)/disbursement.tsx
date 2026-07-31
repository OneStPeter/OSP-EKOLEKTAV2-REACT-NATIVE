import { useLocalSearchParams } from "expo-router";
import {
  ArrowLeftRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  FileText,
  Plus,
  TriangleAlert,
  Wallet,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BOTTOM_NAV_HEIGHT } from "@/components/navigation/BottomNavBar";
import type { PillSelectOption, StepperStep } from "@/components/ui";
import {
  AlertModal,
  AppButton,
  AppCaption,
  Badge,
  BRAND_COLORS,
  Card,
  Checkbox,
  ConfirmModal,
  EmptyState,
  LookupField,
  PillSelect,
  RowItem,
  SectionHeader,
  Stepper,
  theme,
  useAlertModal,
} from "@/components/ui";
import {
  DRS_ITEMS,
  drsAmount,
  type DrsItem,
  type DrsPaymentRow,
} from "@/data/drs";
import { useScrollNav } from "@/hooks/use-scroll-nav";

// ── Types ────────────────────────────────────────────────────────────────────

type DisbursementType = "COM" | "TE";

/** A single releasable claim derived from one DRS payment row. */
type ReleaseRecord = {
  key: string;
  SI: string;
  Name: string;
  InstNo: number;
  PayClass: string;
  type: DisbursementType;
  /** Full claimable amount — the ceiling for the released amount. */
  amount: number;
};

/** A release record added to the disbursement list. Claims are released in
 *  full — the amount is fixed at the claimable amount, not editable. */
type DisbursementItem = ReleaseRecord & { release: number };

// ── Static data ─────────────────────────────────────────────────────────────

const DISBURSEMENT_STEPS: StepperStep[] = [
  { label: "Select DRS", icon: FileText },
  { label: "Disburse", icon: ClipboardList },
  { label: "Release", icon: Wallet },
];

const TYPE_LABEL: Record<DisbursementType, string> = {
  COM: "Commission",
  TE: "Transportation",
};

const DRS_STEP = 0;
const RECORDS_STEP = 1;
const REVIEW_STEP = 2;

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

function claimAmount(row: DrsPaymentRow, type: DisbursementType) {
  return type === "COM" ? row.Commission : row.TransportationExpense;
}

/** Every claim of `type` inside a DRS, skipping rows with nothing to release. */
function releaseRecords(
  item: DrsItem | null,
  type: DisbursementType,
): ReleaseRecord[] {
  if (!item) return [];
  return item.payments
    .map((p) => ({
      key: `${p.SI}-${type}`,
      SI: p.SI,
      Name: p.Name,
      InstNo: p.InstNo,
      PayClass: p.PayClass,
      type,
      amount: claimAmount(p, type),
    }))
    .filter((r) => r.amount > 0);
}

// ── Screen ──────────────────────────────────────────────────────────────────

export default function DisbursementScreen() {
  const scrollHandler = useScrollNav();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { drs } = useLocalSearchParams<{ drs?: string }>();

  const [currentStep, setCurrentStep] = useState(DRS_STEP);
  const [selectedDrs, setSelectedDrs] = useState<DrsItem | null>(null);
  const [selectedType, setSelectedType] = useState<DisbursementType | "">("");
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [addedItems, setAddedItems] = useState<DisbursementItem[]>([]);
  const [confirmReleaseVisible, setConfirmReleaseVisible] = useState(false);

  const { alertState, showAlert, dismissAlert } = useAlertModal();

  // The tab screen stays mounted across navigations (lazy: false), so a DRS
  // handed off from viewDrs can arrive on an already-mounted instance.
  useEffect(() => {
    if (!drs) return;
    try {
      setSelectedDrs(JSON.parse(drs) as DrsItem);
      setSelectedType("");
      setCheckedKeys([]);
      setAddedItems([]);
      setCurrentStep(RECORDS_STEP);
    } catch {
      // ignore malformed param
    }
  }, [drs]);

  const sortedDrs = useMemo(
    () => [...DRS_ITEMS].sort((a, b) => Number(b.id) - Number(a.id)),
    [],
  );

  const addedKeys = useMemo(
    () => new Set(addedItems.map((i) => i.key)),
    [addedItems],
  );

  /** Claims of the active type that are not in the list yet. */
  const eligible = useMemo(() => {
    if (!selectedDrs || !selectedType) return [];
    return releaseRecords(selectedDrs, selectedType).filter(
      (r) => !addedKeys.has(r.key),
    );
  }, [selectedDrs, selectedType, addedKeys]);

  const typeOptions: PillSelectOption[] = useMemo(
    () =>
      (["COM", "TE"] as DisbursementType[]).map((type) => {
        const count = releaseRecords(selectedDrs, type).filter(
          (r) => !addedKeys.has(r.key),
        ).length;
        return { value: type, label: `${TYPE_LABEL[type]} (${count})` };
      }),
    [selectedDrs, addedKeys],
  );

  const checked = useMemo(() => new Set(checkedKeys), [checkedKeys]);
  const allChecked =
    eligible.length > 0 && eligible.every((r) => checked.has(r.key));
  const someChecked = !allChecked && eligible.some((r) => checked.has(r.key));
  const checkedRecords = eligible.filter((r) => checked.has(r.key));
  const checkedTotal = checkedRecords.reduce((sum, r) => sum + r.amount, 0);

  const totals = useMemo(() => {
    const com = addedItems
      .filter((i) => i.type === "COM")
      .reduce((sum, i) => sum + i.release, 0);
    const te = addedItems
      .filter((i) => i.type === "TE")
      .reduce((sum, i) => sum + i.release, 0);
    const balance = selectedDrs ? drsAmount(selectedDrs) : 0;
    const disburse = com + te;
    return { com, te, balance, disburse, remaining: balance - disburse };
  }, [addedItems, selectedDrs]);

  const over = totals.remaining < 0;
  const canRelease = addedItems.length > 0 && !over;
  const allocatedPct =
    totals.balance > 0
      ? Math.min(100, Math.round((totals.disburse / totals.balance) * 100))
      : 0;

  function resetWorkflow() {
    setSelectedType("");
    setCheckedKeys([]);
    setAddedItems([]);
  }

  function handleSelectDrs(item: DrsItem | null) {
    if (!item) {
      setSelectedDrs(null);
      resetWorkflow();
      return;
    }
    if (item.id !== selectedDrs?.id) {
      setSelectedDrs(item);
      resetWorkflow();
    }
    setCurrentStep(RECORDS_STEP);
  }

  function handleSelectType(value: string) {
    setSelectedType(value as DisbursementType);
    setCheckedKeys([]);
  }

  function toggleCheck(key: string) {
    setCheckedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function toggleCheckAll() {
    setCheckedKeys(allChecked ? [] : eligible.map((r) => r.key));
  }

  function handleAddToList() {
    if (checkedRecords.length === 0) return;
    setAddedItems((prev) => [
      ...prev,
      ...checkedRecords.map((r) => ({ ...r, release: r.amount })),
    ]);
    setCheckedKeys([]);
  }

  function handleRemoveItem(key: string) {
    setAddedItems((prev) => prev.filter((i) => i.key !== key));
  }

  function handleBack() {
    setCurrentStep((step) => Math.max(DRS_STEP, step - 1));
  }

  function handleNext() {
    handleStepPress(currentStep + 1);
  }

  function handleStepPress(index: number) {
    if (index > REVIEW_STEP) return;
    if (index > DRS_STEP && !selectedDrs) {
      showAlert(
        "warning",
        "No DRS Selected",
        "Select a Digital Remittance Slip before disbursing.",
      );
      return;
    }
    if (index === REVIEW_STEP && addedItems.length === 0) {
      showAlert(
        "warning",
        "Nothing to Release",
        "Add at least one record to the disbursement list first.",
      );
      return;
    }
    setCurrentStep(index);
  }

  function handleRelease() {
    if (over) {
      showAlert(
        "warning",
        "Over Balance",
        `The selected amount exceeds the available balance by ${fmt$(
          Math.abs(totals.remaining),
        )}.`,
      );
      return;
    }
    if (addedItems.length === 0) {
      showAlert(
        "warning",
        "Nothing to Release",
        "Add at least one record to release.",
      );
      return;
    }
    setConfirmReleaseVisible(true);
  }

  function performRelease() {
    setConfirmReleaseVisible(false);

    const count = addedItems.length;
    const amount = totals.disburse;
    const drsName = selectedDrs?.name ?? "";

    showAlert(
      "success",
      "Released Successfully",
      `${count} record(s) totalling ${fmt$(amount)} disbursed from ${drsName}.`,
      () => {
        resetWorkflow();
        setSelectedDrs(null);
        setCurrentStep(DRS_STEP);
      },
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
        <Stepper
          steps={DISBURSEMENT_STEPS}
          currentStep={currentStep}
          onStepPress={handleStepPress}
          style={{ marginBottom: 4 }}
        />

        {/* ── Step 1: pick the remittance slip to release against ── */}
        {currentStep === DRS_STEP && (
          <>
            <LookupField<DrsItem>
              label="Digital Remittance Slip"
              placeholder="Search by reference…"
              modalTitle="Search Remittance Slip"
              data={sortedDrs}
              searchKeys={["name"]}
              value={null}
              onSelect={handleSelectDrs}
              renderDisplay={(item) => item.name}
              renderMeta={(item) =>
                `${fmtDateStr(item.SlipDate)} · ${fmt$(drsAmount(item))}`
              }
              keyExtractor={(item) => item.id}
            />

            <SectionHeader
              title="Available Slips"
              subtitle="Select the slip you are releasing from"
              style={{ marginTop: 14, marginBottom: 0 }}
            />

            <View style={styles.slipList}>
              {sortedDrs.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No remittance slips"
                  message="Encoded DRS records will appear here."
                />
              ) : (
                sortedDrs.map((item) => {
                  const isSelected = selectedDrs?.id === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      onPress={() => handleSelectDrs(item)}
                      style={[
                        styles.slipCard,
                        isSelected && styles.slipCardSelected,
                      ]}
                    >
                      <View style={styles.slipHeader}>
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
                        <View style={{ alignItems: "flex-end" }}>
                          <AppCaption>Available balance</AppCaption>
                          <Text style={styles.slipAmount}>
                            {fmt$(drsAmount(item))}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}

        {/* ── Step 2: pick the claims to disburse ── */}
        {currentStep === RECORDS_STEP && (
          <Card
            icon={ClipboardList}
            title={selectedDrs?.name ?? "Disbursement"}
            subtitle="Subject for release"
            headerAction={
              <TouchableOpacity
                onPress={() => setCurrentStep(DRS_STEP)}
                style={styles.iconBtn}
                hitSlop={8}
              >
                <ArrowLeftRight size={15} color={theme.color.accent} />
              </TouchableOpacity>
            }
          >
            {!selectedDrs ? (
              <EmptyState
                icon={FileText}
                title="No DRS Selected"
                message="Go back and select a Digital Remittance Slip first."
              />
            ) : (
              <>
                <View style={styles.balanceStrip}>
                  <AppCaption>Available balance</AppCaption>
                  <Text style={styles.balanceStripValue}>
                    {fmt$(totals.balance)}
                  </Text>
                </View>

                <PillSelect
                  label="Disbursement Type"
                  options={typeOptions}
                  value={selectedType}
                  onChange={handleSelectType}
                  style={{ marginTop: 12 }}
                />

                {!selectedType ? (
                  <EmptyState
                    icon={Filter}
                    title="Choose a type"
                    message="Pick Commission or Transportation to load the eligible records."
                  />
                ) : eligible.length === 0 ? (
                  <EmptyState
                    icon={ClipboardList}
                    title="Nothing left to add"
                    message={`All ${TYPE_LABEL[selectedType].toLowerCase()} records for this slip are already in your list.`}
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.selectAllRow}
                      activeOpacity={0.75}
                      onPress={toggleCheckAll}
                    >
                      <Checkbox
                        checked={allChecked}
                        indeterminate={someChecked}
                        size={16}
                      />
                      <Text style={styles.selectAllText}>
                        {allChecked ? "Clear all" : "Select all"}
                      </Text>
                      <View style={{ flex: 1 }} />
                      <Text style={styles.selectAllCount}>
                        {eligible.length} record(s)
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.recordList}>
                      {eligible.map((r) => {
                        const on = checked.has(r.key);
                        return (
                          <TouchableOpacity
                            key={r.key}
                            activeOpacity={0.8}
                            onPress={() => toggleCheck(r.key)}
                            style={[
                              styles.recordCard,
                              on && styles.recordCardSelected,
                            ]}
                          >
                            <Checkbox checked={on} />
                            <View style={{ flex: 1 }}>
                              <View style={styles.recordTopRow}>
                                <Text
                                  style={styles.recordName}
                                  numberOfLines={1}
                                >
                                  {r.Name}
                                </Text>
                                <Text style={styles.recordAmount}>
                                  {fmt$(r.amount)}
                                </Text>
                              </View>
                              <Text style={styles.recordMeta}>
                                SI {r.SI} · Inst. {r.InstNo}
                              </Text>
                              <View style={styles.recordBadges}>
                                <Badge
                                  label={TYPE_LABEL[r.type]}
                                  color={
                                    r.type === "COM"
                                      ? theme.color.accent
                                      : theme.color.info
                                  }
                                  backgroundColor={
                                    r.type === "COM"
                                      ? theme.color.successBg
                                      : theme.color.infoBg
                                  }
                                />
                                <Badge
                                  label={r.PayClass}
                                  color={theme.color.body}
                                  backgroundColor={BRAND_COLORS.mutedBg}
                                />
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <AppButton
                      size="lg"
                      style={{ marginTop: 14 }}
                      disabled={checkedRecords.length === 0}
                      leftIcon={<Plus size={15} color="#fff" />}
                      onPress={handleAddToList}
                    >
                      {checkedRecords.length === 0
                        ? "Select records to add"
                        : `Add ${checkedRecords.length} · ${fmt$(checkedTotal)}`}
                    </AppButton>
                  </>
                )}

                {addedItems.length > 0 && (
                  <TouchableOpacity
                    style={styles.listSummary}
                    activeOpacity={0.8}
                    onPress={() => setCurrentStep(REVIEW_STEP)}
                  >
                    <Wallet size={14} color={theme.color.accent} />
                    <Text style={styles.listSummaryText}>
                      {addedItems.length} in list · {fmt$(totals.disburse)}
                    </Text>
                    <View style={{ flex: 1 }} />
                    <Text
                      style={[
                        styles.listSummaryRemaining,
                        over && { color: theme.color.error },
                      ]}
                    >
                      {fmt$(totals.remaining)} left
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Card>
        )}

        {/* ── Step 3: review the amounts and release ── */}
        {currentStep === REVIEW_STEP && (
          <Card
            icon={Wallet}
            title="Review & Release"
            subtitle={selectedDrs?.name ?? "—"}
          >
            {addedItems.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No records added"
                message="Go back and add at least one record to release."
              />
            ) : (
              <>
                <View style={styles.balanceCard}>
                  <View style={styles.balanceCardTop}>
                    <AppCaption color="accent">Available balance</AppCaption>
                    <Text style={styles.balanceCardValue}>
                      {fmt$(totals.balance)}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${allocatedPct}%`,
                          backgroundColor: over
                            ? theme.color.error
                            : allocatedPct >= 90
                              ? theme.color.warning
                              : BRAND_COLORS.primaryGreen,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.balanceCardBottom}>
                    <Text style={styles.balanceCardMeta}>
                      {allocatedPct}% allocated
                    </Text>
                    <Text
                      style={[
                        styles.balanceCardMeta,
                        over && {
                          color: theme.color.error,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {over
                        ? `Over by ${fmt$(Math.abs(totals.remaining))}`
                        : `${fmt$(totals.remaining)} left`}
                    </Text>
                  </View>
                </View>

                <View style={styles.totalsBox}>
                  <RowItem label="Commission" value={fmt$(totals.com)} />
                  <RowItem label="Transportation" value={fmt$(totals.te)} />
                  <RowItem
                    label="Total to Disburse"
                    value={fmt$(totals.disburse)}
                  />
                </View>

                <SectionHeader
                  title="Records to Release"
                  subtitle={`${addedItems.length} record(s)`}
                  style={{ marginTop: 14 }}
                />

                <View style={styles.recordList}>
                  {addedItems.map((item) => (
                    <View key={item.key} style={styles.addedCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recordName} numberOfLines={1}>
                          {item.Name}
                        </Text>
                        <Text style={styles.recordMeta}>
                          SI {item.SI} · Inst. {item.InstNo}
                        </Text>
                        <View style={styles.recordBadges}>
                          <Badge
                            label={TYPE_LABEL[item.type]}
                            color={
                              item.type === "COM"
                                ? theme.color.accent
                                : theme.color.info
                            }
                            backgroundColor={
                              item.type === "COM"
                                ? theme.color.successBg
                                : theme.color.infoBg
                            }
                          />
                        </View>
                      </View>

                      <View style={{ alignItems: "flex-end", gap: 6 }}>
                        <Text style={styles.addedAmount}>
                          {fmt$(item.release)}
                        </Text>
                        <AppButton
                          variant="destructive"
                          size="sm"
                          onPress={() => handleRemoveItem(item.key)}
                        >
                          Remove
                        </AppButton>
                      </View>
                    </View>
                  ))}
                </View>

                {over && (
                  <View style={styles.warnRow}>
                    <TriangleAlert size={14} color={theme.color.error} />
                    <Text style={styles.warnText}>
                      Exceeds balance by {fmt$(Math.abs(totals.remaining))}
                    </Text>
                  </View>
                )}

              </>
            )}
          </Card>
        )}

        {/* Wizard navigation — Next validates the step it is moving into */}
        <View style={styles.stepNav}>
          <AppButton
            variant="secondary"
            size="lg"
            style={{ flex: 1 }}
            disabled={currentStep === DRS_STEP}
            leftIcon={<ChevronLeft size={16} color={theme.color.body} />}
            onPress={handleBack}
          >
            Back
          </AppButton>

          {currentStep === REVIEW_STEP ? (
            <AppButton
              size="lg"
              style={{ flex: 1 }}
              disabled={!canRelease}
              onPress={handleRelease}
            >
              Release
            </AppButton>
          ) : (
            <AppButton
              size="lg"
              style={{ flex: 1 }}
              rightIcon={<ChevronRight size={16} color="#fff" />}
              onPress={handleNext}
            >
              Next
            </AppButton>
          )}
        </View>
      </Animated.ScrollView>

      {/* Release confirmation */}
      <ConfirmModal
        visible={confirmReleaseVisible}
        onCancel={() => setConfirmReleaseVisible(false)}
        onConfirm={performRelease}
        variant="warning"
        title="Confirm Release"
        message={`Release ${addedItems.length} record(s) totalling ${fmt$(
          totals.disburse,
        )} from ${selectedDrs?.name ?? ""}?`}
        cancelLabel="Cancel"
        confirmLabel="Yes, Release"
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

  // Step 1 — DRS list
  slipList: { gap: 10, marginTop: 10 },
  slipCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  slipCardSelected: {
    borderColor: BRAND_COLORS.primaryGreen,
    backgroundColor: theme.color.successBg,
  },
  slipHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  slipName: { fontSize: 14, fontWeight: "700", color: theme.color.ink },
  slipDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  slipDateText: { fontSize: 11, color: theme.color.muted },
  slipAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: BRAND_COLORS.darkGreen,
    marginTop: 2,
  },

  // Step 2 — records
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
  balanceStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.color.successBg,
    borderWidth: 1,
    borderColor: BRAND_COLORS.primaryGreen + "33",
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  balanceStripValue: {
    fontSize: 16,
    fontWeight: "800",
    color: BRAND_COLORS.darkGreen,
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.color.accent,
  },
  selectAllCount: { fontSize: 11, color: theme.color.muted },
  recordList: { gap: 10 },
  recordCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.card,
    padding: 12,
  },
  recordCardSelected: {
    borderColor: BRAND_COLORS.primaryGreen,
    backgroundColor: theme.color.successBg,
  },
  recordTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  recordName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: theme.color.ink,
  },
  recordAmount: { fontSize: 13, fontWeight: "800", color: theme.color.ink },
  recordMeta: { fontSize: 11, color: theme.color.muted, marginTop: 2 },
  recordBadges: { flexDirection: "row", gap: 6, marginTop: 6 },
  listSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: BRAND_COLORS.subtleBg,
  },
  listSummaryText: { fontSize: 12, fontWeight: "700", color: theme.color.ink },
  listSummaryRemaining: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.darkGreen,
  },

  // Step 3 — review
  balanceCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: BRAND_COLORS.primaryGreen + "33",
    backgroundColor: theme.color.successBg,
    padding: 14,
  },
  balanceCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  balanceCardValue: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.darkGreen,
  },
  progressTrack: {
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.card,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: theme.radius.full },
  balanceCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  balanceCardMeta: { fontSize: 11, color: theme.color.body },
  totalsBox: {
    backgroundColor: BRAND_COLORS.subtleBg,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.color.border,
    paddingHorizontal: 10,
    marginTop: 12,
  },
  addedCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: BRAND_COLORS.subtleBg,
    padding: 12,
  },
  addedAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.color.ink,
  },
  warnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.color.errorBg,
  },
  warnText: { fontSize: 12, fontWeight: "700", color: theme.color.error },

  // Wizard navigation
  stepNav: { flexDirection: "row", gap: 10, marginTop: 4 },
});
