import { CreditCard, FileText, Phone } from "lucide-react-native";
import {
  alpha,
  BaseButton,
  BaseText,
  BottomSheet,
  Card,
  DataTable,
  DrawerPanel,
  MetricCard,
  OSPBadge,
  RowItem,
  SectionTitle,
  Small,
  useTheme,
  type DataTableProps,
  type IconComponent,
  type OSPBadgeType,
} from "osp-ui-kit-native";
import React, { useState, type ReactNode } from "react";
import { useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Types ────────────────────────────────────────────────────────────────────

// `@tanstack/react-table`'s ColumnDef, taken from the kit's DataTable props
// (the package is a kit dependency, not a direct app dependency).
type ColumnDef<T> = DataTableProps<T>["columns"][number];

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
function agingStyle(aging: number): { type: OSPBadgeType; label: string } {
  if (aging === 0) return { type: "success", label: "0" };
  if (aging <= 30) return { type: "warning", label: "30" };
  if (aging <= 60) return { type: "warning", label: "60" };
  return { type: "danger", label: "90" };
}

// ── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: ColumnDef<MCPR>[] = [
  {
    accessorKey: "LPANo",
    header: "LPA No",
    meta: { width: 88, isStickyLeft: true },
    cell: ({ row }) => (
      <BaseText
        fontSize="xs"
        fontWeight="bold"
        color="primary"
        numberOfLines={1}
      >
        {row.original.LPANo}
      </BaseText>
    ),
  },
  {
    accessorKey: "PlanholderName",
    header: "Planholder",
    meta: { width: 148 },
    cell: ({ row }) => (
      <BaseText fontSize="xs" color="heading" numberOfLines={2}>
        {row.original.PlanholderName}
      </BaseText>
    ),
  },
  {
    accessorKey: "PlanCode",
    header: "Plan Code",
    enableSorting: false,
    meta: { width: 88 },
    cell: ({ row }) => (
      <BaseText fontSize="xs" numberOfLines={1}>
        {row.original.PlanCode}
      </BaseText>
    ),
  },
  {
    accessorKey: "InstAmt",
    header: "Inst. Amt",
    meta: { width: 108, numeric: true },
    cell: ({ row }) => (
      <BaseText
        fontSize="xs"
        color="heading"
        textAlign="right"
        numberOfLines={1}
      >
        {fmt$(row.original.InstAmt)}
      </BaseText>
    ),
  },
  {
    accessorKey: "DueDate",
    header: "Due Date",
    meta: { width: 100 },
    cell: ({ row }) => (
      <BaseText fontSize="xs" numberOfLines={1}>
        {fmtDate(row.original.DueDate)}
      </BaseText>
    ),
  },
  {
    accessorKey: "InstallmentNo",
    header: "No.",
    meta: { width: 48 },
    cell: ({ row }) => (
      <BaseText fontSize="xs" textAlign="center">
        {row.original.InstallmentNo}
      </BaseText>
    ),
  },
  {
    accessorKey: "Aging",
    header: "Aging",
    meta: { width: 76 },
    cell: ({ row }) => {
      const { type, label } = agingStyle(row.original.Aging);
      return (
        <View style={{ alignItems: "center" }}>
          <OSPBadge type={type}>{label}</OSPBadge>
        </View>
      );
    },
  },
  {
    accessorKey: "CommQ30",
    header: "Comm Q30",
    enableSorting: false,
    meta: { width: 92, numeric: true },
    cell: ({ row }) => (
      <BaseText fontSize="xs" textAlign="right" numberOfLines={1}>
        {fmtDec(row.original.CommQ30)}
      </BaseText>
    ),
  },
  {
    accessorKey: "QNCom",
    header: "Q.NCom",
    enableSorting: false,
    meta: { width: 82, numeric: true },
    cell: ({ row }) => (
      <BaseText fontSize="xs" textAlign="right" numberOfLines={1}>
        {fmtDec(row.original.QNCom)}
      </BaseText>
    ),
  },
  {
    accessorKey: "SIAmount",
    header: "SI Amount",
    meta: { width: 112, numeric: true },
    cell: ({ row }) => (
      <BaseText
        fontSize="xs"
        color="heading"
        textAlign="right"
        numberOfLines={1}
      >
        {fmt$(row.original.SIAmount)}
      </BaseText>
    ),
  },
  {
    accessorKey: "MobileNo",
    header: "Mobile",
    enableSorting: false,
    meta: { width: 116 },
    cell: ({ row }) => (
      <BaseText fontSize="xs" numberOfLines={1}>
        {row.original.MobileNo}
      </BaseText>
    ),
  },
];

