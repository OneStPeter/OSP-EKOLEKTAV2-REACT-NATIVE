import { useRouter } from "expo-router";
import { CreditCard, Phone, User } from "lucide-react-native";
import {
  LoginForm,
  StPeterProvider,
  type LoginExternalLink,
} from "osp-ui-kit-native";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { getBiometricUser } from "@/services/biometric-auth.service";
import { getRememberedAccount } from "@/services/offline-auth.service";
import type { AuthUser } from "@/types/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type QuickSignIn = {
  /** The account that last signed in on this device. */
  account: AuthUser | null;
  /** Fingerprint / Face ID is turned on for that account. */
  biometric: boolean;
};

async function loadQuickSignIn(): Promise<QuickSignIn> {
  const [account, biometricUser] = await Promise.all([
    getRememberedAccount(),
    getBiometricUser(),
  ]);
  return {
    account,
    biometric:
      !!account && biometricUser === account.email.trim().toLowerCase(),
  };
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function QuickSignInScreen() {
  const router = useRouter();
  const { loading, error, signIn, signInWithBiometric, signInWithSocial } =
    useAuth();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [quick, setQuick] = useState<QuickSignIn | null>(null);

  useEffect(() => {
    let active = true;
    loadQuickSignIn()
      .catch((): QuickSignIn => ({ account: null, biometric: false }))
      .then((result) => {
        if (active) setQuick(result);
      });
    return () => {
      active = false;
    };
  }, []);

  const externalLinks: LoginExternalLink[] = [
    { id: "contact", label: "Contact Us", icon: Phone, onSelect: () => {} },
    {
      id: "planholder",
      label: "Planholder Portal",
      icon: User,
      onSelect: () => router.push("/(tabs)/planholderProfile"),
    },
    {
      id: "pay",
      label: "Pay My Plan",
      icon: CreditCard,
      onSelect: () => router.push("/(tabs)/payment"),
    },
  ];

  async function handleLogin(
    username: string,
    password: string,
    { remember }: { remember: boolean },
  ) {
    const email = username.trim();
    const skipPasswordLength = email === "sa2@stpeter.com.ph";
    if (!EMAIL_PATTERN.test(email)) {
      setValidationError("Enter a valid email address.");
      return;
    }
    if (!skipPasswordLength && password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return;
    }
    setValidationError(null);
    await signIn({ email, password, remember });
  }

  async function handleBiometric() {
    setValidationError(null);
    await signInWithBiometric();
  }

  // initialUsername is read once on mount, so wait for the remembered account
  // (a keystore read, a few milliseconds) before showing the form.
  if (!quick) return <View style={{ flex: 1, backgroundColor: "#022c22" }} />;

  const firstName = quick.account?.name.trim().split(/\s+/)[0];

  // Pinned to the green brand gradient in light mode, same as the
  // "Welcome back" login screen.
  return (
    <StPeterProvider theme="green" colorMode="light">
      <LoginForm
        onLogin={handleLogin}
        onBiometricLogin={handleBiometric}
        onGoogleLogin={() => signInWithSocial("google")}
        onFacebookLogin={() => signInWithSocial("facebook")}
        // Offered once the user turned it on after a password sign-in.
        showBiometricLogin="auto"
        biometricAvailable={quick.biometric}
        initialUsername={quick.account?.email ?? ""}
        quickSignInSubtitle={
          firstName
            ? `Welcome back, ${firstName}`
            : "Choose how you'd like to continue"
        }
        isLoading={loading}
        error={validationError ?? error ?? undefined}
        logoSrc={require("@/assets/images/icon.png")}
        externalLinks={externalLinks}
        showSignup={true}
        showForgotPassword={true}
      />
    </StPeterProvider>
  );
}
