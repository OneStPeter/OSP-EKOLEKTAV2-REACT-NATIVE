import { Tabs } from "expo-router";
import React from "react";
import { useColorScheme, View } from "react-native";

import { ChatbotFAB } from "@/components/chatbot/ChatbotFAB";
import { AppHeader } from "@/components/navigation/AppHeader";
import { BottomNavBar } from "@/components/navigation/BottomNavBar";
import { SidebarDrawer } from "@/components/navigation/SidebarDrawer";
import { NavProvider } from "@/context/nav-context";
import { UserProfileProvider } from "@/context/user-profile-context";

const BG = { light: "#f0fdf4", dark: "#030f0b" };

export default function TabsLayout() {
  const scheme = useColorScheme();
  const bg = BG[scheme === "dark" ? "dark" : "light"];

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
          <Tabs.Screen name="comte" options={{ title: "ComTe" }} />
          <Tabs.Screen name="profile" options={{ title: "Profile" }} />
          {/* Keep explore route accessible but unlisted */}
          <Tabs.Screen name="explore" options={{ href: null }} />
        </Tabs>

        <BottomNavBar />
        <SidebarDrawer />
        <ChatbotFAB />
      </View>
    </NavProvider>
    </UserProfileProvider>
  );
}
