import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

import { AlertModal } from "@/components/ui/AlertModal";
import { ChatbotFAB } from "@/components/chatbot/ChatbotFAB";
import { AppHeader } from "@/components/navigation/AppHeader";
import { BottomNavBar } from "@/components/navigation/BottomNavBar";
import { SidebarDrawer } from "@/components/navigation/SidebarDrawer";
import { NavProvider, useNav } from "@/context/nav-context";
import { UserProfileProvider } from "@/context/user-profile-context";

const BG = { light: "#f0fdf4", dark: "#030f0b" };

function UnavailablePageAlert() {
  const { unavailableLabel, dismissUnavailable } = useNav();

  return (
    <AlertModal
      visible={unavailableLabel !== null}
      onDismiss={dismissUnavailable}
      variant="info"
      title="Not Available"
      message={`This ${unavailableLabel ?? "page"} page is currently not available.`}
    />
  );
}

export default function TabsLayout() {
  const bg = BG.light;

  return (
    <UserProfileProvider>
      <NavProvider>
        <View style={{ flex: 1, backgroundColor: bg }}>
          <AppHeader />

          <Tabs
            screenOptions={{ headerShown: false, lazy: false }}
            tabBar={() => null}
          >
            <Tabs.Screen name="index" options={{ title: "index" }} />
            <Tabs.Screen name="mcpr" options={{ title: "MCPR" }} />
            <Tabs.Screen name="payment" options={{ title: "Payment" }} />
            <Tabs.Screen name="viewDrs" options={{ title: "View DRS" }} />
            <Tabs.Screen
              name="encodeDeposit"
              options={{ title: "Encode Deposit" }}
            />
            <Tabs.Screen
              name="viewDeposit"
              options={{ title: "View Deposit" }}
            />
            <Tabs.Screen name="disbursement" options={{ title: "Disbursement" }} />
            <Tabs.Screen
              name="planholderProfile"
              options={{ title: "Planholder Profile" }}
            />
            <Tabs.Screen name="profile" options={{ title: "Profile" }} />
            {/* Keep explore route accessible but unlisted */}
            <Tabs.Screen name="explore" options={{ href: null }} />
          </Tabs>

          <BottomNavBar />
          <SidebarDrawer />
          <ChatbotFAB />
          <UnavailablePageAlert />
        </View>
      </NavProvider>
    </UserProfileProvider>
  );
}
