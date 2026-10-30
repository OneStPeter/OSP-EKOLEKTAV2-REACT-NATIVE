import { useRouter } from "expo-router";
import { CreditCard, Phone, User } from "lucide-react-native";
import { LoginForm, type LoginExternalLink } from "osp-ui-kit-native";
import React, { useState } from "react";

import { useAuth } from "@/hooks/use-auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Mock "remembered" account (this device has signed in before) ────────────
// const REMEMBERED_ACCOUNT = {
//   name: "Joyce Basilio-Ramos",
//   email: "joycemb@stpeter.com.ph",
//   avatarUrl: Image.resolveAssetSource(require("@/assets/images/Profile.png"))
//     .uri,
//   initials: "JB",
// };

// const SOCIAL_ACCOUNTS: LoginSocialAccount[] = [
//   { provider: "google", ...REMEMBERED_ACCOUNT },
//   { provider: "facebook", ...REMEMBERED_ACCOUNT },
// ];

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function QuickSignInScreen() {
  const router = useRouter();
  const { loading, error, signIn, signInWithSocial } = useAuth();
  const [validationError, setValidationError] = useState<string | null>(null);

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

  // TODO: replace the simulated scan with expo-local-authentication
  async function handleBiometric() {
    await new Promise((r) => setTimeout(r, 900));
    // @ts-expect-error — expo-router typed routes don't expose group segment paths
    router.replace("/(tabs)/");
  }

  return (
    <LoginForm
      onLogin={handleLogin}
      onBiometricLogin={handleBiometric}
      onGoogleLogin={() => signInWithSocial("google")}
      onFacebookLogin={() => signInWithSocial("facebook")}
      showBiometricLogin
      isLoading={loading}
      error={validationError ?? error ?? undefined}
      logoSrc={require("@/assets/images/icon.png")}
      // socialAccounts={SOCIAL_ACCOUNTS}
      externalLinks={externalLinks}
      showSignup={true}
      showForgotPassword={true}
    />
  );
}
