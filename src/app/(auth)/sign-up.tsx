import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import React, { useEffect, useState } from "react";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { FormInput, type FormInputSize } from "@/components/auth/FormInput";
import { AlertModal, useAlertModal } from "@/components/ui";
import { palette } from "@/components/ui/theme";
import { getDeviceId } from "@/services/device.service";
import {
  verifyEmployeeEmail,
  type VerifiedEmployee,
} from "@/services/employee-verification.service";
import { SignUpError, signUp } from "@/services/sign-up.service";

// ─── Brand colours ────────────────────────────────────────────────────────────
const GREEN_MID = "#065f46";
const GREEN_ACCENT = "#059669";

const FORM_MAX_WIDTH = 480;
const EMAIL_MAX_LENGTH = 255; // varchar(255) on tblUsers.UserName
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<"email", string>>;

/** "Juan D. Dela Cruz Jr." style parts, skipping blanks. */
const joinName = (...parts: (string | null)[]) =>
  parts.map((p) => p?.trim()).filter(Boolean).join(" ");

// ─── Responsive density ──────────────────────────────────────────────────────
// The screen doesn't scroll, so spacing is picked from the height actually
// available (window minus safe areas). Each tier's total content height is
// kept under its threshold: regular ≈ 780, compact ≈ 650, tight ≈ 550.
type Density = {
  showLogo: boolean;
  logoBoxSize: number;
  logoImgSize: number;
  brandPaddingV: number;
  brandGap: number;
  brandTitleSize: number;
  cardPaddingV: number;
  cardGap: number;
  formGap: number;
  titleSize: number;
  btnHeight: number;
  inputSize: FormInputSize;
  copyrightPaddingV: number;
};

const REGULAR: Density = {
  showLogo: true,
  logoBoxSize: 64,
  logoImgSize: 44,
  brandPaddingV: 20,
  brandGap: 12,
  brandTitleSize: 28,
  cardPaddingV: 28,
  cardGap: 16,
  formGap: 14,
  titleSize: 24,
  btnHeight: 52,
  inputSize: "regular",
  copyrightPaddingV: 14,
};

const COMPACT: Density = {
  showLogo: true,
  logoBoxSize: 48,
  logoImgSize: 34,
  brandPaddingV: 12,
  brandGap: 8,
  brandTitleSize: 22,
  cardPaddingV: 20,
  cardGap: 12,
  formGap: 10,
  titleSize: 22,
  btnHeight: 48,
  inputSize: "compact",
  copyrightPaddingV: 12,
};

const TIGHT: Density = {
  showLogo: false,
  logoBoxSize: 0,
  logoImgSize: 0,
  brandPaddingV: 8,
  brandGap: 0,
  brandTitleSize: 20,
  cardPaddingV: 16,
  cardGap: 10,
  formGap: 8,
  titleSize: 20,
  btnHeight: 44,
  inputSize: "compact",
  copyrightPaddingV: 6,
};

