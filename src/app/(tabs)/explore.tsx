import { Compass } from "lucide-react-native";
import { EmptyStateCard } from "osp-ui-kit-native";
import React from "react";
import { View } from "react-native";

export default function ExploreScreen() {
  return (
    <View style={{ paddingTop: 16, paddingHorizontal: 8 }}>
      <EmptyStateCard icon={Compass} title="Explore" description="Coming soon" />
    </View>
  );
}
