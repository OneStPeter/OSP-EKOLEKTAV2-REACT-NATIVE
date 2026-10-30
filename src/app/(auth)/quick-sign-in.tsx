import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  CreditCard,
  Fingerprint,
  Phone,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import type { SocialProvider } from "@/components/auth/SocialButton";
import { palette } from "@/components/ui/theme";
import { useAuth } from "@/hooks/use-auth";
// ─── Brand colours ────────────────────────────────────────────────────────────
const GREEN_MID = "#065f46";
const GREEN_ACCENT = "#059669";
const muted = palette.muted;
const FORM_MAX_WIDTH = 480;

// ─── Mock "remembered" account (this device has signed in before) ────────────
const REMEMBERED_ACCOUNT = {
  name: "Joyce Basilio-Ramos",
  email: "joycemb@stpeter.com.ph",
  avatar: require("@/assets/images/Profile.png"),
};

const PROVIDER_ICON: Record<SocialProvider, number> = {
  google: require("@/assets/images/icons8-google-48.png"),
  facebook: require("@/assets/images/icons8-meta-48.png"),
  x: require("@/assets/images/icons8-x-48.png"),
};

// ─── Divider ─────────────────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

// ─── Saved-account row (avatar, name, email, provider icon, chevron) ─────────
function AccountRow({
  provider,
  loading,
  disabled,
  onPress,
}: {
  provider: SocialProvider;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.accountRow,
        disabled && !loading && styles.accountRowDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <Image
        source={REMEMBERED_ACCOUNT.avatar}
        style={styles.avatar}
        contentFit="cover"
      />
      <View style={styles.accountTextCol}>
        <Text style={styles.accountName} numberOfLines={1}>
          {REMEMBERED_ACCOUNT.name}
        </Text>
        <Text style={styles.accountEmail} numberOfLines={1}>
          {REMEMBERED_ACCOUNT.email}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={GREEN_ACCENT} />
      ) : (
        <Image
          source={PROVIDER_ICON[provider]}
          style={styles.providerIcon}
          contentFit="contain"
        />
      )}
      <ChevronRight size={18} color="#9ca3af" />
    </TouchableOpacity>
  );
}

