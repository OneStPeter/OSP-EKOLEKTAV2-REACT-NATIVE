import {
  ArrowDown,
  ArrowUp,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Trophy,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UserX,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { BOTTOM_NAV_HEIGHT } from "@/components/navigation/BottomNavBar";
import { useScrollNav } from "@/hooks/use-scroll-nav";

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  ink: "#1B2024",
  body: "#71717a",
  muted: "#8B9097",
  border: "#ECEEF0",
  dots: "#D1D5DB",
  bg: "#F6F7F8",
  card: "#FFFFFF",
  primary: "#1B9E57",
};

// ── Static data ────────────────────────────────────────────────────────────
const PLANHOLDERS = {
  newSales: 1284,
  prevNewSales: 1120,
  activeAccounts: 12100,
  prevActiveAccounts: 11850,
  lapsedAccounts: 7300,
  prevLapsedAccounts: 6900,
  terminatedAccounts: 24700,
  prevTerminatedAccounts: 25100,
};

const QC = {
  comQuota: 5820000,
  comCollection: 4231500,
  nComQuota: 2340000,
  nComCollection: 1887000,
  comAcctDue: 1284,
  comAcctCollection: 943,
  nComAcctDue: 862,
  nComAcctCollection: 714,
};

const LEADERBOARD = [
  { name: "Maria Santos", ns: 284 },
  { name: "Juan Dela Cruz", ns: 261 },
  { name: "Ana Reyes", ns: 248 },
  { name: "Pedro Garcia", ns: 219 },
  { name: "Rosa Mendoza", ns: 198 },
  { name: "Carlos Navarro", ns: 187 },
  { name: "Jasmine Cruz", ns: 172 },
  { name: "Miguel Torres", ns: 165 },
  { name: "Liza Bautista", ns: 154 },
  { name: "Roberto Lim", ns: 143 },
];

const MONTHLY_SALES: Record<string, { month: string; value: number }[]> = {
  "2026": [
    { month: "Jan", value: 1120 },
    { month: "Feb", value: 1243 },
    { month: "Mar", value: 1189 },
    { month: "Apr", value: 1284 },
    { month: "May", value: 0 },
    { month: "Jun", value: 0 },
    { month: "Jul", value: 0 },
    { month: "Aug", value: 0 },
    { month: "Sep", value: 0 },
    { month: "Oct", value: 0 },
    { month: "Nov", value: 0 },
    { month: "Dec", value: 0 },
  ],
  "2025": [
    { month: "Jan", value: 980 },
    { month: "Feb", value: 1050 },
    { month: "Mar", value: 1120 },
    { month: "Apr", value: 1095 },
    { month: "May", value: 1180 },
    { month: "Jun", value: 1220 },
    { month: "Jul", value: 1145 },
    { month: "Aug", value: 1089 },
    { month: "Sep", value: 1210 },
    { month: "Oct", value: 1175 },
    { month: "Nov", value: 1090 },
    { month: "Dec", value: 1320 },
  ],
  "2024": [
    { month: "Jan", value: 850 },
    { month: "Feb", value: 920 },
    { month: "Mar", value: 890 },
    { month: "Apr", value: 960 },
    { month: "May", value: 1010 },
    { month: "Jun", value: 980 },
    { month: "Jul", value: 940 },
    { month: "Aug", value: 1020 },
    { month: "Sep", value: 990 },
    { month: "Oct", value: 1050 },
    { month: "Nov", value: 970 },
    { month: "Dec", value: 1100 },
  ],
};

type TileData = {
  Icon: React.ComponentType<any>;
  title: string;
  value: string;
  prevVal: string;
  pct: number;
  order: "asc" | "desc";
  color: string;
};

