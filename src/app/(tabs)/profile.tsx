import { User } from "lucide-react-native";
import { EmptyStateCard } from "osp-ui-kit-native";
import React from "react";
import { View } from "react-native";

export default function ProfileScreen() {
  return (
    <View style={{ paddingTop: 16, paddingHorizontal: 8 }}>
      <EmptyStateCard icon={User} title="Profile" description="Coming soon" />
    </View>
  );
}
