import { useRouter } from "expo-router";
import { SearchX } from "lucide-react-native";
import { BaseButton, EmptyStateCard, useTheme } from "osp-ui-kit-native";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.canvas }}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <EmptyStateCard
          icon={SearchX}
          title="Page Not Available"
          description="This page doesn't exist or isn't available yet."
          style={{ alignSelf: "stretch" }}
        >
          <BaseButton
            onPress={() => {
              // @ts-expect-error — typed routes don't infer this literal group path
              router.replace("/(tabs)/");
            }}
          >
            Go to Home
          </BaseButton>
        </EmptyStateCard>
      </View>
    </SafeAreaView>
  );
}
