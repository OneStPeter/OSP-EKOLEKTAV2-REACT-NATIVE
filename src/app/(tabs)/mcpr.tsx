import { CreditCard, FileText, Phone } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BOTTOM_NAV_HEIGHT } from "@/components/navigation/BottomNavBar";
import type { TableColDef } from "@/components/ui";
import {
  AppButton,
  Badge,
  Card,
  RowItem,
  SwipeDismissModal,
  Table,
  theme,
} from "@/components/ui";
import { BRAND_COLORS } from "@/constants/colors";
import { useScrollNav } from "@/hooks/use-scroll-nav";

// ── Types ────────────────────────────────────────────────────────────────────

type MCPR = {
  LPANo: string;
  PlanholderName: string;
  PlanCode: string;
  InstAmt: number;
  DueDate: Date;
  InstallmentNo: number;
  Aging: number;
  CommQ30: number;
  QNCom: number;
  SIAmount: number;
  MobileNo: string;
};

// ── Static data ─────────────────────────────────────────────────────────────

const mcprData: MCPR[] = [
  {
    LPANo: "LPA001",
    PlanholderName: "Juan Dela Cruz",
    PlanCode: "PLN-A1",
    InstAmt: 1500.25,
    DueDate: new Date("2026-01-15"),
    InstallmentNo: 1,
    Aging: 30,
    CommQ30: 100.1234,
    QNCom: 50.5678,
    SIAmount: 20000.5,
    MobileNo: "09171234567",
  },
  {
    LPANo: "LPA002",
    PlanholderName: "Maria Santos",
    PlanCode: "PLN-A2",
    InstAmt: 1750.5,
    DueDate: new Date("2026-01-20"),
    InstallmentNo: 2,
    Aging: 60,
    CommQ30: 110.2234,
    QNCom: 45.9876,
    SIAmount: 25000.75,
    MobileNo: "09181234567",
  },
  {
    LPANo: "LPA003",
    PlanholderName: "Pedro Reyes",
    PlanCode: "PLN-B1",
    InstAmt: 2000.75,
    DueDate: new Date("2026-02-01"),
    InstallmentNo: 3,
    Aging: 90,
    CommQ30: 120.4567,
    QNCom: 60.1234,
    SIAmount: 30000.25,
    MobileNo: "09191234567",
  },
  {
    LPANo: "LPA004",
    PlanholderName: "Ana Garcia",
    PlanCode: "PLN-B2",
    InstAmt: 1800.0,
    DueDate: new Date("2026-02-05"),
    InstallmentNo: 4,
    Aging: 0,
    CommQ30: 95.1111,
    QNCom: 40.2222,
    SIAmount: 22000.0,
    MobileNo: "09201234567",
  },
  {
    LPANo: "LPA005",
    PlanholderName: "Luis Mendoza",
    PlanCode: "PLN-C1",
    InstAmt: 2100.33,
    DueDate: new Date("2026-02-10"),
    InstallmentNo: 5,
    Aging: 30,
    CommQ30: 130.3333,
    QNCom: 70.4444,
    SIAmount: 35000.8,
    MobileNo: "09211234567",
  },
  {
    LPANo: "LPA006",
    PlanholderName: "Carla Bautista",
    PlanCode: "PLN-C2",
    InstAmt: 1900.99,
    DueDate: new Date("2026-02-15"),
    InstallmentNo: 6,
    Aging: 60,
    CommQ30: 105.5555,
    QNCom: 55.6666,
    SIAmount: 27000.9,
    MobileNo: "09221234567",
  },
  {
    LPANo: "LPA007",
    PlanholderName: "Miguel Ramos",
    PlanCode: "PLN-D1",
    InstAmt: 2200.45,
    DueDate: new Date("2026-02-20"),
    InstallmentNo: 7,
    Aging: 90,
    CommQ30: 140.7777,
    QNCom: 75.8888,
    SIAmount: 40000.6,
    MobileNo: "09231234567",
  },
  {
    LPANo: "LPA008",
    PlanholderName: "Sofia Lopez",
    PlanCode: "PLN-D2",
    InstAmt: 1600.88,
    DueDate: new Date("2026-02-25"),
    InstallmentNo: 8,
    Aging: 0,
    CommQ30: 90.9999,
    QNCom: 35.1111,
    SIAmount: 21000.4,
    MobileNo: "09241234567",
  },
  {
    LPANo: "LPA009",
    PlanholderName: "Jose Villanueva",
    PlanCode: "PLN-E1",
    InstAmt: 2300.15,
    DueDate: new Date("2026-03-01"),
    InstallmentNo: 9,
    Aging: 30,
    CommQ30: 150.2222,
    QNCom: 80.3333,
    SIAmount: 45000.75,
    MobileNo: "09251234567",
  },
  {
    LPANo: "LPA010",
    PlanholderName: "Angela Cruz",
    PlanCode: "PLN-E2",
    InstAmt: 1700.6,
    DueDate: new Date("2026-03-05"),
    InstallmentNo: 10,
    Aging: 60,
    CommQ30: 100.4444,
    QNCom: 42.5555,
    SIAmount: 24000.0,
    MobileNo: "09261234567",
  },
  {
    LPANo: "LPA011",
    PlanholderName: "Ramon Torres",
    PlanCode: "PLN-F1",
    InstAmt: 2400.9,
    DueDate: new Date("2026-03-10"),
    InstallmentNo: 11,
    Aging: 90,
    CommQ30: 155.6666,
    QNCom: 82.7777,
    SIAmount: 48000.3,
    MobileNo: "09271234567",
  },
  {
    LPANo: "LPA012",
    PlanholderName: "Isabel Flores",
    PlanCode: "PLN-F2",
    InstAmt: 1550.4,
    DueDate: new Date("2026-03-15"),
    InstallmentNo: 12,
    Aging: 0,
    CommQ30: 88.8888,
    QNCom: 30.9999,
    SIAmount: 20500.5,
    MobileNo: "09281234567",
  },
  {
    LPANo: "LPA013",
    PlanholderName: "Daniel Aquino",
    PlanCode: "PLN-G1",
    InstAmt: 2600.2,
    DueDate: new Date("2026-03-20"),
    InstallmentNo: 13,
    Aging: 30,
    CommQ30: 165.1234,
    QNCom: 90.2345,
    SIAmount: 52000.7,
    MobileNo: "09291234567",
  },
  {
    LPANo: "LPA014",
    PlanholderName: "Patricia Lim",
    PlanCode: "PLN-G2",
    InstAmt: 1800.75,
    DueDate: new Date("2026-03-25"),
    InstallmentNo: 14,
    Aging: 60,
    CommQ30: 98.3456,
    QNCom: 44.4567,
    SIAmount: 23000.2,
    MobileNo: "09301234567",
  },
  {
    LPANo: "LPA015",
    PlanholderName: "Kevin Tan",
    PlanCode: "PLN-H1",
    InstAmt: 2750.85,
    DueDate: new Date("2026-04-01"),
    InstallmentNo: 15,
    Aging: 90,
    CommQ30: 175.5678,
    QNCom: 95.6789,
    SIAmount: 60000.9,
    MobileNo: "09311234567",
  },
  {
    LPANo: "LPA016",
    PlanholderName: "Grace Navarro",
    PlanCode: "PLN-H2",
    InstAmt: 1650.95,
    DueDate: new Date("2026-04-05"),
    InstallmentNo: 16,
    Aging: 0,
    CommQ30: 92.789,
    QNCom: 37.8901,
    SIAmount: 21500.8,
    MobileNo: "09321234567",
  },
  {
    LPANo: "LPA017",
    PlanholderName: "Mark Herrera",
    PlanCode: "PLN-I1",
    InstAmt: 2900.1,
    DueDate: new Date("2026-04-10"),
    InstallmentNo: 17,
    Aging: 30,
    CommQ30: 185.9012,
    QNCom: 100.0123,
    SIAmount: 65000.4,
    MobileNo: "09331234567",
  },
  {
    LPANo: "LPA018",
    PlanholderName: "Theresa Ong",
    PlanCode: "PLN-I2",
    InstAmt: 1500.55,
    DueDate: new Date("2026-04-15"),
    InstallmentNo: 18,
    Aging: 60,
    CommQ30: 85.1234,
    QNCom: 28.2345,
    SIAmount: 19500.6,
    MobileNo: "09341234567",
  },
  {
    LPANo: "LPA019",
    PlanholderName: "Paul Castillo",
    PlanCode: "PLN-J1",
    InstAmt: 3100.45,
    DueDate: new Date("2026-04-20"),
    InstallmentNo: 19,
    Aging: 90,
    CommQ30: 195.3456,
    QNCom: 110.4567,
    SIAmount: 70000.2,
    MobileNo: "09351234567",
  },
  {
    LPANo: "LPA020",
    PlanholderName: "Catherine Sy",
    PlanCode: "PLN-J2",
    InstAmt: 1750.25,
    DueDate: new Date("2026-04-25"),
    InstallmentNo: 20,
    Aging: 0,
    CommQ30: 102.5678,
    QNCom: 48.6789,
    SIAmount: 26000.5,
    MobileNo: "09361234567",
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
function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function fmtDec(n: number) {
  return n.toFixed(2);
}
function agingStyle(aging: number) {
  if (aging === 0) return { color: "#059669", bg: "#ecfdf5", label: "0" };
  if (aging <= 30) return { color: "#d97706", bg: "#fffbeb", label: "30" };
  if (aging <= 60) return { color: "#ea580c", bg: "#fff7ed", label: "60" };
  return { color: "#dc2626", bg: "#fef2f2", label: "90" };
}

// ── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: TableColDef<MCPR>[] = [
  {
    key: "LPANo",
    label: "LPA No",
    width: 88,
    sortValue: (r) => r.LPANo,
    renderCell: (r) => (
      <Text
        style={{ fontSize: 12, color: theme.color.accent, fontWeight: "700" }}
        numberOfLines={1}
      >
        {r.LPANo}
      </Text>
    ),
  },
  {
    key: "PlanholderName",
    label: "Planholder",
    width: 148,
    sortValue: (r) => r.PlanholderName,
    renderCell: (r) => (
      <Text style={{ fontSize: 12, color: theme.color.ink }} numberOfLines={2}>
        {r.PlanholderName}
      </Text>
    ),
  },
  {
    key: "PlanCode",
    label: "Plan Code",
    width: 88,
    renderCell: (r) => (
      <Text style={{ fontSize: 12, color: theme.color.body }} numberOfLines={1}>
        {r.PlanCode}
      </Text>
    ),
  },
  {
    key: "InstAmt",
    label: "Inst. Amt",
    width: 108,
    sortValue: (r) => r.InstAmt,
    align: "right",
    renderCell: (r) => (
      <Text
        style={{ fontSize: 12, color: theme.color.ink, textAlign: "right" }}
        numberOfLines={1}
      >
        {fmt$(r.InstAmt)}
      </Text>
    ),
  },
  {
    key: "DueDate",
    label: "Due Date",
    width: 100,
    sortValue: (r) => r.DueDate,
    renderCell: (r) => (
      <Text style={{ fontSize: 12, color: theme.color.body }} numberOfLines={1}>
        {fmtDate(r.DueDate)}
      </Text>
    ),
  },
  {
    key: "InstallmentNo",
    label: "No.",
    width: 48,
    sortValue: (r) => r.InstallmentNo,
    align: "center",
    renderCell: (r) => (
      <Text
        style={{ fontSize: 12, color: theme.color.body, textAlign: "center" }}
      >
        {r.InstallmentNo}
      </Text>
    ),
  },
  {
    key: "Aging",
    label: "Aging",
    width: 76,
    sortValue: (r) => r.Aging,
    align: "center",
    renderCell: (r) => {
      const { color, bg, label } = agingStyle(r.Aging);
      return (
        <View style={{ alignItems: "center" }}>
          <Badge label={label} color={color} backgroundColor={bg} />
        </View>
      );
    },
  },
  {
    key: "CommQ30",
    label: "Comm Q30",
    width: 92,
    align: "right",
    renderCell: (r) => (
      <Text
        style={{ fontSize: 12, color: theme.color.body, textAlign: "right" }}
        numberOfLines={1}
      >
        {fmtDec(r.CommQ30)}
      </Text>
    ),
  },
  {
    key: "QNCom",
    label: "Q.NCom",
    width: 82,
    align: "right",
    renderCell: (r) => (
      <Text
        style={{ fontSize: 12, color: theme.color.body, textAlign: "right" }}
        numberOfLines={1}
      >
        {fmtDec(r.QNCom)}
      </Text>
    ),
  },
  {
    key: "SIAmount",
    label: "SI Amount",
    width: 112,
    sortValue: (r) => r.SIAmount,
    align: "right",
    renderCell: (r) => (
      <Text
        style={{ fontSize: 12, color: theme.color.ink, textAlign: "right" }}
        numberOfLines={1}
      >
        {fmt$(r.SIAmount)}
      </Text>
    ),
  },
  {
    key: "MobileNo",
    label: "Mobile",
    width: 116,
    renderCell: (r) => (
      <Text style={{ fontSize: 12, color: theme.color.body }} numberOfLines={1}>
        {r.MobileNo}
      </Text>
    ),
  },
];

// ── Search predicate ─────────────────────────────────────────────────────────

function mcprSearchFilter(query: string, row: MCPR): boolean {
  const q = query.toLowerCase();
  return (
    row.LPANo.toLowerCase().includes(q) ||
    row.PlanholderName.toLowerCase().includes(q) ||
    row.PlanCode.toLowerCase().includes(q) ||
    row.MobileNo.includes(q)
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────

export default function MCPRScreen() {
  const scrollHandler = useScrollNav();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 1024;
  const [selectedRecord, setSelectedRecord] = useState<MCPR | null>(null);

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
            paddingHorizontal: width >= 768 ? 24 : 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary cards */}
        <View style={isTablet ? styles.cardsTablet : styles.cardsPhone}>
          <Card
            icon={FileText}
            title="No. of Accounts"
            subtitle="Total Active Accounts"
            style={{ flex: 1, marginBottom: 0 }}
            bodyStyle={{ paddingVertical: 12 }}
          >
            <View style={styles.accountCenter}>
              <Text
                style={[
                  styles.accountCount,
                  { color: BRAND_COLORS.primaryGreen },
                ]}
              >
                {mcprData.length}
              </Text>
            </View>
          </Card>
        </View>

        <Table<MCPR>
          title="Account List"
          data={mcprData}
          columns={COLUMNS}
          keyExtractor={(r) => r.LPANo}
          searchEnabled
          searchPlaceholder="Search by name, LPA No, plan code or mobile…"
          searchFilter={mcprSearchFilter}
          columnSelectionEnabled
          defaultSortKey="LPANo"
          defaultPageSize={10}
          stickyFirstColumn
          onRowClick={setSelectedRecord}
        />

        {/* View Incentives */}
        <AppButton
          size="lg"
          style={{
            backgroundColor: BRAND_COLORS.primaryGreen,
            alignSelf: isTablet ? "flex-end" : "stretch",
            marginTop: 4,
          }}
        >
          View Incentives
        </AppButton>
      </Animated.ScrollView>

      {/* MCPR record detail — bottom sheet on phone, right sidebar on tablet+ */}
      <SwipeDismissModal
        visible={selectedRecord !== null}
        onDismiss={() => setSelectedRecord(null)}
        title="Account List"
        sheetWidth={480}
      >
        {selectedRecord &&
          (() => {
            const {
              color: agColor,
              bg: agBg,
              label: agLabel,
            } = agingStyle(selectedRecord.Aging);
            return (
              <View style={styles.bsScroll}>
                {/* ── Light Info tile ────────────────────────────── */}
                <View style={styles.bsTile}>
                  <View style={styles.bsTileTop}>
                    <Text style={styles.bsTileLpa}>{selectedRecord.LPANo}</Text>
                    <Badge
                      label={
                        selectedRecord.Aging === 0
                          ? agLabel
                          : `${selectedRecord.Aging} Days`
                      }
                      color={agColor}
                      backgroundColor={agBg}
                    />
                  </View>
                  <Text style={styles.bsTileName}>
                    {selectedRecord.PlanholderName}
                  </Text>
                </View>

                {/* ── Card 1: Plan Information ───────────────────── */}
                <Card
                  title="Plan Information"
                  style={styles.bsCard}
                  icon={FileText}
                >
                  <RowItem label="Plan Code" value={selectedRecord.PlanCode} />
                  <RowItem
                    label="Installment No."
                    value={String(selectedRecord.InstallmentNo)}
                  />
                  <RowItem
                    label="Due Date"
                    value={fmtDate(selectedRecord.DueDate)}
                  />
                </Card>

                {/* ── Card 2: Financial Details ──────────────────── */}
                <Card
                  title="Financial Details"
                  style={styles.bsCard}
                  icon={CreditCard}
                >
                  <RowItem
                    label="Installment Amount"
                    value={fmt$(selectedRecord.InstAmt)}
                  />
                  <RowItem
                    label="SI Amount"
                    value={fmt$(selectedRecord.SIAmount)}
                  />
                  <RowItem
                    label="Comm Q30"
                    value={fmtDec(selectedRecord.CommQ30)}
                  />
                  <RowItem
                    label="Q.NCom"
                    value={fmtDec(selectedRecord.QNCom)}
                  />
                </Card>

                {/* ── Card 3: Contact ────────────────────────────── */}
                <Card title="Contact" style={styles.bsCard} icon={Phone}>
                  <RowItem label="Mobile No." value={selectedRecord.MobileNo} />
                </Card>
              </View>
            );
          })()}
      </SwipeDismissModal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },

  // Summary cards
  cardsPhone: { gap: 10 },
  cardsTablet: { flexDirection: "row", gap: 12, alignItems: "stretch" },
  accountCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  accountCount: { fontSize: 38, fontWeight: "900", lineHeight: 52 },

  // Record detail sheet content
  bsScroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  // Light Info tile
  bsTile: {
    backgroundColor: BRAND_COLORS.infoBg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: BRAND_COLORS.info + "33",
    padding: 16,
    marginBottom: 12,
  },
  bsTileTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // marginBottom: 2,
  },
  bsTileLpa: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.ink,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  bsTileName: {
    fontSize: 14,
    fontWeight: "400",
    color: BRAND_COLORS.grey,

    lineHeight: 26,
  },
  bsCard: { marginBottom: 12 },
});
