import { X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, theme } from "./theme";

// ── Constants ────────────────────────────────────────────────────────────────

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.5;

// ── Types ────────────────────────────────────────────────────────────────────

export type SwipeDismissModalProps = {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  children: React.ReactNode;
  /** Width of the right-side panel on tablet. Default 460. */
  sheetWidth?: number;
};

// ── Component ────────────────────────────────────────────────────────────────

export function SwipeDismissModal({
  visible,
  onDismiss,
  title,
  children,
  sheetWidth = 460,
}: SwipeDismissModalProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = screenWidth >= 768;

  const [mounted, setMounted] = useState(false);
  // Single animated value: translateY on mobile, translateX on tablet.
  const animValue = useRef(new Animated.Value(1000)).current;

  // Refs for PanResponder — always see the latest render values.
  const scrollAtRest = useRef(true);
  const dismissingRef = useRef(false);
  const wasVisibleRef = useRef(false);
  const isTabletRef = useRef(isTablet);
  isTabletRef.current = isTablet;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const sheetWidthRef = useRef(sheetWidth);
  sheetWidthRef.current = sheetWidth;

  // ── Animation helpers ─────────────────────────────────────────────────────

  function snapBack() {
    Animated.spring(animValue, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start();
  }

  function doAnimateOut() {
    if (dismissingRef.current) return;
    dismissingRef.current = true;
    // Reset before parent's onDismiss fires so our useEffect guard doesn't
    // re-trigger the animation when `visible` flips to false.
    wasVisibleRef.current = false;
    const offscreen = isTabletRef.current ? sheetWidthRef.current : 1000;
    Animated.spring(animValue, {
      toValue: offscreen,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start(() => {
      dismissingRef.current = false;
      setMounted(false);
      onDismissRef.current();
    });
  }

  // Keep refs current so PanResponder closures call the latest version.
  const snapBackRef = useRef(snapBack);
  snapBackRef.current = snapBack;
  const doAnimateOutRef = useRef(doAnimateOut);
  doAnimateOutRef.current = doAnimateOut;

  // ── PanResponder ─────────────────────────────────────────────────────────

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // Non-scroll zones: activate on intentional swipe in the dismiss axis.
      onMoveShouldSetPanResponder: (_, { dy, dx }) =>
        isTabletRef.current
          ? dx > 8 && dx > Math.abs(dy)
          : dy > 8 && dy > Math.abs(dx),
      // Capture phase inside the ScrollView zone: only when content is at rest.
      onMoveShouldSetPanResponderCapture: (_, { dy, dx }) =>
        isTabletRef.current
          ? scrollAtRest.current && dx > 12 && dx > Math.abs(dy) * 1.5
          : scrollAtRest.current && dy > 12 && dy > Math.abs(dx) * 1.5,
      onPanResponderMove: (_, { dy, dx }) => {
        const delta = isTabletRef.current ? dx : dy;
        if (delta > 0) animValue.setValue(delta);
      },
      onPanResponderRelease: (_, { dy, dx, vy, vx }) => {
        const delta = isTabletRef.current ? dx : dy;
        const vel = isTabletRef.current ? vx : vy;
        if (delta > DISMISS_DISTANCE || vel > DISMISS_VELOCITY) {
          doAnimateOutRef.current();
        } else {
          snapBackRef.current();
        }
      },
      onPanResponderTerminate: () => snapBackRef.current(),
    }),
  ).current;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      // Becoming visible → mount and prime the off-screen position.
      // The entrance spring fires in the Modal's onShow callback.
      wasVisibleRef.current = true;
      animValue.setValue(isTablet ? sheetWidth : 1000);
      setMounted(true);
    } else if (!visible && wasVisibleRef.current && !dismissingRef.current) {
      // Parent dismissed externally (hardware back button, etc.).
      doAnimateOutRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!mounted) return null;

  const effectiveWidth = Math.min(sheetWidth, Math.round(screenWidth * 0.88));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={doAnimateOut}
      onShow={() => {
        // Entrance animation — fires once the native Modal is on screen.
        Animated.spring(animValue, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      }}
    >
      <View style={s.container}>
        {/* Backdrop — tapping it dismisses the sheet. */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={doAnimateOut}
        />

        {/* Sheet */}
        <Animated.View
          style={[
            s.sheet,
            isTablet
              ? {
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: effectiveWidth,
                  borderTopLeftRadius: theme.radius.xl,
                  borderBottomLeftRadius: theme.radius.xl,
                  paddingTop: insets.top,
                  paddingBottom: Math.max(insets.bottom, 16),
                  transform: [{ translateX: animValue }],
                }
              : {
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  maxHeight: screenHeight * 0.92,
                  borderTopLeftRadius: theme.radius.xl,
                  borderTopRightRadius: theme.radius.xl,
                  paddingBottom: Math.max(insets.bottom + 8, 16),
                  transform: [{ translateY: animValue }],
                },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag handle — mobile only */}
          {!isTablet && (
            <View style={s.pillRow}>
              <View style={s.pill} />
            </View>
          )}

          {/* Title bar */}
          <View style={[s.titleRow, { borderBottomColor: theme.color.border }]}>
            {title ? (
              <Text
                style={[s.titleText, { color: theme.color.ink }]}
                numberOfLines={1}
              >
                {title}
              </Text>
            ) : (
              <View />
            )}
            <TouchableOpacity
              style={[s.closeBtn, { backgroundColor: palette.mutedBg }]}
              onPress={doAnimateOut}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color={theme.color.muted} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={({ nativeEvent }) => {
              scrollAtRest.current = nativeEvent.contentOffset.y <= 2;
            }}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {/* Footer hint */}
          <View style={[s.footer, { borderTopColor: theme.color.border }]}>
            <Text style={[s.footerHint, { color: theme.color.muted }]}>
              {isTablet ? "→  Swipe right to dismiss" : "↓  Swipe down to dismiss"}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: palette.white,
    // Elevation / shadow — applies to both mobile and tablet.
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 18,
  },
  pillRow: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  pill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.dots,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.1,
    textTransform: "uppercase",
    marginRight: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerHint: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
