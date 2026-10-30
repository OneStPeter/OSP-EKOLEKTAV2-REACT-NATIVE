import {
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserMinus,
  UserPlus,
  UserX,
} from "lucide-react-native";
import {
  alpha,
  BaseIconButton,
  BaseText,
  BrandedAvatar,
  Caption,
  Card,
  MetricCard,
  RowItem,
  SectionTitle,
  SegmentedControl,
  Small,
  useAppUser,
  useTheme,
  useThemedStyles,
  type MetricAccent,
  type StPeterTheme,
} from "osp-ui-kit-native";
import React, { useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
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
import Svg, { Circle } from "react-native-svg";

import { useUserProfile } from "@/context/user-profile-context";

// ── Static data ────────────────────────────────────────────────────────────
const PLANHOLDERS = {
  newSales: 11,
  prevNewSales: 8,
  activeAccounts: 1210,
  prevActiveAccounts: 1185,
  lapsedAccounts: 22,
  prevLapsedAccounts: 15,
  terminatedAccounts: 2,
  prevTerminatedAccounts: 5,
};

const PROFIT = {
  current: 1284500,
};

const QC = {
  comQuota: 582000,
  comCollection: 423150,
  nComQuota: 234000,
  nComCollection: 188700,
  comAcctDue: 750,
  comAcctCollection: 620,
  nComAcctDue: 460,
  nComAcctCollection: 385,
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
  accent: MetricAccent;
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
    accent: "success",
  },
  {
    Icon: UserCheck,
    title: "Active Accounts",
    value: PLANHOLDERS.activeAccounts.toLocaleString(),
    prevVal: PLANHOLDERS.prevActiveAccounts.toLocaleString(),
    pct:
      ((PLANHOLDERS.activeAccounts - PLANHOLDERS.prevActiveAccounts) /
        PLANHOLDERS.prevActiveAccounts) *
      100,
    order: "asc",
    accent: "info",
  },
  {
    Icon: UserX,
    title: "Lapsed Accounts",
    value: PLANHOLDERS.lapsedAccounts.toLocaleString(),
    prevVal: PLANHOLDERS.prevLapsedAccounts.toLocaleString(),
    pct:
      ((PLANHOLDERS.lapsedAccounts - PLANHOLDERS.prevLapsedAccounts) /
        PLANHOLDERS.prevLapsedAccounts) *
      100,
    order: "desc",
    accent: "warning",
  },
  {
    Icon: UserMinus,
    title: "Terminated Accounts",
    value: PLANHOLDERS.terminatedAccounts.toLocaleString(),
    prevVal: PLANHOLDERS.prevTerminatedAccounts.toLocaleString(),
    pct:
      ((PLANHOLDERS.terminatedAccounts - PLANHOLDERS.prevTerminatedAccounts) /
        PLANHOLDERS.prevTerminatedAccounts) *
      100,
    order: "desc",
    accent: "danger",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtPeso(n: number) {
  return (
    /*₱*/ "Php " +
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
      <BaseText
        fontWeight="extrabold"
        color={color}
        numberOfLines={1}
        style={{ fontSize, lineHeight: Math.round(fontSize * 1.3) }}
      >
        {Math.round(percentage)}%
      </BaseText>
    </View>
  );
}

// ── KPI Tile ───────────────────────────────────────────────────────────────
function Tile({ tile }: { tile: TileData }) {
  const { Icon, title, value, prevVal, pct, order, accent } = tile;
  // Green when the move is good for this metric — a drop in lapsed accounts is.
  const isPositive = order === "asc" ? pct >= 0 : pct <= 0;
  const change = pct > 0 ? "increase" : pct < 0 ? "decrease" : "no change";

  return (
    <MetricCard
      icon={Icon}
      label={title}
      subtitle="| This Month"
      value={value}
      accent={accent}
      delta={`${Math.abs(pct).toFixed(1)}%`}
      deltaDirection={isPositive ? "up" : "down"}
      deltaLabel={`${change} vs ${prevVal}`}
    />
  );
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ marginTop: 8 }}>
      <SectionTitle>{title}</SectionTitle>
      {subtitle ? (
        <Small color="mutedStrong" style={{ marginTop: 1 }}>
          {subtitle}
        </Small>
      ) : null}
    </View>
  );
}

