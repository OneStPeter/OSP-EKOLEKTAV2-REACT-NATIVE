import { Image } from "expo-image";
import { useThemedStyles, type StPeterTheme } from "osp-ui-kit-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

export function SplashOverlay() {
  const styles = useThemedStyles(createStyles);
  const [visible, setVisible] = useState(true);

  function finish() {
    setVisible(false);
    onFinish?.();
  }

  // Logo
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.3);

  // Pulse ring
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  // Brand text
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(12);

  // Full overlay fade-out
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    // ── 1. Logo enters ──────────────────────────────────────────────────────
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    logoScale.value = withDelay(
      200,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.4)) }),
    );

    // ── 2. Ring pulse ────────────────────────────────────────────────────────
    ringOpacity.value = withDelay(700, withTiming(0.55, { duration: 100 }));
    ringScale.value = withDelay(
      700,
      withTiming(2.2, { duration: 700, easing: Easing.out(Easing.quad) }),
    );
    // fade ring out during expansion
    ringOpacity.value = withDelay(
      750,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }),
    );

    // ── 3. Brand text rises in ───────────────────────────────────────────────
    textOpacity.value = withDelay(650, withTiming(1, { duration: 450 }));
    textY.value = withDelay(
      650,
      withTiming(0, { duration: 450, easing: Easing.out(Easing.quad) }),
    );

    // ── 4. Overlay fades out ─────────────────────────────────────────────────
    overlayOpacity.value = withDelay(
      1600,
      withTiming(0, { duration: 500 }, (finished) => {
        "worklet";
        if (finished) runOnJS(finish)();
      }),
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      {/* Subtle glow orb behind logo */}
      <View style={styles.glowOrb} />

      {/* Pulse ring */}
      <Animated.View style={[styles.ring, ringStyle]} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <View style={styles.logoBox}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
      </Animated.View>

      {/* Brand text */}
      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text style={styles.brandTitle}>One St. Peter</Text>
        <Text style={styles.brandSub}>LIFE PLAN OPERATIONS</Text>
      </Animated.View>
    </Animated.View>
  );
}

const LOGO_BOX = 96;
const RING_SIZE = LOGO_BOX + 24;

const createStyles = (t: StPeterTheme) =>
  StyleSheet.create({
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: t.colors.canvas,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    },
    glowOrb: {
      position: "absolute",
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: t.colors.primaryTint,
    },
    ring: {
      position: "absolute",
      width: RING_SIZE,
      height: RING_SIZE,
      borderRadius: RING_SIZE / 2,
      borderWidth: 1.5,
      borderColor: t.colors.primary,
    },
    logoWrap: {
      alignItems: "center",
      justifyContent: "center",
    },
    logoBox: {
      width: LOGO_BOX,
      height: LOGO_BOX,
      borderRadius: 28,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.hairline,
      boxShadow: t.shadows.card,
      alignItems: "center",
      justifyContent: "center",
    },
    logo: {
      width: 64,
      height: 64,
    },
    textWrap: {
      alignItems: "center",
      marginTop: 28,
      gap: 6,
    },
    brandTitle: {
      ...t.textStyles.heading2xl,
      ...t.font("heading", "700"),
      letterSpacing: -0.3,
    },
    brandSub: {
      ...t.font("ui", "600"),
      fontSize: t.fontSizes["2xs"],
      color: t.colors.primary,
      letterSpacing: 3,
      textTransform: "uppercase",
    },
  });
