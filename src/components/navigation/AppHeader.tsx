import { Image } from "expo-image";
import { Bell, Menu, Search } from "lucide-react-native";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNav } from "@/context/nav-context";

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
  const { toggleDrawer } = useNav();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const c = C[scheme === "dark" ? "dark" : "light"];

  const badgeCount = Math.min(notificationCount, 99);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.bg,
          paddingTop: insets.top,
          shadowColor: c.shadow,
        },
      ]}
    >
      <View style={styles.row}>
        {/* ── Left: burger + brand ── */}
        <View style={styles.left}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={toggleDrawer}
            accessibilityLabel="Open navigation menu"
            accessibilityRole="button"
            activeOpacity={0.72}
          >
            <Menu size={20} color={c.burgerColor} strokeWidth={2} />
          </TouchableOpacity>

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
        </View>

        {/* ── Right: search + notification bell ── */}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