// ─── Circular shortcut button ─────────────────────────────────────────────────
function ShortcutButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.shortcut}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.shortcutCircle}>{icon}</View>
      <Text style={styles.shortcutLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function QuickSignInScreen() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const isSmallScreen = windowHeight < 700;

  const [biometricLoading, setBiometricLoading] = useState(false);
  const { socialLoading, signInWithSocial } = useAuth();

  const brandPaddingV = isSmallScreen ? 10 : 28;
  const brandGap = isSmallScreen ? 8 : 16;
  const logoBoxSize = isSmallScreen ? 60 : 80;
  const logoImgSize = isSmallScreen ? 42 : 56;
  const cardPaddingV = isSmallScreen ? 20 : 32;
  const cardGap = isSmallScreen ? 12 : 18;

  function handleBiometric() {
    setBiometricLoading(true);
    setTimeout(() => {
      setBiometricLoading(false);
      // @ts-expect-error — expo-router typed routes don't expose group segment paths
      router.replace("/(tabs)/");
    }, 900);
  }

  function handleUsePassword() {
    router.push("/(auth)/login");
  }

  function handleSignUp() {
    router.push("/(auth)/sign-up");
  }

  function handlePlanholderPortal() {
    // router.push("/(tabs)/planholderProfile");
  }

  function handlePayMyPlan() {
    // router.push("/(tabs)/payment");
  }

  const anyLoading = biometricLoading || !!socialLoading;

  return (
    <LinearGradient
      colors={["#022c22", "#064e3b", "#f0fdf4", "#ffffff"]}
      locations={[0, 0.35, 0.6, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* ── Brand header ── */}
            <Animated.View
              entering={FadeInDown.duration(500)}
              style={[
                styles.brandSection,
                {
                  paddingTop: brandPaddingV,
                  paddingBottom: brandPaddingV,
                  gap: brandGap,
                },
              ]}
            >
              <Animated.View entering={FadeInDown.duration(500).delay(80)}>
                <View
                  style={[
                    styles.logoBox,
                    { width: logoBoxSize, height: logoBoxSize },
                  ]}
                >
                  <Image
                    source={require("@/assets/images/icon.png")}
                    style={{ width: logoImgSize, height: logoImgSize }}
                    contentFit="contain"
                  />
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(500).delay(180)}>
                <Text style={styles.brandTitle}>One St. Peter</Text>
              </Animated.View>
            </Animated.View>

            {/* ── White card ── */}
            <View style={styles.cardOuter}>
              <Animated.View
                entering={FadeInUp.duration(450).delay(120)}
                style={[
                  styles.card,
                  {
                    paddingTop: cardPaddingV,
                    paddingBottom: cardPaddingV,
                    gap: cardGap,
                  },
                ]}
              >
                <Animated.View entering={FadeInUp.duration(400).delay(200)}>
                  <Text style={styles.cardTitle}>Quick Sign In</Text>
                  <Text style={styles.cardSubtitle}>
                    Choose how you&apos;d like to continue
                  </Text>
                </Animated.View>

                {/* Fingerprint */}
                <Animated.View
                  entering={FadeInUp.duration(400).delay(260)}
                  style={styles.biometricArea}
                >
                  <TouchableOpacity
                    style={[
                      styles.fingerprintBtn,
                      biometricLoading && styles.fingerprintBtnDisabled,
                    ]}
                    onPress={handleBiometric}
                    disabled={anyLoading}
                    activeOpacity={0.85}
                  >
                    {biometricLoading ? (
                      <ActivityIndicator
                        color={palette.primaryGreen}
                        size="small"
                      />
                    ) : (
                      <Fingerprint size={42} color={palette.primaryGreen} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleUsePassword}
                    disabled={anyLoading}
                    hitSlop={8}
                  >
                    <Text style={styles.usePasswordLink}>
                      Use password instead
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInUp.duration(400).delay(320)}>
                  <Divider label="CONTINUE WITH" />
                </Animated.View>

                {/* Saved accounts */}
                <Animated.View
                  entering={FadeInUp.duration(400).delay(370)}
                  style={styles.accountsCol}
                >
                  {(["google", "facebook"] as SocialProvider[]).map((p) => (
                    <AccountRow
                      key={p}
                      provider={p}
                      loading={socialLoading === p}
                      disabled={anyLoading}
                      onPress={() => signInWithSocial(p)}
                    />
                  ))}
                </Animated.View>

                {/* Footer */}
                <Animated.View
                  entering={FadeInUp.duration(400).delay(420)}
                  style={styles.signupRow}
                >
                  <Text style={styles.signupText}>No Account? </Text>
                  <TouchableOpacity
                    onPress={handleSignUp}
                    activeOpacity={0.7}
                    hitSlop={8}
                  >
                    <Text style={styles.signupLink}>Sign up.</Text>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </View>

            {/* ── Shortcuts ── */}
            <Animated.View
              entering={FadeInUp.duration(400).delay(500)}
              style={styles.shortcutsRow}
            >
              <ShortcutButton
                icon={<Phone size={20} color={GREEN_MID} />}
                label="Contact Us"
                onPress={() => {}}
              />
              <ShortcutButton
                icon={<User size={20} color={GREEN_MID} />}
                label="Planholder Portal"
                onPress={handlePlanholderPortal}
              />
              <ShortcutButton
                icon={<CreditCard size={20} color={GREEN_MID} />}
                label="Pay My Plan"
                onPress={handlePayMyPlan}
              />
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(400).delay(560)}
              style={styles.copyrightArea}
            >
              <Text style={styles.copyright}>© 2026 St. Peter Life Plans</Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  kav: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },

  // ── Brand header ──
  brandSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.5,
    textAlign: "center",
  },

  // ── Card ──
  cardOuter: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: FORM_MAX_WIDTH,
    backgroundColor: "#ffffff",
    borderRadius: 32,
    overflow: "hidden",
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: "rgba(243,244,246,0.8)",
    shadowColor: "#4b4b4b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },

  // ── Biometric ──
  biometricArea: {
    alignItems: "center",
    gap: 10,
  },
  fingerprintBtn: {
    width: 86,
    height: 86,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primaryGreen + 11, // 11% opacity
    shadowColor: palette.primaryGreen + 11,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  fingerprintBtnDisabled: {
    opacity: 0.75,
  },
  usePasswordLink: {
    fontSize: 13,
    fontWeight: "600",
    color: GREEN_MID,
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#f3f4f6",
  },
  dividerLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9ca3af",
    letterSpacing: 1.5,
  },

  // ── Account rows ──
  accountsCol: {
    gap: 10,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  accountRowDisabled: {
    opacity: 0.5,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  accountTextCol: {
    flex: 1,
    gap: 1,
  },
  accountName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  accountEmail: {
    fontSize: 11,
    color: "#6b7280",
  },
  providerIcon: {
    width: 18,
    height: 18,
  },

  // ── Footer ──
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  signupText: {
    fontSize: 13,
    color: "#6b7280",
  },
  signupLink: {
    fontSize: 13,
    fontWeight: "700",
    color: GREEN_MID,
  },

  // ── Shortcuts ──
  shortcutsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  shortcut: {
    alignItems: "center",
    gap: 6,
    width: 84,
  },
  shortcutCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4b4b4b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: palette.body, // Replace with actual color from
    textAlign: "center",
  },

  // ── Copyright ──
  copyrightArea: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  copyright: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
  },
});
