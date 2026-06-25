import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

import { BOTTOM_NAV_HEIGHT } from "@/components/navigation/BottomNavBar";
import { ChatbotMessenger } from "./ChatbotMessenger";

const FAB_SIZE = 64;
const EDGE_GAP = 32;

function RobotIcon() {
  return (
    <Svg viewBox="0 0 44 44" width={40} height={40} fill="none">
      <Path
        d="M10 22 Q10 10 22 10 Q34 10 34 22"
        stroke="#94a3b8"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <Rect x={7} y={20} width={5.5} height={8} rx={2.75} fill="#475569" />
      <Rect x={31.5} y={20} width={5.5} height={8} rx={2.75} fill="#475569" />
      <Rect
        x={11}
        y={14}
        width={22}
        height={19}
        rx={5.5}
        fill="white"
        fillOpacity={0.92}
      />
      <Rect x={14} y={17} width={16} height={13} rx={3.5} fill="#0f172a" />
      <Circle cx={19} cy={22} r={3} fill="#00d4aa" fillOpacity={0.25} />
      <Circle cx={25} cy={22} r={3} fill="#00d4aa" fillOpacity={0.25} />
      <Circle cx={19} cy={22} r={2} fill="#00d4aa" />
      <Circle cx={25} cy={22} r={2} fill="#00d4aa" />
      <Circle cx={19.6} cy={21.4} r={0.6} fill="white" fillOpacity={0.7} />
      <Circle cx={25.6} cy={21.4} r={0.6} fill="white" fillOpacity={0.7} />
      <Path
        d="M17.5 26.5 Q22 30 26.5 26.5"
        stroke="#00d4aa"
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <Line
        x1={22}
        y1={14}
        x2={22}
        y2={10}
        stroke="#94a3b8"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle cx={22} cy={8.5} r={2} fill="#00d4aa" />
      <Circle cx={22} cy={8.5} r={3} fill="#00d4aa" fillOpacity={0.2} />
      <Rect
        x={19}
        y={33}
        width={6}
        height={3}
        rx={1.5}
        fill="#cbd5e1"
        fillOpacity={0.6}
      />
    </Svg>
  );
}

function getSnappedPos(
  x: number,
  y: number,
  sw: number,
  sh: number,
): { x: number; y: number } {
  const dL = x;
  const dR = sw - x - FAB_SIZE;
  const dT = y;
  const dB = sh - y - FAB_SIZE;
  const min = Math.min(dL, dR, dT, dB);
  const clampY = (v: number) =>
    Math.max(EDGE_GAP, Math.min(v, sh - FAB_SIZE - EDGE_GAP));
  const clampX = (v: number) =>
    Math.max(EDGE_GAP, Math.min(v, sw - FAB_SIZE - EDGE_GAP));
  if (min === dL) return { x: EDGE_GAP, y: clampY(y) };
  if (min === dR) return { x: sw - FAB_SIZE - EDGE_GAP, y: clampY(y) };
  if (min === dT) return { x: clampX(x), y: EDGE_GAP };
  return { x: clampX(x), y: sh - FAB_SIZE - EDGE_GAP };
}

export function ChatbotFAB() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [messengerOpen, setMessengerOpen] = useState(false);

  const bottomOffset = BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, 8) + 12;
  const initX = width - FAB_SIZE - EDGE_GAP;
  const initY = height - FAB_SIZE - EDGE_GAP - bottomOffset;

  // RN Animated handles position + opacity (compatible with PanResponder)
  const position = useRef(new Animated.ValueXY({ x: initX, y: initY })).current;
  const fabOpacity = useRef(new Animated.Value(1)).current;

  // Track current absolute position for snap calculation
  const currentPos = useRef({ x: initX, y: initY });
  useEffect(() => {
    const id = position.addListener((v) => {
      currentPos.current = v;
    });
    return () => position.removeListener(id);
  }, []);

  // Fade when messenger opens/closes
  useEffect(() => {
    Animated.timing(fabOpacity, {
      toValue: messengerOpen ? 0 : 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [messengerOpen]);

  // Single progress value drives both scale and opacity — classic ping
  const pulseProgress = useSharedValue(0);

  useEffect(() => {
    pulseProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0, { duration: 0 }),
        withTiming(0, { duration: 1600 }),
      ),
      -1,
      false,
    );
  }, []);

  const hasMoved = useRef(false);

  // Recreate PanResponder when screen dimensions change (orientation)
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          hasMoved.current = false;
          // Shift current value into offset so delta starts at 0
          position.extractOffset();
        },
        onPanResponderMove: (_, gs) => {
          if (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4) {
            hasMoved.current = true;
          }
          position.setValue({ x: gs.dx, y: gs.dy });
        },
        onPanResponderRelease: () => {
          // Merge offset back into value for accurate currentPos
          position.flattenOffset();
          if (!hasMoved.current) {
            setMessengerOpen(true);
          } else {
            const { x, y } = currentPos.current;
            const snapped = getSnappedPos(x, y, width, height);
            Animated.spring(position, {
              toValue: snapped,
              useNativeDriver: false,
              tension: 80,
              friction: 10,
            }).start();
          }
        },
      }),
    [width, height],
  );

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseProgress.value, [0, 1], [0.45, 0]),
    transform: [{ scale: interpolate(pulseProgress.value, [0, 1], [1, 1.4]) }],
  }));

  return (
    <>
      <Animated.View
        style={[
          styles.wrapper,
          {
            transform: position.getTranslateTransform(),
            opacity: fabOpacity,
          },
        ]}
        pointerEvents={messengerOpen ? "none" : "auto"}
        {...panResponder.panHandlers}
      >
        {/* Pulse ring — behind the button, non-interactive */}
        <Reanimated.View
          style={[styles.pulseRing, pulseStyle]}
          pointerEvents="none"
        />

        {/* FAB visual */}
        <View style={styles.fab}>
          <LinearGradient
            colors={["rgba(0,168,80,0.22)", "rgba(0,80,40,0.28)"]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.fabGradient]}
          />
          <RobotIcon />
        </View>
      </Animated.View>

      <ChatbotMessenger open={messengerOpen} onOpenChange={setMessengerOpen} />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    top: 0,
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: 200,
    // overflow defaults to visible — lets pulse ring extend beyond FAB bounds
  },
  pulseRing: {
    position: "absolute",
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: "rgba(0,220,110,1)",
    left: 0,
    top: 0,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    // Opaque base so iOS renders the shadow correctly
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    borderWidth: 1.5,
    borderColor: "rgba(0,220,110,0.38)",
    ...Platform.select({
      ios: {
        shadowColor: "#00783a",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  fabGradient: {
    borderRadius: FAB_SIZE / 2,
  },
});