const TILES: TileData[] = [
  {
    Icon: UserPlus,
    title: "New Sales",
    value: PLANHOLDERS.newSales.toLocaleString(),
    prevVal: PLANHOLDERS.prevNewSales.toLocaleString(),
    pct:
      ((PLANHOLDERS.newSales - PLANHOLDERS.prevNewSales) /
        PLANHOLDERS.prevNewSales) *
      100,
    order: "asc",
    color: "#1B9E57",
  },
  {
    Icon: UserCheck,
    title: "Active Accounts",
    value: "12.1k",
    prevVal: PLANHOLDERS.prevActiveAccounts.toLocaleString(),
    pct:
      ((PLANHOLDERS.activeAccounts - PLANHOLDERS.prevActiveAccounts) /
        PLANHOLDERS.prevActiveAccounts) *
      100,
    order: "asc",
    color: "#1976D2",
  },
  {
    Icon: UserX,
    title: "Lapsed Accounts",
    value: "7.3k",
    prevVal: PLANHOLDERS.prevLapsedAccounts.toLocaleString(),
    pct:
      ((PLANHOLDERS.lapsedAccounts - PLANHOLDERS.prevLapsedAccounts) /
        PLANHOLDERS.prevLapsedAccounts) *
      100,
    order: "desc",
    color: "#F57C00",
  },
  {
    Icon: UserMinus,
    title: "Terminated Accounts",
    value: "24.7k",
    prevVal: PLANHOLDERS.prevTerminatedAccounts.toLocaleString(),
    pct:
      ((PLANHOLDERS.terminatedAccounts - PLANHOLDERS.prevTerminatedAccounts) /
        PLANHOLDERS.prevTerminatedAccounts) *
      100,
    order: "desc",
    color: "#E53E3E",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtPeso(n: number) {
  return (
    "₱ " +
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// Module-level so createAnimatedComponent is never called during render.
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── DonutChart ─────────────────────────────────────────────────────────────
// SVG progress ring: animated strokeDashoffset via Reanimated, clockwise from
// 12 o'clock (achieved by rotating the SVG -90°). Text sits outside the SVG
// so it is unaffected by the rotation and stays perfectly centered.
function DonutChart({
  percentage,
  color,
  bgColor,
  size = 72,
  thickness = 10,
}: {
  percentage: number;
  color: string;
  bgColor: string;
  size?: number;
  thickness?: number;
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const fontSize = Math.max(8, Math.round(size * 0.14));

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(
      Math.min(Math.max(percentage, 0), 100) / 100,
      {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.System,
      },
    );
  }, [percentage]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* SVG rotated -90° so the stroke starts at 12 o'clock */}
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={bgColor}
          strokeWidth={thickness}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={animatedProps}
        />
      </Svg>
      {/* Label — outside SVG, unaffected by rotation */}
      <Text style={{ fontSize, fontWeight: "800", color }} numberOfLines={1}>
        {Math.round(percentage)}%
      </Text>
    </View>
  );
}

// ── Section label ──────────────────────────────────────────────────────────
function SectionLabel({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={s.sectionSub}>{subtitle}</Text> : null}
    </View>
  );
}

// ── Card wrapper ───────────────────────────────────────────────────────────
function Card({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<any>;
  iconColor: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.cardIconWrap, { backgroundColor: iconColor + "18" }]}>
          <Icon size={14} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{title}</Text>
          {subtitle ? <Text style={s.cardSub}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={s.cardBody}>{children}</View>
    </View>
  );
}

// ── Row item (label + value) ───────────────────────────────────────────────
function RowItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
  last?: boolean;
}) {
  return (
    <View style={s.rowItem}>
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.rowDots} />
      <Text style={s.rowValue}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </Text>
    </View>
  );
}

