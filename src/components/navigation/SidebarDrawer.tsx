import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { ChevronDown, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DisbursementActiveIcon,
  DisbursementIcon,
  DocCancelActiveIcon,
  DocCancelIcon,
  HomeActiveIcon,
  HomeIcon,
  McprActiveIcon,
  McprIcon,
  NavIconProps,
  PaymentActiveIcon,
  PaymentIcon,
  PlanMgmtActiveIcon,
  PlanMgmtIcon,
} from "./navIcons";

const ProfileImage = require("../../../assets/images/Profile.png");

import { useNav } from "@/context/nav-context";
import { BRAND_COLORS } from "@/constants/colors";

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIMARY_GREEN: string = BRAND_COLORS.primaryGreen;
const SUB_ROW_H = 44;

// ─── Colour theme ────────────────────────────────────────────────────────────

const C = {
  light: {
    overlay: "rgba(0,0,0,0.46)",
    drawer: "#ffffff",
    divider: "#d1d5db",
    // header
    headerBg: "#ffffff",
    headerTitle: "#022c22",
    headerSub: PRIMARY_GREEN,
    closeBg: "rgba(255,255,255,0.12)",
    avatarBg: PRIMARY_GREEN,
    avatarText: "#ffffff",
    avatarRing: "rgba(110,231,183,0.4)",
    // section label
    sectionLabel: "#9ca3af",
    // direct nav item
    itemText: "#374151",
    itemIcon: PRIMARY_GREEN,
    // active leaf item (no sub-items)
    activeItemBg: PRIMARY_GREEN,
    activeItemText: "#ffffff",
    activeItemIcon: "#ffffff",
    // parent item when expanded / has active sub-item
    expandedItemBg: "#ecfdf5",
    expandedItemText: "#022c22",
    expandedItemIcon: PRIMARY_GREEN,
    expandedBorderLeft: PRIMARY_GREEN,
    // chevron
    chevron: "#9ca3af",
    // sub-items
    subSeparator: PRIMARY_GREEN,
    subText: "#6b7280",
    subActiveBg: PRIMARY_GREEN,
    subActiveText: "#ffffff",
  },
  dark: {
    overlay: "rgba(0,0,0,0.68)",
    drawer: "#0d1f1a",
    divider: "#374151",
    headerBg: "#ffffff",
    headerTitle: "#f0fdf4",
    headerSub: "#34d399",
    closeBg: "rgba(255,255,255,0.08)",
    avatarBg: "#059669",
    avatarText: "#ffffff",
    avatarRing: "rgba(52,211,153,0.3)",
    sectionLabel: "#6b7280",
    itemText: "#d1fae5",
    itemIcon: "#34d399",
    activeItemBg: "#064e3b",
    activeItemText: "#6ee7b7",
    activeItemIcon: "#34d399",
    expandedItemBg: "#0a2018",
    expandedItemText: "#6ee7b7",
    expandedItemIcon: "#34d399",
    expandedBorderLeft: "#34d399",
    chevron: "#6b7280",
    subSeparator: "#34d399",
    subText: "#9ca3af",
    subActiveBg: "#064e3b",
    subActiveText: "#6ee7b7",
  },
};

// ─── Nav item data ────────────────────────────────────────────────────────────

type SubItem = { label: string; path: string };
type NavItemDef = {
  name: string;
  path?: string;
  label: string;
  icon: React.ComponentType<NavIconProps>;
  activeIcon: React.ComponentType<NavIconProps>;
  subItems?: SubItem[];
};

const ITEMS: NavItemDef[] = [
  {
    name: "home",
    path: "/",
    label: "Home",
    icon: HomeIcon,
    activeIcon: HomeActiveIcon,
  },
  {
    name: "mcpr",
    path: "/mcpr",
    label: "View MCPR",
    icon: McprIcon,
    activeIcon: McprActiveIcon,
  },
  {
    name: "payment",
    label: "Payment",
    icon: PaymentIcon,
    activeIcon: PaymentActiveIcon,
    subItems: [
      { label: "Encode Payment", path: "/payment/encode-payment" },
      { label: "View DRS", path: "/payment/view-drs" },
      {
        label: "Encode Validated Deposit Slip",
        path: "/payment/encode-validated-deposit",
      },
      {
        label: "View Encoded Deposit Slip",
        path: "/payment/view-validated-deposit",
      },
      { label: "Request Credit Memo", path: "/payment/credit-memo" },
    ],
  },
  {
    name: "comte",
    path: "/comte",
    label: "Disbursement",
    icon: DisbursementIcon,
    activeIcon: DisbursementActiveIcon,
  },
  {
    name: "plan-management",
    label: "Plan Management",
    icon: PlanMgmtIcon,
    activeIcon: PlanMgmtActiveIcon,
    subItems: [
      { label: "Add New Sale", path: "/plan-management/new" },
      {
        label: "Planholder Profile",
        path: "/planholderProfile",
      },
      { label: "Pre-filled LPA", path: "/plan-management/lpa" },
      { label: "Change of Mode", path: "/plan-management/change-of-mode" },
    ],
  },
  {
    name: "dc",
    path: "/dc",
    label: "Document Cancellation",
    icon: DocCancelIcon,
    activeIcon: DocCancelActiveIcon,
  },
];

