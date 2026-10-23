import { Slot, usePathname, useRouter } from "expo-router";
import {
  ClipboardList,
  CreditCard,
  FileText,
  FileX,
  Home,
  Wallet,
} from "lucide-react-native";
import {
  AppLayout,
  DashboardHeaderMobile,
  MessageDialog,
  NavigationProvider,
  type AppUser,
  type NavigationAdapter,
  type NavItem,
} from "osp-ui-kit-native";
import React, { useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UserProfileProvider } from "@/context/user-profile-context";

// Routes with an implemented screen. Anything else in NAV_ITEMS shows the
// "not available" prompt instead of routing to an unmatched screen.
const AVAILABLE_ROUTES = new Set<string>([
  "/",
  "/mcpr",
  "/payment",
  "/viewDrs",
  "/encodeDeposit",
  "/viewDeposit",
  "/disbursement",
  "/planholderProfile",
  "/profile",
  "/explore",
]);

const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: Home, href: "/", bottomNav: true, bottomNavOrder: 1 },
  {
    label: "View MCPR",
    displayName: "MCPR",
    icon: FileText,
    href: "/mcpr",
    bottomNav: true,
    bottomNavOrder: 2,
  },
  {
    label: "Payment",
    icon: CreditCard,
    subItems: [
      {
        label: "Encode Payment",
        displayName: "Payment",
        href: "/payment",
        bottomNav: true,
        bottomNavOrder: 3,
      },
      { label: "View DRS", href: "/viewDrs" },
      { label: "Encode Validated Deposit Slip", href: "/encodeDeposit" },
      { label: "View Encoded Deposit Slip", href: "/viewDeposit" },
      { label: "Request Credit Memo", href: "/payment/credit-memo" },
    ],
  },
  { label: "Disbursement", icon: Wallet, href: "/disbursement" },
  {
    label: "Plan Management",
    icon: ClipboardList,
    subItems: [
      { label: "Add New Sale", href: "/plan-management/new" },
      {
        label: "Planholder Profile",
        displayName: "Planholder",
        href: "/planholderProfile",
        bottomNav: true,
        bottomNavOrder: 4,
      },
      { label: "Pre-filled LPA", href: "/plan-management/lpa" },
      { label: "Change of Mode", href: "/plan-management/change-of-mode" },
    ],
  },
  { label: "Document Cancellation", icon: FileX, href: "/dc" },
];

const USER: AppUser = {
  id: "1",
  displayName: "Jerome Jardio",
  position: "Collector",
  status: "online",
};

function labelFor(path: string): string {
  for (const item of NAV_ITEMS) {
    if (item.href === path) return item.label;
    const sub = item.subItems?.find((s) => s.href === path);
    if (sub) return sub.label;
  }
  return path;
}

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [unavailableLabel, setUnavailableLabel] = useState<string | null>(null);

  const navigation = useMemo<NavigationAdapter>(
    () => ({
      pathname,
      navigate: (to, options) => {
        if (typeof to === "number") {
          router.back();
          return;
        }
        // The shell sends users to `/login` after signing out.
        if (to === "/login") {
          router.replace("/(auth)/quick-sign-in");
          return;
        }
        if (!AVAILABLE_ROUTES.has(to)) {
          setUnavailableLabel(labelFor(to));
          return;
        }
        if (options?.replace) router.replace(to as never);
        else router.navigate(to as never);
      },
    }),
    [pathname, router],
  );

  return (
    <UserProfileProvider>
      <NavigationProvider value={navigation}>
        <AppLayout
          navItems={NAV_ITEMS}
          appName="One St. Peter"
          appSubtitle="eKolekta"
          user={USER}
          onSignOut={() => {}}
          insets={insets}
        >
          <DashboardHeaderMobile
            title="One St. Peter"
            subtitle="eKolekta"
            insets={insets}
          />
          <Slot />
        </AppLayout>

        <MessageDialog
          open={unavailableLabel !== null}
          onOpenChange={(open) => !open && setUnavailableLabel(null)}
          variant="information"
          title="Not Available"
          message={`This ${unavailableLabel ?? "page"} page is currently not available.`}
          confirmText="OK"
        />
      </NavigationProvider>
    </UserProfileProvider>
  );
}
