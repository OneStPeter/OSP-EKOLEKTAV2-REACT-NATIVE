import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

// Routes with an implemented screen — keep in sync with the <Tabs.Screen> entries
// in (tabs)/_layout.tsx. Anything not listed here shows the "not available" prompt
// instead of routing to a blank/unmatched screen.
const AVAILABLE_ROUTES = new Set<string>([
  '/',
  '/mcpr',
  '/payment',
  '/viewDrs',
  '/encodeDeposit',
  '/viewDeposit',
  '/disbursement',
  '/planholderProfile',
  '/profile',
  '/explore',
]);

/** Pill button a focused screen can mount on the right of the AppHeader. */
export interface HeaderAction {
  label: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  onPress: () => void;
}

/** Header customisation published by the focused screen. Anything omitted
 *  falls back to the header's own per-route defaults. */
export interface HeaderOverride {
  /** Replaces the per-route subtitle. */
  subtitle?: string;
  /** Replaces the burger menu with a back chevron running this callback. */
  onBack?: () => void;
  /** Trailing action, e.g. the planholder "More" menu. */
  action?: HeaderAction;
}

interface NavContextValue {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  bottomNavY: SharedValue<number>;
  /** Scroll offset of the focused screen — drives the non-sticky AppHeader. */
  scrollY: SharedValue<number>;
  navigateTo: (path: string, label?: string) => void;
  unavailableLabel: string | null;
  dismissUnavailable: () => void;
  /** AppHeader customisation for screens whose header depends on their own
   *  internal state. Null falls back to the per-route defaults. */
  headerOverride: HeaderOverride | null;
  setHeaderOverride: (override: HeaderOverride | null) => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unavailableLabel, setUnavailableLabel] = useState<string | null>(null);
  const [headerOverride, setHeaderOverride] = useState<HeaderOverride | null>(
    null,
  );
  const bottomNavY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const router = useRouter();

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((v) => !v), []);
  const dismissUnavailable = useCallback(() => setUnavailableLabel(null), []);

  const navigateTo = useCallback(
    (path: string, label?: string) => {
      if (!AVAILABLE_ROUTES.has(path)) {
        setDrawerOpen(false);
        setUnavailableLabel(label ?? path);
        return;
      }
      setDrawerOpen(false);
      bottomNavY.value = 0;
      scrollY.value = 0;
      router.navigate(path as never);
    },
    [bottomNavY, scrollY, router],
  );

  return (
    <NavContext.Provider
      value={{
        drawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        bottomNavY,
        scrollY,
        navigateTo,
        unavailableLabel,
        dismissUnavailable,
        headerOverride,
        setHeaderOverride,
      }}
    >
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be inside NavProvider');
  return ctx;
}
