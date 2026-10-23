import { useLocalSearchParams } from "expo-router";
import {
  ArrowLeftRight,
  Calendar,
  ClipboardList,
  Filter,
  FileText,
  Plus,
  TriangleAlert,
  Wallet,
} from "lucide-react-native";
import {
  alpha,
  BaseButton,
  BaseIconButton,
  BaseText,
  Caption,
  Card,
  Checkbox,
  EmptyStateCard,
  FormStepper,
  LookupField,
  MessageDialog,
  OSPBadge,
  RowItem,
  SectionTitle,
  SegmentedControl,
  Small,
  useTheme,
  useThemedStyles,
} from "osp-ui-kit-native";
import type {
  FormStepItem,
  LookupColumn,
  OSPBadgeType,
  SegmentedOption,
} from "osp-ui-kit-native";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  DRS_ITEMS,
  drsAmount,
  type DrsItem,
  type DrsPaymentRow,
} from "@/data/drs";
import { useAlertModal } from "@/hooks/use-alert-modal";

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

const TYPE_LABEL: Record<DisbursementType, string> = {
  COM: "Commission",
  TE: "Transportation",
};

const TYPE_BADGE: Record<DisbursementType, OSPBadgeType> = {
  COM: "success",
  TE: "info",
};

const DRS_STEP = 0;
const RECORDS_STEP = 1;
const REVIEW_STEP = 2;

