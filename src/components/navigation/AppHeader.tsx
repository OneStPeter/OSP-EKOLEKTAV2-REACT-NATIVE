import { Image } from "expo-image";
import { useSegments } from "expo-router";
import { Bell, ChevronLeft, Menu, Search } from "lucide-react-native";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNav } from "@/context/nav-context";

// Height of the header row, excluding the top safe-area inset. The header is
// absolutely positioned so it can scroll away with the content, so screens
// must pad their scroll content by `APP_HEADER_HEIGHT + insets.top`, the same
// way they pad the bottom for BOTTOM_NAV_HEIGHT.
export const APP_HEADER_HEIGHT = 60;

// Maps route segment names to display titles. Keep in sync with (tabs)/_layout.tsx options.
const SCREEN_TITLES: Record<string, string> = {
  mcpr: "MCPR",
  payment: "Payment",
  viewDrs: "View DRS",
  encodeDeposit: "Encode Deposit",
  disbursement: "Disbursement",
  planholderProfile: "Planholder Profile",
  profile: "Profile",
  explore: "Explore",
};

const SCREEN_SUBTITLES: Record<string, string> = {
  mcpr: "Monthly Collection & Performance",
  payment: "Payment",
  viewDrs: "View DRS",
  encodeDeposit: "Encode Deposit",
  disbursement: "Disbursement",
  planholderProfile: "Clear access to every planholder detail.",
  profile: "Profile",
  explore: "Explore",
};

const C = {
  light: {
    bg: "#ffffff",
    burgerColor: "#022c22",
    logoBg: "#f0fdf4",
    logoBorder: "#d1fae5",
    brandName: "#022c22",
    tagline: "#059669",
    shadow: "#022c22",
    actionColor: "#022c22",
    badgeBg: "#dc2626",
    badgeText: "#ffffff",
    subtitle: "#9ca3af",
    backColor: "#047857",
    pillBorder: "#a7f3d0",
    pillText: "#047857",
  },
  dark: {
    bg: "#0d1f1a",
    burgerColor: "#d1fae5",
    logoBg: "#064e3b",
    logoBorder: "#065f46",
    brandName: "#f0fdf4",
    tagline: "#34d399",
    shadow: "#000000",
    actionColor: "#d1fae5",
    badgeBg: "#dc2626",
    badgeText: "#ffffff",
    subtitle: "#9ca3af",
    backColor: "#34d399",
    pillBorder: "#065f46",
    pillText: "#34d399",
  },
};

interface Props {
  notificationCount?: number;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
}

