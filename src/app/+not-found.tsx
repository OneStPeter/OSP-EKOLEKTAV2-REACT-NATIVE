import { useRouter } from "expo-router";
import { SearchX } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { theme } from "@/components/ui/theme";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <EmptyState
          icon={SearchX}
          title="Page Not Available"
          message="This page doesn't exist or isn't available yet."
        />
        <AppButton
          onPress={() => {
            // @ts-expect-error — typed routes don't infer this literal group path
            router.replace("/(tabs)/");
          }}
          style={styles.button}
        >
          Go to Home
        </AppButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  button: {
    marginTop: 8,
  },
});
