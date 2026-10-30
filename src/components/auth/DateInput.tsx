import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { FormInput, type FormInputSize } from "@/components/auth/FormInput";

type IconName = { ios: string; android: string; web: string };

interface DateInputProps {
  label: string;
  iconName: IconName;
  /** Calendar date as "YYYY-MM-DD", or "" when empty. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  size?: FormInputSize;
}

export function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses "YYYY-MM-DD" as a LOCAL date (avoids the UTC shift of `new Date(str)`). */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  // Reject roll-overs such as 2001-02-30 → 2001-03-02.
  return toIsoDate(date) === value ? date : null;
}

function formatDisplay(value: string) {
  const date = parseIsoDate(value);
  return date
    ? date.toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })
    : "";
}

/**
 * Date field with the same look as FormInput. Opens the native picker on
 * Android/iOS; on web (no native picker) the date is typed as YYYY-MM-DD.
 */
export function DateInput({
  label,
  iconName,
  value,
  onChange,
  placeholder = "Select a date",
  error,
  minimumDate,
  maximumDate,
  size,
}: DateInputProps) {
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  if (Platform.OS === "web") {
    return (
      <FormInput
        label={label}
        iconName={iconName}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        maxLength={10}
        error={error}
        size={size}
      />
    );
  }

  function openPicker() {
    const initial = parseIsoDate(value) ?? maximumDate ?? new Date();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: initial,
        mode: "date",
        minimumDate,
        maximumDate,
        onChange: (event, selected) => {
          if (event.type === "set" && selected) onChange(toIsoDate(selected));
        },
      });
    } else {
      setTempDate(initial);
      setIosPickerVisible(true);
    }
  }

  function confirmIosPicker() {
    onChange(toIsoDate(tempDate));
    setIosPickerVisible(false);
  }

  return (
    <View>
      <Pressable onPress={openPicker} accessibilityRole="button" accessibilityLabel={label}>
        {/* Taps go to the Pressable; the input is display-only. */}
        <View pointerEvents="none">
          <FormInput
            label={label}
            iconName={iconName}
            value={formatDisplay(value)}
            placeholder={placeholder}
            editable={false}
            error={error}
            size={size}
          />
        </View>
      </Pressable>

      {Platform.OS === "ios" && iosPickerVisible && (
        <View style={styles.iosPopover}>
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={(_event, selected) => {
              if (selected) setTempDate(selected);
            }}
          />
          <View style={styles.iosPopoverActions}>
            <TouchableOpacity onPress={() => setIosPickerVisible(false)} hitSlop={8}>
              <Text style={styles.iosPopoverCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmIosPicker} hitSlop={8}>
              <Text style={styles.iosPopoverDone}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iosPopover: {
    marginTop: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingBottom: 10,
    overflow: "hidden",
  },
  iosPopoverActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
    paddingHorizontal: 16,
  },
  iosPopoverCancel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  iosPopoverDone: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
});