// ── Detail sheet (bottom sheet on phone, side panel on tablet+) ─────────────

function DetailSheet({
  open,
  onClose,
  title,
  isTablet,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  isTablet: boolean;
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
  children,
}: {
  icon: IconComponent;
  title: string;
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
            marginBottom: 6,
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
          <SectionTitle>{title}</SectionTitle>
        </View>
        {children}
      </Card.MainContent>
    </Card.Root>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────

export default function MCPRScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 1024;
  const [selectedRecord, setSelectedRecord] = useState<MCPR | null>(null);

  return (
    <>
      <View style={{ gap: 12, paddingVertical: 8 }}>
        {/* Summary cards */}
        <MetricCard
          icon={FileText}
          label="No. of Accounts"
          subtitle="| Total Active Accounts"
          value={String(mcprData.length)}
          accent="primary"
        />

        <DataTable<MCPR>
          title="Account List"
          data={mcprData}
          columns={COLUMNS}
          getRowId={(r) => r.LPANo}
          features={{
            search: true,
            sorting: true,
            pagination: true,
            columnToggle: true,
            filtering: false,
            selection: false,
            detailSidebar: false,
          }}
          labels={{
            searchPlaceholder: "Search by name, LPA No, plan code or mobile…",
          }}
          defaultPageSize={10}
          onRowClick={setSelectedRecord}
          mobileConfig={{
            viewMode: "card",
            primaryField: "PlanholderName",
            titleTransform: "none",
            secondaryField: "LPANo",
            badgeField: "Aging",
            badgeColorMap: { "0": "green", "30": "yellow", "60": "orange", "90": "red" },
            visibleFields: ["PlanCode", "InstAmt", "DueDate", "SIAmount"],
            labelMap: {
              LPANo: "LPA No",
              PlanCode: "Plan Code",
              InstAmt: "Inst. Amt",
              DueDate: "Due Date",
              SIAmount: "SI Amount",
            },
            valueFormatter: {
              Aging: (v) => agingStyle(Number(v)).label,
              InstAmt: (v) => fmt$(Number(v)),
              SIAmount: (v) => fmt$(Number(v)),
              DueDate: (v) => fmtDate(v as Date),
            },
          }}
        />

        {/* View Incentives */}
        <BaseButton
          size="lg"
          fullWidth={!isTablet}
          style={{ alignSelf: isTablet ? "flex-end" : "stretch", marginTop: 4 }}
        >
          View Incentives
        </BaseButton>
      </View>

      {/* MCPR record detail — bottom sheet on phone, right sidebar on tablet+ */}
      <DetailSheet
        open={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
        title="Account List"
        isTablet={isTablet}
      >
        {selectedRecord &&
          (() => {
            const { type: agType, label: agLabel } = agingStyle(
              selectedRecord.Aging,
            );
            return (
              <>
                {/* ── Light Info tile ────────────────────────────── */}
                <View
                  style={{
                    backgroundColor: theme.colors.infoTint,
                    borderRadius: theme.radii.card,
                    borderWidth: 1,
                    borderColor: alpha(theme.colors.info, 0.2),
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <BaseText
                      fontSize="lg"
                      fontWeight="extrabold"
                      color="heading"
                      style={{ letterSpacing: 0.3, textTransform: "uppercase" }}
                    >
                      {selectedRecord.LPANo}
                    </BaseText>
                    <OSPBadge type={agType}>
                      {selectedRecord.Aging === 0
                        ? agLabel
                        : `${selectedRecord.Aging} Days`}
                    </OSPBadge>
                  </View>
                  <Small fontSize="sm" color="mutedStrong" style={{ marginTop: 4 }}>
                    {selectedRecord.PlanholderName}
                  </Small>
                </View>

                {/* ── Card 1: Plan Information ───────────────────── */}
                <SectionCard title="Plan Information" icon={FileText}>
                  <RowItem label="Plan Code" value={selectedRecord.PlanCode} />
                  <RowItem
                    label="Installment No."
                    value={String(selectedRecord.InstallmentNo)}
                  />
                  <RowItem
                    label="Due Date"
                    value={fmtDate(selectedRecord.DueDate)}
                  />
                </SectionCard>

                {/* ── Card 2: Financial Details ──────────────────── */}
                <SectionCard title="Financial Details" icon={CreditCard}>
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
                </SectionCard>

                {/* ── Card 3: Contact ────────────────────────────── */}
                <SectionCard title="Contact" icon={Phone}>
                  <RowItem label="Mobile No." value={selectedRecord.MobileNo} />
                </SectionCard>
              </>
            );
          })()}
      </DetailSheet>
    </>
  );
}
