import { BaseText, useTheme } from "osp-ui-kit-native";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useBpisPull } from "@/services/bpis-pull.service";

// A finished pull stays on screen this long, then the bar goes away.
const DONE_VISIBLE_MS = 4000;

/** Progress of the BPIS data pull (services/bpis-pull.service). Hidden when idle. */
export function BpisPullProgress() {
  const theme = useTheme();
  const c = theme.colors;
  const pull = useBpisPull();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(false);
    if (pull.status !== "done") return;
    const timer = setTimeout(() => setHidden(true), DONE_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [pull.status]);

  const fraction = pull.total > 0 ? pull.completed / pull.total : 0;
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(fraction, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [fraction, width]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  if (pull.status === "idle" || hidden) return null;

  const isError = pull.status === "error";
  const barColor = isError ? c.danger : c.primary;
  const title =
    pull.status === "done"
      ? "BPIS data up to date"
      : isError
        ? "BPIS data pull incomplete"
        : "Pulling BPIS data";

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={title}
      accessibilityValue={{ min: 0, max: pull.total, now: pull.completed }}
      style={{
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: theme.radii.card,
        backgroundColor: c.surface,
        boxShadow: theme.shadows.card,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <BaseText
          fontSize="sm"
          fontWeight="bold"
          color="heading"
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {title}
        </BaseText>
        <BaseText
          fontSize="xs"
          fontWeight="semibold"
          color="mutedStrong"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {pull.completed} / {pull.total} tables
        </BaseText>
      </View>

      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: c.hairline,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={[
            { height: 6, borderRadius: 3, backgroundColor: barColor },
            fillStyle,
          ]}
        />
      </View>

      {pull.message ? (
        <BaseText
          fontSize="xs"
          color={isError ? "danger" : "mutedStrong"}
          numberOfLines={2}
        >
          {pull.message}
        </BaseText>
      ) : null}
    </View>
  );
}