// ── KPI Tile ───────────────────────────────────────────────────────────────
function Tile({ tile }: { tile: TileData }) {
  const { Icon, title, value, prevVal, pct, order, color } = tile;
  const isPositive = order === "asc" ? pct >= 0 : pct <= 0;
  const trendColor = isPositive ? "#1B9E57" : "#D32F2F";
  const trendBg = isPositive ? "#E8F5E9" : "#FFEBEE";
  const absPct = Math.abs(pct).toFixed(1);

  return (
    <View
      style={[s.tile, { borderColor: color, backgroundColor: color + "15" }]}
    >
      <View style={s.tileHeaderRow}>
        <View style={[s.tileIconWrap, { backgroundColor: color + "18" }]}>
          <Icon size={18} color={color} strokeWidth={2} />
        </View>
        <Text style={s.tileTitle}>{title}</Text>
      </View>

      <Text style={s.tileValue}>{value}</Text>

      <View style={s.tileMomRow}>
        <View>
          <Text style={s.tilePriorLabel}>Prior Month</Text>
          <Text style={s.tilePriorVal}>{prevVal}</Text>
        </View>
        <View style={s.tileTrendCol}>
          <View style={[s.tilePill, { backgroundColor: trendBg }]}>
            {pct > 0 ? (
              <ArrowUp size={11} color={trendColor} strokeWidth={2.5} />
            ) : pct < 0 ? (
              <ArrowDown size={11} color={trendColor} strokeWidth={2.5} />
            ) : null}
            <Text style={[s.tilePillText, { color: trendColor }]}>
              {absPct}%
            </Text>
          </View>
          <Text style={[s.tileChangeLabel, { color: trendColor }]}>
            {pct > 0 ? "Increase" : pct < 0 ? "Decrease" : "No change"}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Leaderboard item ───────────────────────────────────────────────────────
const RANK_COLORS = ["#F59E0B", "#94A3B8", "#F97316"];

function LeaderItem({
  name,
  ns,
  max,
  rank,
}: {
  name: string;
  ns: number;
  max: number;
  rank: number;
}) {
  const isTop3 = rank <= 3;
  const rankColor = isTop3 ? RANK_COLORS[rank - 1] : undefined;
  const barW = `${((ns / max) * 100).toFixed(1)}%` as any;
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <View style={s.leaderRow}>
      <View
        style={[
          s.rankBadge,
          { backgroundColor: isTop3 ? rankColor : "#F3F4F6" },
        ]}
      >
        <Text style={[s.rankText, { color: isTop3 ? "#fff" : "#9CA3AF" }]}>
          {rank}
        </Text>
      </View>

      <View style={[s.leaderAvatar, { backgroundColor: C.primary + "22" }]}>
        <Text style={[s.leaderAvatarText, { color: C.primary }]}>
          {initials}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.leaderName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={s.leaderNs}>{ns.toLocaleString()} sales</Text>
      </View>

      <View style={{ width: 64 }}>
        <Text style={s.leaderPct}>{((ns / max) * 100).toFixed(0)}%</Text>
        <View style={s.barTrack}>
          <View
            style={[
              s.barFill,
              {
                width: barW,
                backgroundColor: isTop3 ? rankColor : C.primary,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

// ── Bar Chart ──────────────────────────────────────────────────────────────
const BAR_H = 130;
const BAR_W = 26;
const BAR_GAP = 8;

const BAR_ANIM = { duration: 200, easing: Easing.out(Easing.cubic) } as const;

function BarItem({
  d,
  h,
  index,
  isSelected,
  isAnySelected,
  onPress,
}: {
  d: { month: string; value: number };
  h: number;
  index: number;
  isSelected: boolean;
  isAnySelected: boolean;
  onPress: () => void;
}) {
  // Press animation
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Mount animation — bar grows up, label fades in after bar lands
  const barH = useSharedValue(0);
  const labelOpacity = useSharedValue(0);

  useEffect(() => {
    const stagger = index * 40;
    barH.value = withDelay(
      stagger,
      withTiming(h, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    labelOpacity.value = withDelay(
      stagger + 350,
      withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) }),
    );
  }, []); // mount only — key={year} remounts on year change

  useEffect(() => {
    if (isSelected) {
      scale.value = withTiming(1.08, BAR_ANIM);
      lift.value = withTiming(-3, BAR_ANIM);
      opacity.value = withTiming(1, BAR_ANIM);
    } else {
      scale.value = withTiming(1, BAR_ANIM);
      lift.value = withTiming(0, BAR_ANIM);
      opacity.value = withTiming(isAnySelected ? 0.45 : 1, BAR_ANIM);
    }
  }, [isSelected, isAnySelected]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: lift.value }],
    opacity: opacity.value,
  }));

  const barStyle = useAnimatedStyle(() => ({ height: barH.value }));

  const labelStyle = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));

  return (
    <TouchableOpacity style={s.barCol} onPress={onPress} activeOpacity={1}>
      <Animated.View
        style={[{ width: BAR_W, alignItems: "center", gap: 4 }, animStyle]}
      >
        {d.value > 0 && (
          <Animated.Text style={[s.barValLabel, labelStyle]}>
            {(d.value / 1000).toFixed(1)}k
          </Animated.Text>
        )}
        <View style={[s.barBody, { height: BAR_H }]}>
          <Animated.View
            style={[
              s.barActual,
              { backgroundColor: d.value > 0 ? C.primary : C.border },
              barStyle,
            ]}
          />
        </View>
        <Text style={s.barMonthLabel}>{d.month}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function BarChart({ data }: { data: { month: string; value: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  function handlePress(i: number) {
    setSelectedIdx((prev) => (prev === i ? null : i));
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -4 }}
    >
      <View style={s.barChartWrap}>
        {data.map((d, i) => {
          const h = d.value > 0 ? Math.max((d.value / maxVal) * BAR_H, 4) : 4;
          return (
            <BarItem
              key={i}
              d={d}
              h={h}
              index={i}
              isSelected={selectedIdx === i}
              isAnySelected={selectedIdx !== null}
              onPress={() => handlePress(i)}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { width: SW } = useWindowDimensions();
  const isTablet = SW >= 768;
  const PADDING_H = isTablet ? 24 : 16;
  const TILE_GAP = 12;
  const CARD_W = SW - PADDING_H * 2;
  const SNAP_W = CARD_W + TILE_GAP;
  const CELL_W = (CARD_W - TILE_GAP) / 2;

  const scrollHandler = useScrollNav();
  const insets = useSafeAreaInsets();

  const carouselRef = useRef<ScrollView>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [year, setYear] = useState("2026");
  const chartData = MONTHLY_SALES[year];

  // Reset carousel position when screen width changes (orientation / foldable)
  useEffect(() => {
    carouselRef.current?.scrollTo({ x: 0, animated: false });
    setActiveSlide(0);
  }, [SW]);

  function onCarouselScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP_W);
    setActiveSlide(idx);
  }

  function scrollTo(idx: number) {
    const clamped = Math.max(0, Math.min(idx, TILES.length - 1));
    carouselRef.current?.scrollTo({ x: clamped * SNAP_W, animated: true });
    setActiveSlide(clamped);
  }

  const comEff = QC.comQuota > 0 ? (QC.comCollection / QC.comQuota) * 100 : 0;
  const nComEff =
    QC.nComQuota > 0 ? (QC.nComCollection / QC.nComQuota) * 100 : 0;
  const comAde =
    QC.comAcctDue > 0 ? (QC.comAcctCollection / QC.comAcctDue) * 100 : 0;
  const nComAde =
    QC.nComAcctDue > 0 ? (QC.nComAcctCollection / QC.nComAcctDue) * 100 : 0;

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      style={{ backgroundColor: C.bg }}
      contentContainerStyle={[
        s.content,
        {
          paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24,
          paddingHorizontal: PADDING_H,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Account Overview ──────────────────────────── */}
      <SectionLabel
        title="Account Overview"
        subtitle="Month-over-month account metrics"
      />
      {isTablet ? (
        // Tablets: 2-column static grid
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: TILE_GAP,
            marginBottom: 4,
          }}
        >
          {TILES.map((tile, i) => (
            <View key={i} style={{ width: CELL_W }}>
              <Tile tile={tile} />
            </View>
          ))}
        </View>
      ) : (
        // Phones: swipeable carousel with dots
        <>
          <ScrollView
            ref={carouselRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onCarouselScroll}
            decelerationRate="fast"
            snapToInterval={SNAP_W}
            snapToAlignment="start"
            contentContainerStyle={{ paddingRight: TILE_GAP }}
          >
            {TILES.map((tile, i) => (
              <View
                key={i}
                style={{
                  width: CARD_W,
                  marginRight: i < TILES.length - 1 ? TILE_GAP : 0,
                }}
              >
                <Tile tile={tile} />
              </View>
            ))}
          </ScrollView>
          {/* Dots + arrows */}
          <View style={s.dotsRow}>
            <TouchableOpacity
              onPress={() => scrollTo(activeSlide - 1)}
              style={s.arrowBtn}
              activeOpacity={0.7}
            >
              <ChevronLeft size={16} color={C.primary} strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={s.dots}>
              {TILES.map((_, i) => (
                <View
                  key={i}
                  style={[s.dot, activeSlide === i && s.dotActive]}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={() => scrollTo(activeSlide + 1)}
              style={s.arrowBtn}
              activeOpacity={0.7}
            >
              <ChevronRight size={16} color={C.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── Efficiency ────────────────────────────────── */}
      <SectionLabel
        title="Efficiency"
        subtitle="Quota vs. collection performance"
      />

      <Card
        icon={TrendingUp}
        iconColor={C.body}
        title="Quota & Collection"
        subtitle="Amount targets"
      >
        <RowItem label="Comm. Quota" value={fmtPeso(QC.comQuota)} />
        <RowItem label="Comm. Collection" value={fmtPeso(QC.comCollection)} />

        <RowItem label="Non-Comm. Quota" value={fmtPeso(QC.nComQuota)} />
        <RowItem
          label="Non-Comm. Collection"
          value={fmtPeso(QC.nComCollection)}
          last
        />
      </Card>

      <Card
        icon={Users}
        iconColor={C.body}
        title="Accounts Due & Collected"
        subtitle="Account count targets"
      >
        <RowItem label="Comm. Accounts Due" value={QC.comAcctDue} />
        <RowItem
          label="Comm. Accounts Collected"
          value={QC.comAcctCollection}
        />

        <RowItem label="Non-Comm. Accounts Due" value={QC.nComAcctDue} />
        <RowItem
          label="Non-Comm. Accounts Collected"
          value={QC.nComAcctCollection}
          last
        />
      </Card>

      <Card
        icon={Zap}
        iconColor={C.body}
        title="Efficiency Rates"
        subtitle="Collection efficiency"
      >
        <View style={s.donutGrid}>
          {[
            {
              title: "CVE Com",
              pct: comEff,
              color: comEff < 50 ? "#F87171" : C.primary,
              bg: comEff < 50 ? "#FECACA" : "#D1FAE5",
            },
            {
              title: "CVE NCom",
              pct: nComEff,
              color: nComEff < 50 ? "#F87171" : C.primary,
              bg: nComEff < 50 ? "#FECACA" : "#D1FAE5",
            },
            {
              title: "ADE Com",
              pct: comAde,
              color: comAde < 50 ? "#F87171" : C.primary,
              bg: comAde < 50 ? "#FECACA" : "#D1FAE5",
            },
            {
              title: "ADE NCom",
              pct: nComAde,
              color: nComAde < 50 ? "#F87171" : C.primary,
              bg: nComAde < 50 ? "#FECACA" : "#D1FAE5",
            },
          ].map((d, i) => (
            <View key={i} style={[s.donutCell, isTablet && { width: "25%" }]}>
              <DonutChart
                percentage={d.pct}
                color={d.color}
                bgColor={d.bg}
                size={72}
                thickness={10}
              />
              <Text style={s.donutLabel}>{d.title}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* ── Performance ───────────────────────────────── */}
      <SectionLabel
        title="Performance"
        subtitle="Sales rankings and monthly trends"
      />

      <Card
        icon={Trophy}
        iconColor={C.body}
        title="Sales Agent Leaderboard"
        subtitle="Ranked by new sales this month"
      >
        {LEADERBOARD.map((a, i) => (
          <LeaderItem
            key={i}
            name={a.name}
            ns={a.ns}
            max={LEADERBOARD[0].ns}
            rank={i + 1}
          />
        ))}
      </Card>

      <Card
        icon={BarChart2}
        iconColor={C.body}
        title="Monthly New Sales"
        subtitle="New plans enrolled per month"
      >
        <View style={s.yearRow}>
          {["2026", "2025", "2024"].map((y) => (
            <TouchableOpacity
              key={y}
              onPress={() => setYear(y)}
              style={[s.yearBtn, year === y && s.yearBtnActive]}
              activeOpacity={0.75}
            >
              <Text style={[s.yearBtnText, year === y && s.yearBtnTextActive]}>
                {y}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <BarChart key={year} data={chartData} />
      </Card>
    </Animated.ScrollView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  content: {
    paddingTop: 16,
    gap: 4,
  },

  // Greeting
  greetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greet: {
    fontSize: 20,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.3,
  },
  greetSub: {
    fontSize: 13,
    color: C.muted,
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Section
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 1,
  },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: C.muted,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  cardIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 19,
    color: C.ink,
  },
  cardSub: {
    fontSize: 11,
    color: C.muted,
    marginTop: 1,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
  },

  // Row item
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    // borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rowLabel: {
    fontSize: 13,
    color: C.muted,
    flexShrink: 1,
  },
  rowDots: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: C.dots,
    borderStyle: "dashed",
    marginHorizontal: 6,
    marginBottom: 3,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: "600",
    color: C.body,
    textAlign: "right",
  },
  separator: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 2,
  },

  // Tile (carousel)
  tile: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 18,
    position: "relative",
    overflow: "hidden",
    marginBottom: 4,
  },
  tileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  tileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: C.body,
  },
  tileValue: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.8,
    color: C.ink,
    lineHeight: 40,
  },
  tileMomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 6,
    paddingTop: 6,
    // borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  tilePriorLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tilePriorVal: {
    fontSize: 13,
    fontWeight: "600",
    color: C.body,
    marginTop: 2,
  },
  tileTrendCol: {
    alignItems: "flex-end",
    gap: 3,
  },
  tilePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tilePillText: {
    fontSize: 13,
    fontWeight: "700",
  },
  tileChangeLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Carousel dots + arrows
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.border,
  },
  dotActive: {
    backgroundColor: C.primary,
    width: 18,
  },

  // Donut grid
  donutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 8,
  },
  donutCell: {
    width: "50%",
    alignItems: "center",
    paddingVertical: 12,
    gap: 6,
  },
  donutLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: C.muted,
    textAlign: "center",
  },

  // Leaderboard
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    // borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 9,
    fontWeight: "700",
  },
  leaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  leaderAvatarText: {
    fontSize: 11,
    fontWeight: "700",
  },
  leaderName: {
    fontSize: 13,
    fontWeight: "600",
    color: C.body,
  },
  leaderNs: {
    fontSize: 11,
    color: C.muted,
    marginTop: 1,
  },
  leaderPct: {
    fontSize: 9,
    fontWeight: "600",
    color: C.muted,
    textAlign: "right",
    marginBottom: 3,
  },
  barTrack: {
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },

  // Bar chart
  yearRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 6,
    marginBottom: 12,
  },
  yearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: C.border,
  },
  yearBtnActive: {
    backgroundColor: C.primary,
  },
  yearBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.muted,
  },
  yearBtnTextActive: {
    color: "#fff",
  },
  barChartWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: BAR_GAP,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  barCol: {
    width: BAR_W,
    alignItems: "center",
    gap: 4,
  },
  barValLabel: {
    fontSize: 8,
    color: C.muted,
    fontWeight: "600",
  },
  barBody: {
    justifyContent: "flex-end",
    alignItems: "center",
  },
  barActual: {
    width: BAR_W,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  barMonthLabel: {
    fontSize: 9,
    color: C.muted,
    fontWeight: "500",
  },
});