// ─── NavItemRow ───────────────────────────────────────────────────────────────

interface NavItemRowProps {
  item: NavItemDef;
  pathname: string;
  navigateTo: (path: string) => void;
  c: (typeof C)["light"];
}

function NavItemRow({ item, pathname, navigateTo, c }: NavItemRowProps) {
  const hasSubItems = Boolean(item.subItems?.length);
  const totalSubH = (item.subItems?.length ?? 0) * SUB_ROW_H;

  // Active states
  const isLeafActive =
    !hasSubItems &&
    (item.path === pathname ||
      (item.path === "/" && (pathname === "/" || pathname === "/index")));
  const hasActiveSubItem =
    hasSubItems &&
    (item.subItems?.some(
      (s) => s.path === pathname || pathname.startsWith(s.path + "/"),
    ) ??
      false);

  const [expanded, setExpanded] = useState(hasActiveSubItem);

  // Reanimated shared values
  const subH = useSharedValue(hasActiveSubItem ? totalSubH : 0);
  const chevronRot = useSharedValue(hasActiveSubItem ? 1 : 0);

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    subH.value = withTiming(next ? totalSubH : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
    chevronRot.value = withTiming(next ? 1 : 0, { duration: 260 });
  }

  const subContainerStyle = useAnimatedStyle(() => ({
    height: subH.value,
    overflow: "hidden",
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(chevronRot.value, [0, 1], [0, 180])}deg` },
    ],
  }));

  // Derive row colours
  const isExpanded = expanded;
  const showExpandedState = hasSubItems && (isExpanded || hasActiveSubItem);
  const rowBg = isLeafActive
    ? c.activeItemBg
    : showExpandedState
      ? c.expandedItemBg
      : "transparent";
  const rowText = isLeafActive
    ? c.activeItemText
    : showExpandedState
      ? c.expandedItemText
      : c.itemText;
  const rowIcon = isLeafActive
    ? c.activeItemIcon
    : showExpandedState
      ? c.expandedItemIcon
      : c.itemIcon;
  const showLeftBorder = isLeafActive || hasActiveSubItem;
  const NavIcon =
    isLeafActive || hasActiveSubItem ? item.activeIcon : item.icon;

  return (
    <View>
      {/* ── Parent row ── */}
      <TouchableOpacity
        style={[
          styles.navItem,
          { backgroundColor: rowBg },
          showLeftBorder && {
            borderLeftColor: c.expandedBorderLeft,
            borderLeftWidth: 3,
          },
        ]}
        onPress={hasSubItems ? toggle : () => navigateTo(item.path!)}
        accessibilityRole="menuitem"
        accessibilityState={
          hasSubItems ? { expanded: isExpanded } : { selected: isLeafActive }
        }
        activeOpacity={0.78}
      >
        {/* Icon */}
        <View style={styles.navIconWrap}>
          <NavIcon size={20} color={rowIcon} />
        </View>

        {/* Label */}
        <Text
          style={[
            styles.navItemLabel,
            {
              color: rowText,
              fontWeight: isLeafActive || showExpandedState ? "600" : "400",
            },
          ]}
        >
          {item.label}
        </Text>

        {/* Animated chevron for collapsible items */}
        {hasSubItems && (
          <Animated.View style={chevronStyle}>
            <ChevronDown size={16} color={c.chevron} strokeWidth={2.2} />
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* ── Sub-items (animated height) ── */}
      {hasSubItems && (
        <Animated.View style={subContainerStyle}>
          <View style={styles.subWrapper}>
            {/* Vertical separator — mirrors web's <Separator orientation="vertical" /> */}
            <View
              style={[
                styles.subSeparatorLine,
                { backgroundColor: c.subSeparator },
              ]}
            />

            {/* Sub-item rows */}
            <View style={{ flex: 1 }}>
              {item.subItems!.map((sub) => {
                const isSubActive = sub.path === pathname;
                return (
                  <TouchableOpacity
                    key={sub.label}
                    style={[
                      styles.subItem,
                      isSubActive && {
                        backgroundColor: c.subActiveBg,
                        borderRadius: 8,
                      },
                    ]}
                    onPress={() => navigateTo(sub.path)}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: isSubActive }}
                    activeOpacity={0.78}
                  >
                    <Text
                      style={[
                        styles.subItemText,
                        {
                          color: isSubActive ? c.subActiveText : c.subText,
                          fontWeight: isSubActive ? "600" : "400",
                        },
                      ]}
                    >
                      {sub.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ─── SidebarDrawer ────────────────────────────────────────────────────────────

export function SidebarDrawer({
  userName = "Joyce Basilio-Ramos",
  userRole = "Sales Agent 2",
}: {
  userName?: string;
  userRole?: string;
} = {}) {
  const { drawerOpen, closeDrawer, navigateTo } = useNav();
  const router = useRouter();
  const pathname = usePathname();

  function handleSignOut() {
    closeDrawer();
    router.replace("/(auth)/login");
  }
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const c = C[scheme === "dark" ? "dark" : "light"];
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(Math.round(width * 0.82), 320);

  // Drawer slide animation
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(drawerOpen ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [drawerOpen, progress]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-drawerWidth - 10, 0]),
      },
    ],
  }));

  return (
    <>
      {/* ── Dimming overlay ── */}
      <Animated.View
        pointerEvents={drawerOpen ? "auto" : "none"}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: c.overlay, zIndex: 200 },
          overlayStyle,
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeDrawer}
          accessibilityLabel="Close menu"
        />
      </Animated.View>

      {/* ── Drawer panel ── */}
      <Animated.View
        pointerEvents={drawerOpen ? "auto" : "none"}
        style={[
          styles.drawer,
          { backgroundColor: c.drawer, width: drawerWidth },
          drawerStyle,
        ]}
      >
        {/* ── User profile header ── */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: c.headerBg,
              paddingTop: insets.top + 10,
              borderBottomColor: c.divider,
              borderBottomWidth: 1,
            },
          ]}
        >
          <View style={styles.headerRow}>
            {/* Avatar + name + role */}
            <View style={styles.profileRow}>
              <View style={[styles.avatarRing, { borderColor: c.avatarRing }]}>
                <Image source={ProfileImage} style={styles.avatar} />
              </View>

              <View style={styles.userInfo}>
                <Text
                  style={[styles.userName, { color: c.headerTitle }]}
                  numberOfLines={1}
                >
                  {userName}
                </Text>
                <Text
                  style={[styles.userRole, { color: c.headerSub }]}
                  numberOfLines={1}
                >
                  {userRole}
                </Text>
              </View>
            </View>

            {/* Close button */}
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: c.closeBg }]}
              onPress={closeDrawer}
              accessibilityLabel="Close menu"
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <X size={18} color={c.headerTitle} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Scrollable nav items ── */}
        <ScrollView
          style={styles.navScroll}
          contentContainerStyle={styles.navContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {ITEMS.map((item) => (
            <NavItemRow
              key={item.name}
              item={item}
              pathname={pathname}
              navigateTo={navigateTo}
              c={c}
            />
          ))}
        </ScrollView>

        {/* ── Footer ── */}
        <View
          style={[
            styles.footer,
            {
              borderTopColor: c.divider,
              paddingBottom: Math.max(insets.bottom, 12) + 8,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleSignOut}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="exit-outline" size={20} color="#dc2626" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <View
            style={[styles.footerDivider, { backgroundColor: c.divider }]}
          />

          <Text style={[styles.footerText, { color: c.sectionLabel }]}>
            © 2026 St. Peter Life Plans
          </Text>
          <Text style={[styles.footerVersion, { color: c.sectionLabel }]}>
            v2.0.0
          </Text>
        </View>
      </Animated.View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Drawer panel ──────────────────────────────────────────────────────
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 201,
    flexDirection: "column",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
  },

  // ── User profile header ────────────────────────────────────────────────
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 8,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  userRole: {
    fontSize: 11,
    fontWeight: "500",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // ── Nav scroll ─────────────────────────────────────────────────────────
  navScroll: {
    flex: 1,
  },
  navContent: {
    paddingTop: 14,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    paddingHorizontal: 10,
    marginBottom: 8,
  },

  // ── Nav item parent row ─────────────────────────────────────────────────
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
    marginBottom: 2,
  },
  navIconWrap: {
    width: 24,
    alignItems: "center",
  },
  navItemLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },

  // ── Sub-items ──────────────────────────────────────────────────────────
  subWrapper: {
    flexDirection: "row",
    marginLeft: 20,
    marginBottom: 4,
    gap: 10,
  },
  subSeparatorLine: {
    width: 2,
    borderRadius: 1,
    marginTop: 4,
    marginBottom: 4,
    marginLeft: 4,
  },
  subItem: {
    height: SUB_ROW_H,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  subItemText: {
    fontSize: 13,
  },

  // ── Footer ────────────────────────────────────────────────────────────
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 2,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#dc2626",
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -20,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 11,
    fontWeight: "500",
  },
  footerVersion: {
    fontSize: 10,
  },
});