export function AppHeader({
  notificationCount = 3,
  onSearchPress,
  onNotificationPress,
}: Props) {
  const { toggleDrawer, scrollY, headerOverride } = useNav();
  const insets = useSafeAreaInsets();
  const c = C.light;
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Slides up with the content until fully off-screen, then stays put — the
  // header only reappears once the user scrolls back toward the top.
  const totalHeight = APP_HEADER_HEIGHT + insets.top;
  const scrollStyle = useAnimatedStyle(() => {
    const offset = Math.min(Math.max(scrollY.value, 0), totalHeight);
    return { transform: [{ translateY: -offset }] };
  });

  const segments = useSegments();
  // Last segment is the tab name; fall back to "index" when on the root tab.
  const activeSegment =
    (segments[segments.length - 1] as string | undefined) ?? "index";
  const isHome = activeSegment === "index" || activeSegment === "(tabs)";
  const screenTitle = SCREEN_TITLES[activeSegment] ?? activeSegment;
  // A focused screen may override its description, swap the burger for a back
  // chevron, and mount a trailing action (e.g. the planholder detail view);
  // anything it omits falls back to the per-route defaults.
  const screenSubtitle = headerOverride?.subtitle ?? SCREEN_SUBTITLES[activeSegment];
  const onBack = headerOverride?.onBack;
  const headerAction = headerOverride?.action;

  const badgeCount = Math.min(notificationCount, 99);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: c.bg,
          paddingTop: insets.top,
          shadowColor: c.shadow,
        },
        scrollStyle,
      ]}
    >
      <View style={[styles.row, isTablet && styles.rowTablet]}>
        {/* ── Left: burger + brand / screen title ── */}
        <View style={styles.left}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onBack ?? toggleDrawer}
            accessibilityLabel={onBack ? "Go back" : "Open navigation menu"}
            accessibilityRole="button"
            activeOpacity={0.72}
          >
            {onBack ? (
              <ChevronLeft size={22} color={c.backColor} strokeWidth={2.2} />
            ) : (
              <Menu size={20} color={c.burgerColor} strokeWidth={2} />
            )}
          </TouchableOpacity>

          {isHome ? (
            <View style={styles.brandSection}>
              <View
                style={[
                  styles.logoWrap,
                  { backgroundColor: c.logoBg, borderColor: c.logoBorder },
                ]}
              >
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={styles.logoImg}
                  contentFit="contain"
                />
              </View>

              <View style={styles.brandText}>
                <Text style={[styles.brandName, { color: c.brandName }]}>
                  eKolekta
                </Text>
                <Text style={[styles.tagline, { color: c.tagline }]}>
                  LIFE PLAN OPERATIONS
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.screenTitleBlock}>
              <Text
                style={[styles.screenTitle, { color: c.brandName }]}
                numberOfLines={1}
              >
                {screenTitle}
              </Text>
              {screenSubtitle && (
                <Text
                  style={[styles.screenSubtitle, { color: c.subtitle }]}
                  numberOfLines={1}
                >
                  {screenSubtitle}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ── Right: search + notification bell — home/dashboard only ── */}
        {isHome && (
          <View style={styles.right}>
            {/* Search icon */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onSearchPress}
              accessibilityLabel="Search"
              accessibilityRole="button"
              activeOpacity={0.72}
            >
              <Search size={22} color={c.actionColor} strokeWidth={2} />
            </TouchableOpacity>

            {/* Notification bell with badge */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onNotificationPress}
              accessibilityLabel={
                badgeCount > 0
                  ? `Notifications, ${badgeCount} unread`
                  : "Notifications"
              }
              accessibilityRole="button"
              activeOpacity={0.72}
            >
              <Bell size={22} color={c.actionColor} strokeWidth={2} />
              {badgeCount > 0 && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: c.badgeBg },
                    badgeCount > 9 && styles.badgeWide,
                  ]}
                >
                  <Text style={[styles.badgeText, { color: c.badgeText }]}>
                    {badgeCount > 9 ? "9+" : String(badgeCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Right: screen-provided action pill ── */}
        {!isHome && headerAction && (
          <TouchableOpacity
            style={[
              styles.actionPill,
              { borderColor: c.pillBorder, backgroundColor: c.bg },
            ]}
            onPress={headerAction.onPress}
            accessibilityLabel={headerAction.label}
            accessibilityRole="button"
            activeOpacity={0.72}
          >
            <headerAction.icon size={16} color={c.pillText} strokeWidth={2.2} />
            <Text style={[styles.actionPillText, { color: c.pillText }]}>
              {headerAction.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 14,
      },
      android: { elevation: 5 },
    }),
  },
  row: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  rowTablet: {
    maxWidth: 1024,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 24,
  },

  // ── Left cluster ───────────────────────────────────
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },

  // ── Shared icon button ─────────────────────────────
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Brand ──────────────────────────────────────────
  brandSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImg: {
    width: 26,
    height: 26,
  },
  brandText: {
    gap: 1,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 21,
  },
  tagline: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // ── Screen title (non-home screens) ───────────────
  screenTitleBlock: {
    flex: 1,
    gap: 1,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  // ── Screen-provided action pill ────────────────────
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Right cluster ──────────────────────────────────
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  // ── Notification badge ─────────────────────────────
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeWide: {
    minWidth: 20,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 11,
  },
});
