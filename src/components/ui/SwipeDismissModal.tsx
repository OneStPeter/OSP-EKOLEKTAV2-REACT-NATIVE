import { X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, theme } from "./theme";

// ── Constants ────────────────────────────────────────────────────────────────

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 600; // px/s

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
  // Single shared value: translateX on tablet, translateY on mobile.
  const translate = useSharedValue(1000);
  const dragStart = useSharedValue(0);
  // Tracks the sheet's own ScrollView offset — the vertical dismiss swipe
  // (mobile) is only allowed to engage while content is scrolled to the top.
  const scrollY = useSharedValue(0);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const dismissingRef = useRef(false);
  const wasVisibleRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  function finishDismiss() {
    dismissingRef.current = false;
    setMounted(false);
    onDismissRef.current();
  }

  function doAnimateOut() {
    if (dismissingRef.current) return;
    dismissingRef.current = true;
    // Reset before parent's onDismiss fires so our useEffect guard doesn't
    // re-trigger the animation when `visible` flips to false.
    wasVisibleRef.current = false;
    const offscreen = isTablet ? sheetWidth : 1000;
    translate.value = withTiming(
      offscreen,
      { duration: 180, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(finishDismiss)();
      },
    );
  }

  const doAnimateOutRef = useRef(doAnimateOut);
  doAnimateOutRef.current = doAnimateOut;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      // Becoming visible → mount and prime the off-screen position.
      // The entrance spring fires in the Modal's onShow callback.
      wasVisibleRef.current = true;
      translate.value = isTablet ? sheetWidth : 1000;
      setMounted(true);
    } else if (!visible && wasVisibleRef.current && !dismissingRef.current) {
      // Parent dismissed externally (hardware back button, etc.).
      doAnimateOutRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Recreated each render (cheap — gesture callbacks run as UI-thread
  // worklets and don't trigger React re-renders) so closures over
  // `isTablet`/`sheetWidth`/`doAnimateOut` are always fresh.
  const panGesture = Gesture.Pan()
    .onStart(() => {
      dragStart.value = translate.value;
    })
    .onUpdate((e) => {
      if (isTablet) {
        translate.value = Math.max(0, dragStart.value + e.translationX);
      } else {
        if (scrollY.value > 2) return;
        translate.value = Math.max(0, dragStart.value + e.translationY);
      }
    })
    .onEnd((e) => {
      const delta = isTablet ? e.translationX : e.translationY;
      const vel = isTablet ? e.velocityX : e.velocityY;
      if (delta > DISMISS_DISTANCE || vel > DISMISS_VELOCITY) {
        runOnJS(doAnimateOut)();
      } else {
        translate.value = withTiming(0, {
          duration: 160,
          easing: Easing.out(Easing.cubic),
        });
      }
    })
    [isTablet ? "activeOffsetX" : "activeOffsetY"](10)
    // Cast: gesture-handler's GestureRef typing doesn't line up with a plain
    // component ref's instance type, but a ref-to-native-view is exactly
    // what this API expects at runtime.
    .simultaneousWithExternalGesture(
      scrollRef as unknown as React.RefObject<React.ComponentType | null>,
    );

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: isTablet
      ? [{ translateX: translate.value }]
      : [{ translateY: translate.value }],
  }));

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
        translate.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
      }}
    >
      {/* Modal spawns a separate native root on iOS — gesture handlers need
          their own GestureHandlerRootView inside it to function at all. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={s.container}>
          {/* Backdrop — tapping it dismisses the sheet. */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={doAnimateOut}
          />

          {/* Sheet */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                s.sheet,
                animatedSheetStyle,
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
                    },
              ]}
            >
              {/* Drag handle — mobile only */}
              {!isTablet && (
                <View style={s.pillRow}>
                  <View style={s.pill} />
                </View>
              )}

              {/* Title bar */}
              <View
                style={[s.titleRow, { borderBottomColor: theme.color.border }]}
              >
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
                ref={scrollRef}
                style={s.scroll}
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>

              {/* Footer hint */}
              <View style={[s.footer, { borderTopColor: theme.color.border }]}>
                <Text style={[s.footerHint, { color: theme.color.muted }]}>
                  {isTablet ? "Swipe Right to Dismiss" : "Swipe Down to Dismiss"}
                </Text>
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
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
