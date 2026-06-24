import { LinearGradient } from "expo-linear-gradient";
import { usePathname } from "expo-router";
import { Coins, DollarSign, Home, Receipt, User } from "lucide-react-native";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNav } from "@/context/nav-context";

export const BOTTOM_NAV_HEIGHT = 68;

// Active tab design constants (translated from CSS design tokens)
const ACTIVE_GRADIENT_COLORS = [
  "rgba(255,255,255,0.38)",
  "rgba(255,255,255,0.10)",
] as const;
// 160deg CSS → expo-linear-gradient start/end (upper-left → lower-right)
const ACTIVE_GRADIENT_START = { x: 0.33, y: 0.03 };
const ACTIVE_GRADIENT_END = { x: 0.67, y: 0.97 };
const ACTIVE_BORDER_COLOR = "rgba(255,255,255,0.55)";
const ACTIVE_TOP_HIGHLIGHT = "rgba(255,255,255,0.80)";

const C = {
  light: {
    bg: "#ffffff",
    border: "rgba(0,0,0,0.07)",
    active: "#059669",
    inactive: "#9ca3af",
    activePillBase: "#ecfdf5",
    activeLabel: "#022c22",
    inactiveLabel: "#9ca3af",
    shadow: "#000",
  },
  dark: {
    bg: "#0d1f1a",
    border: "rgba(255,255,255,0.06)",
    active: "#34d399",
    inactive: "#4b5563",
    activePillBase: "#064e3b",
    activeLabel: "#6ee7b7",
    inactiveLabel: "#6b7280",
    shadow: "#000",
  },
};

const TABS = [
  { name: "index", path: "/", label: "Home", Icon: Home },
  { name: "mcpr", path: "/mcpr", label: "MCPR", Icon: Receipt },
  { name: "payment", path: "/payment", label: "Payment", Icon: DollarSign },
  { name: "comte", path: "/comte", label: "ComTe", Icon: Coins },
  { name: "profile", path: "/profile", label: "Profile", Icon: User },
] as const;

function isTabActive(tabPath: string, pathname: string): boolean {
  if (tabPath === "/") return pathname === "/" || pathname === "/index";
  return pathname === tabPath || pathname.startsWith(tabPath + "/");
}

export function BottomNavBar() {
  const { bottomNavY, navigateTo } = useNav();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const c = C[scheme === "dark" ? "dark" : "light"];

  const bottomPad = Math.max(insets.bottom, 8);
  const totalHeight = BOTTOM_NAV_HEIGHT + bottomPad;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomNavY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: c.bg,
          borderTopColor: c.border,
          paddingBottom: bottomPad,
          height: totalHeight,
          shadowColor: c.shadow,
        },
        animatedStyle,
      ]}
    >
      {TABS.map((tab) => {
        const active = isTabActive(tab.path, pathname);
        const color = active ? c.active : c.inactive;

        return (
          <TouchableOpacity
            key={tab.name}
            style={[
              styles.tab,
              active && [styles.tabActive, { backgroundColor: c.bg }],
            ]}
            onPress={() => navigateTo(tab.path)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
            activeOpacity={0.72}
          >
            {active && (
              <LinearGradient
                colors={ACTIVE_GRADIENT_COLORS}
                start={ACTIVE_GRADIENT_START}
                end={ACTIVE_GRADIENT_END}
                style={[StyleSheet.absoluteFill, styles.tabGradient]}
              />
            )}
            <tab.Icon
              size={22}
              color={color}
              strokeWidth={active ? 2.3 : 1.7}
            />
            <Text
              style={[
                styles.label,
                {
                  color: active ? c.activeLabel : c.inactiveLabel,
                  fontWeight: active ? "700" : "500",
                },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 6,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 5 },
    }),
    zIndex: 100,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  tabActive: {
    borderWidth: 1,
    borderColor: ACTIVE_BORDER_COLOR,
    borderTopWidth: 1.5,
    borderTopColor: ACTIVE_TOP_HIGHLIGHT,
    ...Platform.select({
      ios: {
        // iOS shadow requires an opaque backgroundColor on this view
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      // elevation must exceed container's elevation: 5 to be visible
      android: { elevation: 2 },
    }),
  },
  tabGradient: {
    borderRadius: 12,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
});
