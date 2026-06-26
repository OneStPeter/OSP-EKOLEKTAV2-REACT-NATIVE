import { LinearGradient } from "expo-linear-gradient";
import { X } from "lucide-react-native";
import React from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AVATAR_SIZE = 50;

function BotAvatar() {
  return (
    <View style={styles.avatarWrap}>
      <LinearGradient
        colors={["rgba(0,168,80,0.18)", "rgba(0,60,30,0.24)"]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: AVATAR_SIZE / 2 }]}
      />
      <Svg viewBox="0 0 44 44" width={34} height={34} fill="none">
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
      {/* Online badge */}
      <View style={styles.onlineBadge} />
    </View>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatbotMessenger({ open, onOpenChange }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 600;

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => onOpenChange(false)}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => onOpenChange(false)}
          activeOpacity={1}
        />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
            isWide && {
              width: Math.min(540, width - 48),
              alignSelf: "center",
              marginBottom: 40,
              borderRadius: 24,
            },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header — avatar + name/status + close */}
          <View style={styles.header}>
            <BotAvatar />
            <View style={styles.headerText}>
              <Text style={styles.agentName}>eKolekta Assistant</Text>
              <View style={styles.headerSub}>
                <Text style={styles.orgName}>St. Peter</Text>
                <Text style={styles.subSep}>·</Text>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineLabel}>Online</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => onOpenChange(false)}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color="#64748b" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.body}>
            <Text style={styles.placeholder}>Chat coming soon…</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    minHeight: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginBottom: 16,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  headerText: {
    flex: 1,
  },
  headerSub: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  orgName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
  },
  subSep: {
    fontSize: 12,
    color: "#cbd5e1",
    lineHeight: 14,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Avatar ─────────────────────────────────────────────────────────────────
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1.5,
    borderColor: "rgba(0,220,110,0.35)",
    ...Platform.select({
      ios: {
        shadowColor: "#00783a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  onlineBadge: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  agentName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.2,
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  onlineLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22c55e",
  },

  // ── Divider ────────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginBottom: 16,
  },

  // ── Body ───────────────────────────────────────────────────────────────────
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  placeholder: {
    fontSize: 15,
    color: "#94a3b8",
  },
});