const DRS_LOOKUP_COLUMNS: LookupColumn<DrsItem>[] = [
  { key: "name", header: "Reference" },
  {
    key: "SlipDate",
    header: "Slip Date",
    render: (_v, row) => fmtDateStr(row.SlipDate),
  },
  {
    key: "id",
    header: "Available Balance",
    enableSorting: false,
    render: (_v, row) => fmt$(drsAmount(row)),
  },
];

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
  const theme = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles((t) =>
    StyleSheet.create({
      step: { gap: 10 },

      // Step 1 — DRS list
      slipList: { gap: 10 },
      slipCard: {
        borderRadius: t.radii.card,
        borderWidth: 1,
        borderColor: t.colors.hairline,
        backgroundColor: t.colors.surface,
        paddingHorizontal: 14,
        paddingVertical: 12,
      },
      slipCardSelected: {
        borderColor: t.colors.primary,
        backgroundColor: t.colors.primaryTint,
      },
      slipHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
      slipDateRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
      },

      // Step 2 — records
      balanceStrip: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: t.colors.primaryTint,
        borderWidth: 1,
        borderColor: alpha(t.colors.primary, 0.2),
        borderRadius: t.radii.card,
        paddingHorizontal: 14,
        paddingVertical: 11,
      },
      selectAllRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 8,
      },
      recordList: { gap: 10 },
      recordCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        borderRadius: t.radii.card,
        borderWidth: 1,
        borderColor: t.colors.hairline,
        backgroundColor: t.colors.surface,
        padding: 12,
      },
      recordCardSelected: {
        borderColor: t.colors.primary,
        backgroundColor: t.colors.primaryTint,
      },
      recordTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      },
      recordBadges: { flexDirection: "row", gap: 6, marginTop: 6 },
      listSummary: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 11,
        borderRadius: t.radii.card,
        borderWidth: 1,
        borderColor: t.colors.hairline,
        backgroundColor: t.colors.canvas,
      },

      // Step 3 — review
      balanceCard: {
        borderRadius: t.radii.card,
        borderWidth: 1,
        borderColor: alpha(t.colors.primary, 0.2),
        backgroundColor: t.colors.primaryTint,
        padding: 14,
      },
      balanceCardTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
      },
      progressTrack: {
        height: 8,
        borderRadius: 9999,
        backgroundColor: t.colors.surface,
        overflow: "hidden",
      },
      progressFill: { height: "100%", borderRadius: 9999 },
      balanceCardBottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6,
      },
      totalsBox: {
        backgroundColor: t.colors.canvas,
        borderRadius: t.radii.card,
        borderWidth: 1,
        borderColor: t.colors.hairline,
        paddingHorizontal: 10,
        marginTop: 12,
      },
      addedCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        borderRadius: t.radii.card,
        borderWidth: 1,
        borderColor: t.colors.hairline,
        backgroundColor: t.colors.canvas,
        padding: 12,
      },
      warnRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: t.radii.card,
        backgroundColor: t.colors.dangerTint,
      },
    }),
  );

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

  const typeOptions: SegmentedOption<string>[] = useMemo(
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

  // ── Step gates (FormStepper runs these for Next and header jumps) ──

  function validateDrsStep() {
    if (!selectedDrs) {
      showAlert(
        "warning",
        "No DRS Selected",
        "Select a Digital Remittance Slip before disbursing.",
      );
      return false;
    }
    return true;
  }

  function validateRecordsStep() {
    if (addedItems.length === 0) {
      showAlert(
        "warning",
        "Nothing to Release",
        "Add at least one record to the disbursement list first.",
      );
      return false;
    }
    return true;
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

  // ── Step 1: pick the remittance slip to release against ──

  const drsStepContent = (
    <View style={styles.step}>
      <LookupField<DrsItem>
        label="Digital Remittance Slip"
        placeholder="Search by reference…"
        modalTitle="Search Remittance Slip"
        variant="search"
        columns={DRS_LOOKUP_COLUMNS}
        dataSource={sortedDrs}
        searchKeys={["name"]}
        value={null}
        onSelect={handleSelectDrs}
        renderDisplay={(item) => item.name}
      />

      <View style={{ marginTop: 4 }}>
        <SectionTitle>Available Slips</SectionTitle>
        <Small color="mutedStrong">Select the slip you are releasing from</Small>
      </View>

      <View style={styles.slipList}>
        {sortedDrs.length === 0 ? (
          <EmptyStateCard
            icon={FileText}
            title="No remittance slips"
            description="Encoded DRS records will appear here."
          />
        ) : (
          sortedDrs.map((item) => {
            const isSelected = selectedDrs?.id === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => handleSelectDrs(item)}
                style={({ pressed }) => [
                  styles.slipCard,
                  isSelected && styles.slipCardSelected,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.slipHeader}>
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
                      <Calendar size={11} color={c.muted} />
                      <Small color="muted">{fmtDateStr(item.SlipDate)}</Small>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Caption>Available balance</Caption>
                    <BaseText
                      fontSize="md"
                      fontWeight="extrabold"
                      color="infoFg"
                      style={{ marginTop: 2 }}
                    >
                      {fmt$(drsAmount(item))}
                    </BaseText>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );

  // ── Step 2: pick the claims to disburse ──

  const recordsStepContent = (
    <Card.Root title={selectedDrs?.name ?? "Disbursement"}>
      <Card.Subtitle>| Subject for release</Card.Subtitle>
      <Card.ButtonSection>
        <BaseIconButton
          accessibilityLabel="Change remittance slip"
          icon={ArrowLeftRight}
          variant="outline"
          size="sm"
          rounded="full"
          onPress={() => setCurrentStep(DRS_STEP)}
        />
      </Card.ButtonSection>
      <Card.MainContent>
        {!selectedDrs ? (
          <EmptyStateCard
            icon={FileText}
            title="No DRS Selected"
            description="Go back and select a Digital Remittance Slip first."
          />
        ) : (
          <>
            <View style={styles.balanceStrip}>
              <Caption>Available balance</Caption>
              <BaseText fontSize="md" fontWeight="extrabold" color="infoFg">
                {fmt$(totals.balance)}
              </BaseText>
            </View>

            <View style={{ marginTop: 12, marginBottom: 12, gap: 6 }}>
              <Small fontWeight="semibold" color="mutedStrong">
                Disbursement Type
              </Small>
              <SegmentedControl<string>
                options={typeOptions}
                value={selectedType}
                onValueChange={handleSelectType}
              />
            </View>

            {!selectedType ? (
              <EmptyStateCard
                icon={Filter}
                title="Choose a type"
                description="Pick Commission or Transportation to load the eligible records."
              />
            ) : eligible.length === 0 ? (
              <EmptyStateCard
                icon={ClipboardList}
                title="Nothing left to add"
                description={`All ${TYPE_LABEL[selectedType].toLowerCase()} records for this slip are already in your list.`}
              />
            ) : (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.selectAllRow,
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={toggleCheckAll}
                >
                  <Checkbox
                    size="sm"
                    checked={allChecked}
                    indeterminate={someChecked}
                    onCheckedChange={toggleCheckAll}
                    accessibilityLabel="Select all records"
                  />
                  <Small fontWeight="bold" color="infoFg">
                    {allChecked ? "Clear all" : "Select all"}
                  </Small>
                  <View style={{ flex: 1 }} />
                  <Small color="muted">{eligible.length} record(s)</Small>
                </Pressable>

                <View style={styles.recordList}>
                  {eligible.map((r) => {
                    const on = checked.has(r.key);
                    return (
                      <Pressable
                        key={r.key}
                        onPress={() => toggleCheck(r.key)}
                        style={({ pressed }) => [
                          styles.recordCard,
                          on && styles.recordCardSelected,
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <Checkbox
                          checked={on}
                          onCheckedChange={() => toggleCheck(r.key)}
                          accessibilityLabel={r.Name}
                        />
                        <View style={{ flex: 1 }}>
                          <View style={styles.recordTopRow}>
                            <BaseText
                              fontSize="sm"
                              fontWeight="bold"
                              color="heading"
                              numberOfLines={1}
                              style={{ flex: 1 }}
                            >
                              {r.Name}
                            </BaseText>
                            <BaseText
                              fontSize="sm"
                              fontWeight="extrabold"
                              color="heading"
                            >
                              {fmt$(r.amount)}
                            </BaseText>
                          </View>
                          <Small color="muted" style={{ marginTop: 2 }}>
                            SI {r.SI} · Inst. {r.InstNo}
                          </Small>
                          <View style={styles.recordBadges}>
                            <OSPBadge type={TYPE_BADGE[r.type]}>
                              {TYPE_LABEL[r.type]}
                            </OSPBadge>
                            <OSPBadge>{r.PayClass}</OSPBadge>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <BaseButton
                  size="lg"
                  fullWidth
                  style={{ marginTop: 14 }}
                  disabled={checkedRecords.length === 0}
                  leftIcon={Plus}
                  onPress={handleAddToList}
                >
                  {checkedRecords.length === 0
                    ? "Select records to add"
                    : `Add ${checkedRecords.length} · ${fmt$(checkedTotal)}`}
                </BaseButton>
              </>
            )}

            {addedItems.length > 0 && (
              <Pressable
                style={({ pressed }) => [
                  styles.listSummary,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => setCurrentStep(REVIEW_STEP)}
              >
                <Wallet size={14} color={c.primary} />
                <Small fontWeight="bold" color="heading">
                  {addedItems.length} in list · {fmt$(totals.disburse)}
                </Small>
                <View style={{ flex: 1 }} />
                <Small fontWeight="bold" color={over ? "danger" : "infoFg"}>
                  {fmt$(totals.remaining)} left
                </Small>
              </Pressable>
            )}
          </>
        )}
      </Card.MainContent>
    </Card.Root>
  );

  // ── Step 3: review the amounts and release ──

  const reviewStepContent = (
    <Card.Root title="Review & Release">
      <Card.Subtitle>| {selectedDrs?.name ?? "—"}</Card.Subtitle>
      <Card.MainContent>
        {addedItems.length === 0 ? (
          <EmptyStateCard
            icon={ClipboardList}
            title="No records added"
            description="Go back and add at least one record to release."
          />
        ) : (
          <>
            <View style={styles.balanceCard}>
              <View style={styles.balanceCardTop}>
                <Caption color="infoFg">Available balance</Caption>
                <BaseText fontSize="lg" fontWeight="extrabold" color="infoFg">
                  {fmt$(totals.balance)}
                </BaseText>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${allocatedPct}%`,
                      backgroundColor: over
                        ? c.danger
                        : allocatedPct >= 90
                          ? c.warning
                          : c.primary,
                    },
                  ]}
                />
              </View>
              <View style={styles.balanceCardBottom}>
                <Small color="foreground">{allocatedPct}% allocated</Small>
                <Small
                  color={over ? "danger" : "foreground"}
                  fontWeight={over ? "bold" : undefined}
                >
                  {over
                    ? `Over by ${fmt$(Math.abs(totals.remaining))}`
                    : `${fmt$(totals.remaining)} left`}
                </Small>
              </View>
            </View>

            <View style={styles.totalsBox}>
              <RowItem label="Commission" value={fmt$(totals.com)} />
              <RowItem label="Transportation" value={fmt$(totals.te)} />
              <RowItem label="Total to Disburse" value={fmt$(totals.disburse)} />
            </View>

            <View style={{ marginTop: 14, marginBottom: 10 }}>
              <SectionTitle>Records to Release</SectionTitle>
              <Small color="mutedStrong">{addedItems.length} record(s)</Small>
            </View>

            <View style={styles.recordList}>
              {addedItems.map((item) => (
                <View key={item.key} style={styles.addedCard}>
                  <View style={{ flex: 1 }}>
                    <BaseText
                      fontSize="sm"
                      fontWeight="bold"
                      color="heading"
                      numberOfLines={1}
                    >
                      {item.Name}
                    </BaseText>
                    <Small color="muted" style={{ marginTop: 2 }}>
                      SI {item.SI} · Inst. {item.InstNo}
                    </Small>
                    <View style={styles.recordBadges}>
                      <OSPBadge type={TYPE_BADGE[item.type]}>
                        {TYPE_LABEL[item.type]}
                      </OSPBadge>
                    </View>
                  </View>

                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <BaseText
                      fontSize="sm"
                      fontWeight="extrabold"
                      color="heading"
                    >
                      {fmt$(item.release)}
                    </BaseText>
                    <BaseButton
                      variant="solid"
                      tone="danger"
                      size="sm"
                      onPress={() => handleRemoveItem(item.key)}
                    >
                      Remove
                    </BaseButton>
                  </View>
                </View>
              ))}
            </View>

            {over && (
              <View style={styles.warnRow}>
                <TriangleAlert size={14} color={c.danger} />
                <Small fontWeight="bold" color="danger">
                  Exceeds balance by {fmt$(Math.abs(totals.remaining))}
                </Small>
              </View>
            )}
          </>
        )}
      </Card.MainContent>
    </Card.Root>
  );

  // Next / header jumps run each step's gate before moving past it.
  const stepsData: FormStepItem[] = [
    {
      title: "Select DRS",
      icon: FileText,
      content: drsStepContent,
      validateBeforeNext: validateDrsStep,
    },
    {
      title: "Disburse",
      icon: ClipboardList,
      content: recordsStepContent,
      validateBeforeNext: validateRecordsStep,
    },
    { title: "Release", icon: Wallet, content: reviewStepContent },
  ];

  return (
    <>
      <FormStepper
        stepsData={stepsData}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        onStepsComplete={handleRelease}
        submitButtonText="Release"
        submitDisabled={!canRelease}
      />

      {/* Release confirmation */}
      <MessageDialog
        open={confirmReleaseVisible}
        onOpenChange={(o) => !o && setConfirmReleaseVisible(false)}
        onConfirm={performRelease}
        variant="confirmation"
        title="Confirm Release"
        message={`Release ${addedItems.length} record(s) totalling ${fmt$(
          totals.disburse,
        )} from ${selectedDrs?.name ?? ""}?`}
        cancelText="Cancel"
        confirmText="Yes, Release"
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