function pickDensity(availableHeight: number): Density {
  if (availableHeight >= 780) return REGULAR;
  if (availableHeight >= 660) return COMPACT;
  return TIGHT;
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function SignUpScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTabletPortrait = windowWidth >= 768 && windowHeight > windowWidth;
  // Based on the window, not the KAV, so the layout doesn't jump when the keyboard opens.
  const d = pickDensity(windowHeight - insets.top - insets.bottom);

  // Step 1 — email verification. `employee` set = step 2, the account form.
  const [email, setEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [employee, setEmployee] = useState<VerifiedEmployee | null>(null);

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceIdError, setDeviceIdError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { alertState, showAlert, dismissAlert } = useAlertModal();

  useEffect(() => {
    getDeviceId()
      .then(setDeviceId)
      .catch(() => setDeviceIdError(true));
  }, []);

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleVerify() {
    if (!email.trim()) {
      setFieldErrors({ email: "Email address is required." });
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setFieldErrors({ email: "Enter a valid email address." });
      return;
    }

    setVerifying(true);
    setError(null);
    try {
      const result = await verifyEmployeeEmail(email);
      switch (result.status) {
        case "verified":
          setEmail(result.employee.email);
          setEmployee(result.employee);
          showAlert(
            "success",
            "Agent verified",
            "Agent verified successfully. You may now create your account.",
          );
          break;
        case "not_found":
          showAlert(
            "error",
            "Email not found",
            "This email is not registered to any agent. Please check your email address and try again.",
          );
          break;
        case "already_registered":
          showAlert(
            "info",
            "Account already exists",
            "This agent already has an account. Please log in instead.",
          );
          break;
        case "ineligible":
          showAlert(
            "warning",
            "Not eligible to register",
            "This email is not eligible to create an account. Please contact your administrator.",
          );
          break;
        case "error":
          showAlert("error", "Verification failed", result.message);
          break;
      }
    } finally {
      setVerifying(false);
    }
  }

  /** Back to step 1, e.g. to verify a different email. */
  function resetVerification() {
    setEmployee(null);
    setFieldErrors({});
    setError(null);
  }

  async function handleSubmit() {
    if (!employee) return;
    if (!deviceId) {
      setError("Unable to identify this device. Please restart the app and try again.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signUp(db, { employee });
      showAlert(
        "success",
        "Account created",
        "Your sign-up request has been sent to the server.",
        () => router.replace("/(auth)/login"),
      );
    } catch (e) {
      setError(
        e instanceof SignUpError ? e.message : "Sign up failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
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
                  paddingTop: d.brandPaddingV,
                  paddingBottom: d.brandPaddingV,
                  gap: d.brandGap,
                },
              ]}
            >
              {d.showLogo && (
                <Animated.View entering={FadeInDown.duration(500).delay(80)}>
                  <View
                    style={[
                      styles.logoBox,
                      { width: d.logoBoxSize, height: d.logoBoxSize },
                    ]}
                  >
                    <Image
                      source={require("@/assets/images/icon.png")}
                      style={{ width: d.logoImgSize, height: d.logoImgSize }}
                      contentFit="contain"
                    />
                  </View>
                </Animated.View>
              )}

              <Animated.View entering={FadeInDown.duration(500).delay(180)}>
                <Text style={[styles.brandTitle, { fontSize: d.brandTitleSize }]}>
                  One St. Peter
                </Text>
              </Animated.View>
            </Animated.View>

            {/* ── White form card ── */}
            <View style={styles.cardOuter}>
              <Animated.View
                entering={FadeInUp.duration(450).delay(120)}
                style={[
                  styles.card,
                  {
                    paddingTop: d.cardPaddingV,
                    paddingBottom: d.cardPaddingV,
                    gap: d.cardGap,
                  },
                ]}
              >
                {/* Back */}
                <Animated.View entering={FadeInUp.duration(400).delay(160)}>
                  <TouchableOpacity
                    style={styles.backRow}
                    onPress={() =>
                      employee
                        ? resetVerification()
                        : // Opened from app launch (unregistered device) there's no history.
                          router.canGoBack()
                          ? router.back()
                          : router.replace("/(auth)/quick-sign-in")
                    }
                    disabled={loading}
                    activeOpacity={0.7}
                    hitSlop={8}
                  >
                    <ArrowLeft size={16} color={palette.muted} />
                    <Text style={styles.backText}>Back</Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Card header */}
                <Animated.View entering={FadeInUp.duration(400).delay(200)}>
                  <Text style={[styles.cardTitle, { fontSize: d.titleSize }]}>
                    Create an account
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {employee
                      ? "Confirm your details to create your account"
                      : "Verify your email address to get started"}
                  </Text>
                </Animated.View>

                <View style={{ gap: d.formGap }}>
                  {/* Error banner */}
                  {error ? (
                    <Animated.View
                      entering={FadeInUp.duration(300)}
                      style={styles.errorBanner}
                    >
                      <Text style={styles.errorBannerText}>{error}</Text>
                    </Animated.View>
                  ) : null}

                  {!employee ? (
                    <>
                      {/* ── Step 1: employee verification ── */}
                      <Animated.View entering={FadeInUp.duration(400).delay(250)}>
                        <FormInput
                          label="Email address"
                          iconName={{ ios: "envelope", android: "email", web: "email" }}
                          value={email}
                          onChangeText={(v) => {
                            setEmail(v);
                            clearFieldError("email");
                          }}
                          placeholder="you@stpeter.com.ph"
                          keyboardType="email-address"
                          textContentType="emailAddress"
                          autoComplete="email"
                          autoCapitalize="none"
                          maxLength={EMAIL_MAX_LENGTH}
                          returnKeyType="go"
                          onSubmitEditing={handleVerify}
                          editable={!verifying}
                          error={fieldErrors.email}
                          size={d.inputSize}
                        />
                      </Animated.View>

                      <Animated.View entering={FadeInUp.duration(400).delay(290)}>
                        <TouchableOpacity
                          style={[
                            styles.submitBtn,
                            { height: d.btnHeight },
                            verifying && styles.submitBtnDisabled,
                          ]}
                          onPress={handleVerify}
                          disabled={verifying}
                          activeOpacity={0.88}
                        >
                          {verifying ? (
                            <View style={styles.submitBtnLabel}>
                              <ActivityIndicator color="#ffffff" size="small" />
                              <Text style={styles.submitBtnText}>Verifying…</Text>
                            </View>
                          ) : (
                            <View style={styles.submitBtnLabel}>
                              <Text style={styles.submitBtnText}>Verify Agent</Text>
                              <ArrowRight size={16} color="#ffffff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    </>
                  ) : (
                    <>
                      {/* ── Step 2: account form, prefilled from the employee record ── */}
                      {/* Sales Force Code + Device ID, side by side to save a row */}
                      <Animated.View
                        entering={FadeInUp.duration(400).delay(80)}
                        style={[styles.nameRow, { gap: d.formGap }]}
                      >
                        <View style={styles.nameCol}>
                          <FormInput
                            label="Sales Force Code"
                            iconName={{ ios: "person.text.rectangle", android: "badge", web: "badge" }}
                            value={employee.salesForceCode}
                            editable={false}
                            style={styles.readOnlyInput}
                            size={d.inputSize}
                          />
                        </View>
                        <View style={styles.nameCol}>
                          <FormInput
                            label="Device ID"
                            iconName={{ ios: "iphone", android: "smartphone", web: "smartphone" }}
                            value={
                              deviceId ?? (deviceIdError ? "Unavailable" : "Detecting device…")
                            }
                            editable={false}
                            style={styles.readOnlyInput}
                            error={deviceIdError ? "Unable to read this device's ID." : undefined}
                            size={d.inputSize}
                          />
                        </View>
                      </Animated.View>

                      {/* Names from the employee record (read-only) */}
                      <Animated.View
                        entering={FadeInUp.duration(400).delay(120)}
                        style={[styles.nameRow, { gap: d.formGap }]}
                      >
                        <View style={styles.nameCol}>
                          <FormInput
                            label="First name"
                            iconName={{ ios: "person", android: "person", web: "person" }}
                            value={joinName(employee.firstName, employee.middleName) || "—"}
                            editable={false}
                            style={styles.readOnlyInput}
                            size={d.inputSize}
                          />
                        </View>
                        <View style={styles.nameCol}>
                          <FormInput
                            label="Last name"
                            iconName={{ ios: "person", android: "person", web: "person" }}
                            value={joinName(employee.lastName, employee.suffix) || "—"}
                            editable={false}
                            style={styles.readOnlyInput}
                            size={d.inputSize}
                          />
                        </View>
                      </Animated.View>

                      {/* Position + Birthday, side by side to save a row */}
                      <Animated.View
                        entering={FadeInUp.duration(400).delay(160)}
                        style={[styles.nameRow, { gap: d.formGap }]}
                      >
                        <View style={styles.nameCol}>
                          <FormInput
                            label="Position"
                            iconName={{ ios: "briefcase", android: "work", web: "work" }}
                            value={employee.position ?? "—"}
                            editable={false}
                            style={styles.readOnlyInput}
                            size={d.inputSize}
                          />
                        </View>
                        <View style={styles.nameCol}>
                          <FormInput
                            label="Birthday"
                            iconName={{
                              ios: "calendar",
                              android: "calendar_month",
                              web: "calendar_month",
                            }}
                            value={employee.dateOfBirth ?? "—"}
                            editable={false}
                            style={styles.readOnlyInput}
                            size={d.inputSize}
                          />
                        </View>
                      </Animated.View>

                      <Animated.View entering={FadeInUp.duration(400).delay(180)}>
                        <FormInput
                          label="Branch"
                          iconName={{ ios: "building.2", android: "store", web: "store" }}
                          value={employee.orgDescription ?? "—"}
                          editable={false}
                          style={styles.readOnlyInput}
                          size={d.inputSize}
                        />
                      </Animated.View>

                      {/* Verified email — the account's user name */}
                      <Animated.View entering={FadeInUp.duration(400).delay(200)}>
                        <FormInput
                          label="Email address"
                          iconName={{ ios: "checkmark.seal", android: "verified", web: "verified" }}
                          value={employee.email}
                          editable={false}
                          style={styles.readOnlyInput}
                          size={d.inputSize}
                        />
                      </Animated.View>

                      {/* Create account button */}
                      <Animated.View entering={FadeInUp.duration(400).delay(240)}>
                        <TouchableOpacity
                          style={[
                            styles.submitBtn,
                            { height: d.btnHeight },
                            (loading || !deviceId) && styles.submitBtnDisabled,
                          ]}
                          onPress={handleSubmit}
                          disabled={loading || !deviceId}
                          activeOpacity={0.88}
                        >
                          {loading ? (
                            <ActivityIndicator color="#ffffff" size="small" />
                          ) : (
                            <View style={styles.submitBtnLabel}>
                              <Text style={styles.submitBtnText}>Create account</Text>
                              <ArrowRight size={16} color="#ffffff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    </>
                  )}

                  {/* Sign in link */}
                  <Animated.View
                    entering={FadeInUp.duration(400).delay(450)}
                    style={styles.switchRow}
                  >
                    <Text style={styles.switchText}>Already have an account?</Text>
                    <TouchableOpacity
                      onPress={() => router.replace("/(auth)/login")}
                      activeOpacity={0.7}
                      hitSlop={8}
                    >
                      <Text style={styles.switchLink}>Sign in</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </Animated.View>
            </View>

            {/* ── Copyright ── */}
            <Animated.View
              entering={FadeInUp.duration(400).delay(520)}
              style={[styles.copyrightArea, { paddingVertical: d.copyrightPaddingV }]}
            >
              <Text style={styles.copyright}>© 2026 St. Peter Life Plans</Text>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Status alert */}
      <AlertModal
        visible={alertState.visible}
        onDismiss={dismissAlert}
        variant={alertState.variant}
        title={alertState.title}
        message={alertState.message}
      />
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
  },
  logoBox: {
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.5,
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
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "rgba(243,244,246,0.8)",
    shadowColor: "#4b4b4b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
  },
  backText: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.muted,
  },
  cardTitle: {
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  nameRow: {
    flexDirection: "row",
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
  },
  readOnlyInput: {
    color: "#6b7280",
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

  // ── Submit button ──
  submitBtn: {
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
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.2,
  },

  // ── Sign in link ──
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  switchText: {
    fontSize: 13,
    color: "#4b5563",
  },
  switchLink: {
    fontSize: 13,
    fontWeight: "600",
    color: GREEN_MID,
  },

  // ── Copyright ──
  copyrightArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  copyright: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
  },
});
