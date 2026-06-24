import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

interface NavContextValue {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  bottomNavY: SharedValue<number>;
  navigateTo: (path: string) => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const bottomNavY = useSharedValue(0);
  const router = useRouter();

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((v) => !v), []);

  const navigateTo = useCallback(
    (path: string) => {
      setDrawerOpen(false);
      bottomNavY.value = 0;
      router.navigate(path as never);
    },
    [bottomNavY, router],
  );

  return (
    <NavContext.Provider
      value={{ drawerOpen, openDrawer, closeDrawer, toggleDrawer, bottomNavY, navigateTo }}
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
