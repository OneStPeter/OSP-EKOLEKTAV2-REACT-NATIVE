import { SymbolView } from "expo-symbols";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";

type IconName = { ios: string; android: string; web: string };

export type FormInputSize = "regular" | "compact";

interface FormInputProps extends TextInputProps {
  label: string;
  iconName: IconName;
  rightSlot?: React.ReactNode;
  error?: string;
  /** "compact" trims height and spacing for short screens. Defaults to "regular". */
  size?: FormInputSize;
}

export function FormInput({
  label,
  iconName,
  rightSlot,
  error,
  size = "regular",
  style,
  ...inputProps
}: FormInputProps) {
  const compact = size === "compact";
  return (
    <View style={[styles.root, compact && styles.rootCompact]}>
      <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          compact && styles.inputRowCompact,
          error ? styles.inputRowError : undefined,
        ]}
      >
        <SymbolView
          // @ts-expect-error — platform-specific name object is valid per expo-symbols API
          name={iconName}
          size={16}
          tintColor="#9ca3af"
          style={styles.icon}
        />
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          autoCorrect={false}
          {...inputProps}
        />
        {rightSlot && <View style={styles.rightSlot}>{rightSlot}</View>}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function EyeToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity onPress={onToggle} hitSlop={8} style={styles.eyeBtn}>
      <SymbolView
        name={
          visible
            ? {
                ios: "eye.slash",
                android: "visibility_off",
                web: "visibility_off",
              }
            : { ios: "eye", android: "visibility", web: "visibility" }
        }
        size={16}
        tintColor="#9ca3af"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 6,
  },
  rootCompact: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  labelCompact: {
    fontSize: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputRowCompact: {
    height: 44,
    borderRadius: 12,
  },
  inputRowError: {
    borderColor: "#ef4444",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  rightSlot: {
    marginLeft: 8,
  },
  eyeBtn: {
    padding: 4,
  },
  error: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 2,
  },
});
