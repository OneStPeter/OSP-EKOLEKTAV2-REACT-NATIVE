import { Calendar } from "lucide-react-native";
import {
  BaseButton,
  DatePickerCalendar,
  Dialog,
  FloatingLabelInput,
  FloatingLabelSelect,
  SegmentedControl,
} from "osp-ui-kit-native";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DateTimeFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  /** `datetime` adds hour / minute / AM-PM controls under the calendar. */
  mode?: "date" | "datetime";
  /** Display formatter. Defaults to a short locale date (and time). */
  format?: (date: Date) => string;
  minDate?: Date;
  maxDate?: Date;
  required?: boolean;
  disabled?: boolean;
  errorText?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const h = String(i + 1);
  return { value: h, label: h };
});

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => {
  const m = String(i).padStart(2, "0");
  return { value: m, label: m };
});

const MERIDIEM_OPTIONS = [
  { value: "AM" as const, label: "AM" },
  { value: "PM" as const, label: "PM" },
];

function defaultFormat(date: Date, mode: "date" | "datetime") {
  return mode === "datetime"
    ? date.toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

// ── Component ────────────────────────────────────────────────────────────────
// The kit has no single date input, so this composes one from kit parts: a
// read-only FloatingLabelInput as the trigger, opening a Dialog that holds the
// kit's DatePickerCalendar (plus time selects for `datetime`).

export function DateTimeField({
  label,
  value,
  onChange,
  mode = "date",
  format,
  minDate,
  maxDate,
  required,
  disabled,
  errorText,
  containerStyle,
}: DateTimeFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? new Date());

  const hours24 = draft.getHours();
  const hour12 = String(hours24 % 12 === 0 ? 12 : hours24 % 12);
  const minute = String(draft.getMinutes()).padStart(2, "0");
  const meridiem: "AM" | "PM" = hours24 >= 12 ? "PM" : "AM";

  function openPicker() {
    if (disabled) return;
    setDraft(value ?? new Date());
    setOpen(true);
  }

  function updateDraft(patch: {
    day?: Date;
    hour12?: string;
    minute?: string;
    meridiem?: "AM" | "PM";
  }) {
    const next = new Date(draft);
    if (patch.day) {
      next.setFullYear(
        patch.day.getFullYear(),
        patch.day.getMonth(),
        patch.day.getDate(),
      );
    }
    const h = Number(patch.hour12 ?? hour12) % 12;
    const isPm = (patch.meridiem ?? meridiem) === "PM";
    next.setHours(isPm ? h + 12 : h, Number(patch.minute ?? minute), 0, 0);
    setDraft(next);
  }

  function confirm() {
    onChange(draft);
    setOpen(false);
  }

  const display = value ? (format ?? ((d) => defaultFormat(d, mode)))(value) : "";

  return (
    <>
      <Pressable
        onPress={openPicker}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={containerStyle}
      >
        <View pointerEvents="none">
          <FloatingLabelInput
            label={label}
            value={display}
            editable={false}
            required={required}
            disabled={disabled}
            errorText={errorText}
            endIcon={Calendar}
          />
        </View>
      </Pressable>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={label}
        size="sm"
        footer={
          <View style={s.footer}>
            <BaseButton variant="outline" onPress={() => setOpen(false)}>
              Cancel
            </BaseButton>
            <BaseButton onPress={confirm}>Done</BaseButton>
          </View>
        }
      >
        <DatePickerCalendar
          selected={draft}
          onSelect={(day) => day && updateDraft({ day })}
          minDate={minDate}
          maxDate={maxDate}
          defaultMonth={draft}
        />
        {mode === "datetime" && (
          <View style={s.timeRow}>
            <FloatingLabelSelect
              label="Hour"
              value={hour12}
              options={HOUR_OPTIONS}
              onValueChange={(h) => updateDraft({ hour12: h })}
              containerStyle={s.timeField}
            />
            <FloatingLabelSelect
              label="Minute"
              value={minute}
              options={MINUTE_OPTIONS}
              onValueChange={(m) => updateDraft({ minute: m })}
              containerStyle={s.timeField}
            />
            <SegmentedControl
              options={MERIDIEM_OPTIONS}
              value={meridiem}
              onValueChange={(m) => updateDraft({ meridiem: m })}
            />
          </View>
        )}
      </Dialog>
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  timeField: { flex: 1 },
});
