import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { EyeToggle, FormInput } from "@/components/auth/FormInput";
import {
  SocialButton,
  type SocialProvider,
} from "@/components/auth/SocialButton";
import { useAuth } from "@/hooks/use-auth";

// ─── Brand colours ────────────────────────────────────────────────────────────
const GREEN_MID = "#065f46";
const GREEN_ACCENT = "#059669";
const GREEN_TEXT = "#6ee7b7";

const FORM_MAX_WIDTH = 480;

// ─── Divider ─────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>OR CONTINUE WITH</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

// ─── Checkbox ────────────────────────────────────────────────────────────────
function Checkbox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.checkboxRow}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.checkboxLabel}>Remember me</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isSmallScreen = windowHeight < 700;
  const isTabletPortrait = windowWidth >= 768 && windowHeight > windowWidth;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const { loading, socialLoading, error, signIn, signInWithSocial } = useAuth();

  // Responsive sizing — compress spacing on short screens so nothing overflows
  const brandPaddingV = isSmallScreen ? 10 : 28;
  const brandGap = isSmallScreen ? 8 : 16;
  const logoBoxSize = isSmallScreen ? 60 : 80;
  const logoImgSize = isSmallScreen ? 42 : 56;
  const cardPaddingV = isSmallScreen ? 20 : 32;
  const cardGap = isSmallScreen ? 12 : 20;
  const formGapSize = isSmallScreen ? 10 : 16;
  const btnHeight = isSmallScreen ? 46 : 52;

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    signIn({ email: email.trim(), password, remember });
  }

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
          <View
            style={[
              styles.inner,
              isTabletPortrait && { justifyContent: "center" as const },
            ]}
          >
            {/* ── Dark green brand header ── */}
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
              <View style={styles.dotGrid} pointerEvents="none" />

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

              <Animated.View
                entering={FadeInDown.duration(500).delay(180)}
                style={styles.brandText}
              >
                <Text style={styles.brandTitle}>One St. Peter</Text>
              </Animated.View>
            </Animated.View>

            {/* ── White form card ── */}
            <View style={styles.cardOuter}>
              <Animated.View
                entering={FadeInUp.duration(450).delay(120)}
                style={[
                  styles.card,
                  { paddingTop: cardPaddingV, paddingBottom: cardPaddingV, gap: cardGap },
                ]}
              >
                {/* Card header */}
                <Animated.View entering={FadeInUp.duration(400).delay(200)}>
                  <Text style={styles.cardTitle}>Welcome back</Text>
                  <Text style={styles.cardSubtitle}>
                    Sign in to your account to continue
                  </Text>
                </Animated.View>

                <View style={[styles.formGap, { gap: formGapSize }]}>
                  {/* Error banner */}
                  {error ? (
                    <Animated.View
                      entering={FadeInUp.duration(300)}
                      style={styles.errorBanner}
                    >
                      <Text style={styles.errorBannerText}>{error}</Text>
                    </Animated.View>
                  ) : null}

                  {/* Email */}
                  <Animated.View entering={FadeInUp.duration(400).delay(250)}>
                    <FormInput
                      label="Email address"
                      iconName={{
                        ios: "envelope",
                        android: "email",
                        web: "email",
                      }}
                      value={email}
                      onChangeText={(v) => {
                        setEmail(v);
                        setFieldErrors((e) => ({ ...e, email: undefined }));
                      }}
                      placeholder="you@stpeter.com.ph"
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      autoComplete="email"
                      error={fieldErrors.email}
                    />
                  </Animated.View>

                  {/* Password */}
                  <Animated.View entering={FadeInUp.duration(400).delay(310)}>
                    <FormInput
                      label="Password"
                      iconName={{ ios: "lock", android: "lock", web: "lock" }}
                      value={password}
                      onChangeText={(v) => {
                        setPassword(v);
                        setFieldErrors((e) => ({ ...e, password: undefined }));
                      }}
                      placeholder="••••••••"
                      secureTextEntry={!showPassword}
                      textContentType="password"
                      autoComplete="current-password"
                      error={fieldErrors.password}
                      rightSlot={
                        <EyeToggle
                          visible={showPassword}
                          onToggle={() => setShowPassword((v) => !v)}
                        />
                      }
                    />
                  </Animated.View>

                  {/* Remember me + Forgot */}
                  <Animated.View
                    entering={FadeInUp.duration(400).delay(370)}
                    style={styles.rememberRow}
                  >
                    <Checkbox
                      checked={remember}
                      onToggle={() => setRemember((v) => !v)}
                    />
                    <TouchableOpacity activeOpacity={0.7}>
                      <Text style={styles.forgotLink}>Forgot password?</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Sign in button */}
                  <Animated.View entering={FadeInUp.duration(400).delay(420)}>
                    <TouchableOpacity
                      style={[
                        styles.signInBtn,
                        { height: btnHeight },
                        loading && styles.signInBtnDisabled,
                      ]}
                      onPress={handleSubmit}
                      disabled={loading}
                      activeOpacity={0.88}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <View style={styles.signInBtnLabel}>
                          <Text style={styles.signInBtnText}>Sign in</Text>
                          <ArrowRight size={16} color="#ffffff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Divider */}
                  <Animated.View entering={FadeInUp.duration(400).delay(470)}>
                    <Divider />
                  </Animated.View>

                  {/* Social buttons */}
                  <Animated.View
                    entering={FadeInUp.duration(400).delay(510)}
                    style={styles.socialRow}
                  >
                    {(["google", "facebook", "x"] as SocialProvider[]).map(
                      (p) => (
                        <SocialButton
                          key={p}
                          provider={p}
                          loading={socialLoading === p}
                          disabled={!!socialLoading}
                          onPress={() => signInWithSocial(p)}
                        />
                      ),
                    )}
                  </Animated.View>
                </View>
              </Animated.View>
            </View>

            {/* ── Copyright ── */}
            <Animated.View
              entering={FadeInUp.duration(400).delay(580)}
              style={styles.copyrightArea}
            >
              <Text style={styles.copyright}>© 2026 St. Peter Life Plans</Text>
            </Animated.View>
          </View>
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
  inner: {
    flex: 1,
    justifyContent: "space-between",
  },

  // ── Brand header ──
  brandSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 16,
    overflow: "hidden",
  },
  dotGrid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
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
  brandText: {
    alignItems: "center",
    gap: 6,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: GREEN_TEXT,
    letterSpacing: 3,
    textTransform: "uppercase",
  },

  // ── Card outer — centres the card on wide screens ──
  cardOuter: {
    paddingHorizontal: 16,
    alignItems: "center",
  },

  // ── Form card ──
  card: {
    width: "100%",
    maxWidth: FORM_MAX_WIDTH,
    backgroundColor: "#ffffff",
    borderRadius: 32,
    overflow: "hidden",
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 32,
    gap: 20,
    borderWidth: 1,
    borderColor: "rgba(243,244,246,0.8)",
    shadowColor: "#4b4b4b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },

  // ── Copyright area ──
  copyrightArea: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  formGap: {
    gap: 16,
  },

  // ── Error banner ──
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: {
    fontSize: 13,
    color: "#dc2626",
  },

  // ── Remember row ──
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  checkboxBoxChecked: {
    backgroundColor: GREEN_ACCENT,
    borderColor: GREEN_ACCENT,
  },
  checkmark: {
    fontSize: 11,
    color: "#ffffff",
    fontWeight: "700",
    lineHeight: 14,
  },
  checkboxLabel: {
    fontSize: 13,
    color: "#4b5563",
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: "600",
    color: GREEN_MID,
  },

  // ── Sign in button ──
  signInBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GREEN_ACCENT,
    shadowColor: GREEN_ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  signInBtnDisabled: {
    opacity: 0.7,
  },
  signInBtnLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signInBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.2,
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
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

  // ── Social row ──
  socialRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },

  // ── Footer ──
  footerNote: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 17,
    marginTop: 4,
  },
  copyright: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
  },
});