// ── Profit card ────────────────────────────────────────────────────────────
// One compact row: the signed-in user on the left, this month's profit on the right.
function ProfitCard() {
  const theme = useTheme();
  const s = useThemedStyles(makeStyles);
  const user = useAppUser();
  const { imageUri } = useUserProfile();

  return (
    <View
      style={[
        s.profitCard,
        {
          borderRadius: theme.radii.card,
          backgroundColor: theme.colors.surface,
          boxShadow: theme.shadows.card,
        },
      ]}
    >
      <BrandedAvatar
        name={user?.displayName}
        imageUrl={imageUri ?? user?.avatarUrl}
        size={40}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <BaseText
          fontSize="sm"
          fontWeight="bold"
          color="heading"
          numberOfLines={1}
        >
          {user?.displayName ?? "User"}
        </BaseText>
        {user?.position ? (
          <BaseText fontSize="xs" color="mutedStrong" numberOfLines={1}>
            {user.position}
          </BaseText>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
        <BaseText fontSize="xs" color="mutedStrong" numberOfLines={1}>
          Profit · This Month
        </BaseText>
        <BaseText
          fontSize="lg"
          fontWeight="bold"
          color="primary"
          numberOfLines={1}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {fmtPeso(PROFIT.current)}
        </BaseText>
      </View>
    </View>
  );
}

// ── Leaderboard item ───────────────────────────────────────────────────────
// Gold, silver, bronze — medal colours, deliberately outside the palette.
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
  const theme = useTheme();
  const c = theme.colors;
  const s = useThemedStyles(makeStyles);
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
        style={[s.rankBadge, { backgroundColor: isTop3 ? rankColor : c.canvas }]}
      >
        <BaseText
          fontWeight="bold"
          color={isTop3 ? "#FFFFFF" : "muted"}
          style={s.rankText}
        >
          {rank}
        </BaseText>
      </View>

      <View
        style={[s.leaderAvatar, { backgroundColor: alpha(c.primary, 0.13) }]}
      >
        <BaseText fontWeight="bold" color="primary" style={s.leaderAvatarText}>
          {initials}
        </BaseText>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <BaseText
          fontSize="sm"
          fontWeight="semibold"
          color="heading"
          numberOfLines={1}
        >
          {name}
        </BaseText>
        <Caption style={{ marginTop: 1 }}>{ns.toLocaleString()} sales</Caption>
      </View>

      <View style={{ width: 64 }}>
        <BaseText
          fontWeight="semibold"
          color="mutedStrong"
          textAlign="right"
          style={s.leaderPct}
        >
          {((ns / max) * 100).toFixed(0)}%
        </BaseText>
        <View style={s.barTrack}>
          <View
            style={[
              s.barFill,
              {
                width: barW,
                backgroundColor: isTop3 ? rankColor : c.primary,
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
  const theme = useTheme();
  const s = useThemedStyles(makeStyles);
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);
  const opacity = useSharedValue(1);

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
    <Pressable style={s.barCol} onPress={onPress}>
      <Animated.View
        style={[{ width: BAR_W, alignItems: "center", gap: 4 }, animStyle]}
      >
        {d.value > 0 && (
          <Animated.View style={labelStyle}>
            <BaseText
              fontWeight="semibold"
              color="mutedStrong"
              style={s.barValLabel}
            >
              {(d.value / 1000).toFixed(1)}k
            </BaseText>
          </Animated.View>
        )}
        <View style={[s.barBody, { height: BAR_H }]}>
          <Animated.View
            style={[
              s.barActual,
              {
                backgroundColor:
                  d.value > 0 ? theme.colors.primary : theme.colors.hairline,
              },
              barStyle,
            ]}
          />
        </View>
        <BaseText
          fontWeight="medium"
          color="mutedStrong"
          style={s.barMonthLabel}
        >
          {d.month}
        </BaseText>
      </Animated.View>
    </Pressable>
  );
}

function BarChart({ data }: { data: { month: string; value: number }[] }) {
  const s = useThemedStyles(makeStyles);
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
const YEARS = ["2026", "2025", "2024"] as const;
type Year = (typeof YEARS)[number];

export default function HomeScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const s = useThemedStyles(makeStyles);
  const { width: SW } = useWindowDimensions();
  const isTablet = SW >= 768;
  const PADDING_H = isTablet ? 24 : 16;
  const TILE_GAP = 12;
  const CARD_W = SW - PADDING_H * 2;
  const SNAP_W = CARD_W + TILE_GAP;
  const CELL_W = (CARD_W - TILE_GAP) / 2;

  const carouselRef = useRef<ScrollView>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [year, setYear] = useState<Year>("2026");
  const chartData = MONTHLY_SALES[year];

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

  // Below 50% the ring turns danger; otherwise it stays on the brand colour.
  const ring = (pct: number) =>
    pct < 50
      ? { color: c.danger, bg: c.dangerTint }
      : { color: c.primary, bg: c.successTint };

  return (
    <View style={[s.content, { paddingTop: 16, paddingHorizontal: 8 }]}>
      {/* ── Profit ──────────────────────────────────── */}
      <ProfitCard />

      {/* ── Account Overview ──────────────────────────── */}
      <SectionHeader
        title="Account Overview"
        subtitle="Month-over-month account metrics"
      />
      {isTablet ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: TILE_GAP,
          }}
        >
          {TILES.map((tile, i) => (
            <View key={i} style={{ width: CELL_W }}>
              <Tile tile={tile} />
            </View>
          ))}
        </View>
      ) : (
        <View>
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
            <BaseIconButton
              icon={ChevronLeft}
              accessibilityLabel="Previous metric"
              variant="ghost"
              size="sm"
              onPress={() => scrollTo(activeSlide - 1)}
            />

            <View style={s.dots}>
              {TILES.map((_, i) => (
                <View
                  key={i}
                  style={[s.dot, activeSlide === i && s.dotActive]}
                />
              ))}
            </View>

            <BaseIconButton
              icon={ChevronRight}
              accessibilityLabel="Next metric"
              variant="ghost"
              size="sm"
              onPress={() => scrollTo(activeSlide + 1)}
            />
          </View>
        </View>
      )}

      {/* ── Efficiency ────────────────────────────────── */}
      <SectionHeader
        title="Efficiency"
        subtitle="Quota vs. collection performance"
      />

      <Card.Root title="Quota & Collection">
        <Card.Subtitle>| Amount targets</Card.Subtitle>
        <Card.MainContent>
          <RowItem label="Comm. Quota" value={fmtPeso(QC.comQuota)} />
          <RowItem
            label="Comm. Collection"
            value={fmtPeso(QC.comCollection)}
          />
          <RowItem label="Non-Comm. Quota" value={fmtPeso(QC.nComQuota)} />
          <RowItem
            label="Non-Comm. Collection"
            value={fmtPeso(QC.nComCollection)}
          />
        </Card.MainContent>
      </Card.Root>

      <Card.Root title="Accounts Due & Collected">
        <Card.Subtitle>| Account count targets</Card.Subtitle>
        <Card.MainContent>
          <RowItem
            label="Comm. Accounts Due"
            value={QC.comAcctDue.toLocaleString()}
          />
          <RowItem
            label="Comm. Accounts Collected"
            value={QC.comAcctCollection.toLocaleString()}
          />
          <RowItem
            label="Non-Comm. Accounts Due"
            value={QC.nComAcctDue.toLocaleString()}
          />
          <RowItem
            label="Non-Comm. Accounts Collected"
            value={QC.nComAcctCollection.toLocaleString()}
          />
        </Card.MainContent>
      </Card.Root>

      <Card.Root title="Efficiency Rates">
        <Card.Subtitle>| Collection efficiency</Card.Subtitle>
        <Card.MainContent>
          <View style={s.donutGrid}>
            {[
              { title: "CVE Com", pct: comEff },
              { title: "CVE NCom", pct: nComEff },
              { title: "ADE Com", pct: comAde },
              { title: "ADE NCom", pct: nComAde },
            ].map((d, i) => {
              const { color, bg } = ring(d.pct);
              return (
                <View
                  key={i}
                  style={[s.donutCell, isTablet && { width: "25%" }]}
                >
                  <DonutChart
                    percentage={d.pct}
                    color={color}
                    bgColor={bg}
                    size={72}
                    thickness={10}
                  />
                  <Caption fontWeight="semibold" textAlign="center">
                    {d.title}
                  </Caption>
                </View>
              );
            })}
          </View>
        </Card.MainContent>
      </Card.Root>

      {/* ── Performance ───────────────────────────────── */}
      <SectionHeader
        title="Performance"
        subtitle="Sales rankings and monthly trends"
      />

      <Card.Root title="Sales Agent Leaderboard">
        <Card.Subtitle>| Ranked by new sales this month</Card.Subtitle>
        <Card.MainContent>
          {LEADERBOARD.map((a, i) => (
            <LeaderItem
              key={i}
              name={a.name}
              ns={a.ns}
              max={LEADERBOARD[0].ns}
              rank={i + 1}
            />
          ))}
        </Card.MainContent>
      </Card.Root>

      <Card.Root title="Monthly New Sales">
        <Card.Subtitle>| New plans enrolled per month</Card.Subtitle>
        <Card.MainContent>
          <View style={s.yearRow}>
            <SegmentedControl
              options={YEARS.map((y) => ({ value: y, label: y }))}
              value={year}
              onValueChange={setYear}
            />
          </View>
          <BarChart key={year} data={chartData} />
        </Card.MainContent>
      </Card.Root>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const makeStyles = (t: StPeterTheme) =>
  StyleSheet.create({
    content: {
      gap: 12,
    },

    profitCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },

    // Carousel dots + arrows
    dotsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      marginTop: 10,
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
      backgroundColor: t.colors.hairline,
    },
    dotActive: {
      backgroundColor: t.colors.primary,
      width: 18,
    },

    // Donut grid
    donutGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    donutCell: {
      width: "50%",
      alignItems: "center",
      paddingVertical: 12,
      gap: 6,
    },

    // Leaderboard
    leaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
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
      lineHeight: 12,
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
      lineHeight: 14,
    },
    leaderPct: {
      fontSize: 9,
      lineHeight: 12,
      marginBottom: 3,
    },
    barTrack: {
      height: 4,
      backgroundColor: t.colors.hairline,
      borderRadius: 2,
      overflow: "hidden",
    },
    barFill: {
      height: 4,
      borderRadius: 2,
    },

    // Year picker row
    yearRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 12,
    },

    // Bar chart
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
      lineHeight: 11,
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
      lineHeight: 12,
    },
  });
