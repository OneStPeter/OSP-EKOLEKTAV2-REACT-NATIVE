import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import {
  Calendar,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  Search,
  X,
} from "lucide-react-native";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { EmptyState } from "./EmptyState";
import { SwipeDismissModal } from "./SwipeDismissModal";
import { BRAND_COLORS } from "./theme";

// ── Types ────────────────────────────────────────────────────────────────────

export type FloatingLabelInputType =
  | "text"
  | "password"
  | "email"
  | "number"
  | "date"
  | "time"
  | "datetime"
  | "select";

export interface FloatingLabelSelectOption {
  value: string;
  label: string;
}

export type FloatingLabelInputColorScheme = "light" | "dark" | "auto";

export interface FloatingLabelInputProps extends Omit<
  TextInputProps,
  "value" | "onChangeText" | "style" | "editable" | "secureTextEntry"
> {
  /** Field label — floats above the input once focused or filled. */
  label: string;
  /** Current display value (always a string, even for date/time types). */
  value: string;
  /** Fired with the new display string on every change. */
  onChangeText: (text: string) => void;
  /** Input variant. Defaults to "text". */
  type?: FloatingLabelInputType;
  /** Error message — when set, the border/label turn red and the message
   *  replaces `helperText` beneath the field. */
  error?: string;
  /** Helper text shown beneath the field when there's no error. */
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  /** "auto" follows the OS appearance. Defaults to "auto". */
  colorScheme?: FloatingLabelInputColorScheme;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;

  // ── date / time / datetime only ──
  /** Source-of-truth Date backing date/time/datetime types. Falls back to
   *  parsing `value` (rarely reliable once localized) or `new Date()`. */
  pickerValue?: Date;
  /** Fired with the picked Date alongside `onChangeText`. */
  onChangeValue?: (date: Date) => void;
  /** Custom formatter for the display string. Defaults to a locale-aware
   *  date / time / datetime string. */
  formatValue?: (date: Date, type: FloatingLabelInputType) => string;
  minimumDate?: Date;
  maximumDate?: Date;

  // ── select only ──
  /** The list shown in the bottom sheet when `type="select"`. */
  options?: FloatingLabelSelectOption[];
  /** Fired with the picked option alongside `onChangeText`. */
  onSelectOption?: (option: FloatingLabelSelectOption) => void;
  /** Custom formatter for the display string. Defaults to "value — label". */
  formatOption?: (option: FloatingLabelSelectOption) => string;
  /** Title of the selection bottom sheet. Defaults to `label`. */
  selectModalTitle?: string;
  /** Shows a search box in the selection bottom sheet to filter `options`. */
  searchable?: boolean;
  /** Placeholder for the search box. Defaults to "Search…". */
  searchPlaceholder?: string;
}

// ── Palettes ─────────────────────────────────────────────────────────────────

interface Palette {
  background: string;
  border: string;
  borderFocused: string;
  label: string;
  labelFocused: string;
  text: string;
  placeholder: string;
  helper: string;
  error: string;
  icon: string;
  disabledBg: string;
  disabledText: string;
}

const LIGHT_PALETTE: Palette = {
  background: "#FFFFFF",
  border: "#E2E4E8",
  borderFocused: BRAND_COLORS.primaryGreen,
  label: "#8B9097",
  labelFocused: BRAND_COLORS.primaryGreen,
  text: "#1B2024",
  placeholder: "#ADB1B8",
  helper: "#8B9097",
  error: "#D32F2F",
  icon: "#8B9097",
  disabledBg: "#F3F4F6",
  disabledText: "#B4B8BF",
};

const DARK_PALETTE: Palette = {
  background: "#1C1E22",
  border: "#33363B",
  borderFocused: BRAND_COLORS.softGreen,
  label: "#9096A0",
  labelFocused: BRAND_COLORS.softGreen,
  text: "#F2F3F5",
  placeholder: "#6B707A",
  helper: "#9096A0",
  error: "#FF6B6B",
  icon: "#9096A0",
  disabledBg: "#26282C",
  disabledText: "#5A5E66",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function defaultFormatValue(date: Date, type: FloatingLabelInputType) {
  if (type === "time") {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (type === "datetime") {
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function resolveInitialDate(pickerValue: Date | undefined, value: string) {
  if (pickerValue) return pickerValue;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function defaultFormatOption(option: FloatingLabelSelectOption) {
  return `${option.value} — ${option.label}`;
}

const REST_TOP = 17;
const FLOAT_TOP = -9;
const REST_FONT_SIZE = 15;
const FLOAT_FONT_SIZE = 11.5;

// ── Component ────────────────────────────────────────────────────────────────

function FloatingLabelInputImpl(
  {
    label,
    value,
    onChangeText,
    type = "text",
    error,
    helperText,
    leftIcon,
    rightIcon,
    disabled = false,
    colorScheme = "auto",
    containerStyle,
    inputStyle,
    pickerValue,
    onChangeValue,
    formatValue = defaultFormatValue,
    minimumDate,
    maximumDate,
    options,
    onSelectOption,
    formatOption = defaultFormatOption,
    selectModalTitle,
    searchable = false,
    searchPlaceholder = "Search…",
    onFocus,
    onBlur,
    ...rest
  }: FloatingLabelInputProps,
  ref: React.ForwardedRef<TextInput>,
) {
  const systemScheme = useColorScheme();
  const resolvedScheme =
    colorScheme === "auto" ? (systemScheme ?? "light") : colorScheme;
  const palette: Palette =
    resolvedScheme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;

  const isDateType = type === "date" || type === "time" || type === "datetime";
  const isSelectType = type === "select";
  const isPickerType = isDateType || isSelectType;
  const isPassword = type === "password";

  const [isFocused, setIsFocused] = useState(false);
  const [secureVisible, setSecureVisible] = useState(false);
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [selectQuery, setSelectQuery] = useState("");
  const [tempDate, setTempDate] = useState<Date>(() =>
    resolveInitialDate(pickerValue, value),
  );

  const inputRef = useRef<TextInput>(null);
  React.useImperativeHandle(ref, () => inputRef.current as TextInput);

  const floated = isFocused || value.length > 0;
  const floatAnim = useSharedValue(floated ? 1 : 0);

  useEffect(() => {
    floatAnim.value = withTiming(floated ? 1 : 0, {
      duration: 160,
      easing: Easing.out(Easing.cubic),
    });
  }, [floated, floatAnim]);

  const labelStyle = useAnimatedStyle(() => ({
    top: interpolate(floatAnim.value, [0, 1], [REST_TOP, FLOAT_TOP]),
    fontSize: interpolate(
      floatAnim.value,
      [0, 1],
      [REST_FONT_SIZE, FLOAT_FONT_SIZE],
    ),
  }));

  const labelColor = error
    ? palette.error
    : isFocused
      ? palette.labelFocused
      : palette.label;

  // Matches whatever sits behind the label so the floated label visually
  // "cuts" a gap in the top border, Material-outline style.
  const labelBackground = disabled ? palette.disabledBg : palette.background;

  const borderColor = error
    ? palette.error
    : isFocused
      ? palette.borderFocused
      : palette.border;

  function handleFocus(
    e: Parameters<NonNullable<TextInputProps["onFocus"]>>[0],
  ) {
    setIsFocused(true);
    onFocus?.(e);
  }

  function handleBlur(e: Parameters<NonNullable<TextInputProps["onBlur"]>>[0]) {
    setIsFocused(false);
    onBlur?.(e);
  }

  const commitDate = useCallback(
    (date: Date) => {
      setTempDate(date);
      onChangeText(formatValue(date, type));
      onChangeValue?.(date);
    },
    [formatValue, onChangeText, onChangeValue, type],
  );

  const openAndroidPicker = useCallback(
    (mode: "date" | "time") => {
      DateTimePickerAndroid.open({
        value: tempDate,
        mode,
        is24Hour: false,
        minimumDate,
        maximumDate,
        onChange: (event, selected) => {
          if (event.type !== "set" || !selected) {
            setIsFocused(false);
            return;
          }
          if (type === "datetime" && mode === "date") {
            // Android has no combined mode — chain into the time picker.
            setTempDate(selected);
            openAndroidPicker("time");
            return;
          }
          commitDate(selected);
          setIsFocused(false);
        },
      });
    },
    [commitDate, maximumDate, minimumDate, tempDate, type],
  );

  function openPicker() {
    if (disabled) return;
    setIsFocused(true);
    setTempDate(resolveInitialDate(pickerValue ?? tempDate, value));
    if (Platform.OS === "android") {
      openAndroidPicker(type === "time" ? "time" : "date");
    } else {
      setIosPickerVisible(true);
    }
  }

  function confirmIosPicker() {
    commitDate(tempDate);
    setIosPickerVisible(false);
    setIsFocused(false);
  }

  function cancelIosPicker() {
    setIosPickerVisible(false);
    setIsFocused(false);
  }

  function openSelectModal() {
    if (disabled) return;
    setIsFocused(true);
    setSelectQuery("");
    setSelectModalVisible(true);
  }

  function closeSelectModal() {
    setSelectModalVisible(false);
    setIsFocused(false);
    setSelectQuery("");
  }

  function handleSelectOption(option: FloatingLabelSelectOption) {
    onChangeText(formatOption(option));
    onSelectOption?.(option);
    closeSelectModal();
  }

  const filteredOptions = useMemo(() => {
    if (!searchable || !selectQuery.trim()) return options ?? [];
    const q = selectQuery.trim().toLowerCase();
    return (options ?? []).filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, searchable, selectQuery]);

  const keyboardProps: Partial<TextInputProps> = useMemo(() => {
    switch (type) {
      case "email":
        return {
          keyboardType: "email-address",
          autoCapitalize: "none",
          autoCorrect: false,
        };
      case "number":
        return { keyboardType: "numeric" };
      case "password":
        return { autoCapitalize: "none", autoCorrect: false };
      default:
        return {};
    }
  }, [type]);

  const defaultTypeIcon = useMemo(() => {
    if (type === "date" || type === "datetime") return Calendar;
    if (type === "time") return Clock;
    if (type === "select") return ChevronDown;
    return null;
  }, [type]);

  const s = useMemo(() => makeStyles(palette), [palette]);

  const showLeftIcon = leftIcon != null;
  const TypeIcon = defaultTypeIcon;

  return (
    <View style={[s.wrap, containerStyle]}>
      <Pressable
        disabled={disabled}
        onPress={
          isDateType ? openPicker : isSelectType ? openSelectModal : undefined
        }
        style={[s.field, { borderColor }, disabled && s.fieldDisabled]}
      >
        {showLeftIcon && <View style={s.sideIcon}>{leftIcon}</View>}

        <View style={s.inputArea}>
          <Animated.Text
            style={[
              s.label,
              labelStyle,
              { color: labelColor, backgroundColor: labelBackground },
            ]}
            numberOfLines={1}
          >
            {label}
          </Animated.Text>

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            editable={!disabled && !isPickerType}
            pointerEvents={isPickerType ? "none" : "auto"}
            secureTextEntry={isPassword && !secureVisible}
            placeholderTextColor={palette.placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[
              s.input,
              { color: disabled ? palette.disabledText : palette.text },
              inputStyle,
            ]}
            {...keyboardProps}
            {...rest}
          />
        </View>

        {isPassword && (
          <TouchableOpacity
            hitSlop={8}
            style={s.sideIcon}
            onPress={() => setSecureVisible((v) => !v)}
          >
            {secureVisible ? (
              <EyeOff size={18} color={palette.icon} />
            ) : (
              <Eye size={18} color={palette.icon} />
            )}
          </TouchableOpacity>
        )}

        {isPickerType && !rightIcon && TypeIcon && (
          <View style={s.sideIcon}>
            <TypeIcon size={18} color={palette.icon} />
          </View>
        )}

        {rightIcon && <View style={s.sideIcon}>{rightIcon}</View>}
      </Pressable>

      {(error || helperText) && (
        <Text style={[s.helper, error ? s.helperError : null]}>
          {error || helperText}
        </Text>
      )}

      {/* iOS renders the picker inline (no native dialog) — show it as a
          small popover the user confirms/cancels explicitly. */}
      {Platform.OS === "ios" && iosPickerVisible && (
        <View style={s.iosPopover}>
          <DateTimePicker
            value={tempDate}
            mode={
              type === "time"
                ? "time"
                : type === "datetime"
                  ? "datetime"
                  : "date"
            }
            display="spinner"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={(_event, selected) => {
              if (selected) setTempDate(selected);
            }}
          />
          <View style={s.iosPopoverActions}>
            <TouchableOpacity onPress={cancelIosPicker} hitSlop={8}>
              <Text style={s.iosPopoverCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmIosPicker} hitSlop={8}>
              <Text style={s.iosPopoverDone}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isSelectType && (
        <SwipeDismissModal
          visible={selectModalVisible}
          onDismiss={closeSelectModal}
          title={selectModalTitle ?? label}
          sheetWidth={420}
        >
          <View style={s.selectListBody}>
            {searchable && (
              <View style={s.selectSearchWrap}>
                <Search size={15} color={palette.icon} />
                <TextInput
                  style={s.selectSearchInput}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={palette.placeholder}
                  value={selectQuery}
                  onChangeText={setSelectQuery}
                  autoFocus
                />
                {selectQuery !== "" && (
                  <TouchableOpacity onPress={() => setSelectQuery("")} hitSlop={8}>
                    <X size={14} color={palette.icon} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {!options || options.length === 0 ? (
              <EmptyState title="No options" message="Nothing to select." />
            ) : filteredOptions.length === 0 ? (
              <EmptyState title="No matches" message="Try a different search term." />
            ) : (
              filteredOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={s.selectRow}
                  activeOpacity={0.75}
                  onPress={() => handleSelectOption(option)}
                >
                  <Text style={s.selectRowLabel} numberOfLines={1}>
                    {option.label}
                  </Text>
                  <Text style={s.selectRowValue}>{option.value}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </SwipeDismissModal>
      )}
    </View>
  );
}

const FloatingLabelInputBase = forwardRef(FloatingLabelInputImpl);
FloatingLabelInputBase.displayName = "FloatingLabelInput";

export const FloatingLabelInput = React.memo(FloatingLabelInputBase);

// ── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(palette: Palette) {
  return StyleSheet.create({
    wrap: { width: "100%", marginTop: 9 },
    field: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 48,
      borderWidth: 1.5,
      borderRadius: 12,
      backgroundColor: palette.background,
      paddingHorizontal: 12,
    },
    fieldDisabled: { backgroundColor: palette.disabledBg },
    inputArea: { flex: 1, justifyContent: "center", minHeight: 48 },
    label: {
      position: "absolute",
      left: -4,
      paddingHorizontal: 4,
      fontWeight: "500",
    },
    input: {
      fontSize: 15,
      paddingVertical: 0,
      paddingHorizontal: 0,
      color: palette.text,
    },
    sideIcon: {
      marginLeft: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    helper: {
      fontSize: 12,
      color: palette.helper,
      marginTop: 4,
      marginLeft: 4,
    },
    helperError: { color: palette.error },
    iosPopover: {
      marginTop: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.background,
      overflow: "hidden",
    },
    iosPopoverActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: palette.border,
    },
    iosPopoverCancel: { fontSize: 14, color: palette.helper },
    iosPopoverDone: {
      fontSize: 14,
      fontWeight: "700",
      color: palette.labelFocused,
    },
    selectListBody: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8 },
    selectSearchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      backgroundColor: palette.background,
      marginBottom: 6,
    },
    selectSearchInput: {
      flex: 1,
      fontSize: 13,
      paddingVertical: 10,
      color: palette.text,
    },
    selectRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: palette.border,
    },
    selectRowLabel: { flex: 1, fontSize: 13, color: palette.text },
    selectRowValue: {
      fontSize: 11,
      fontWeight: "700",
      color: palette.helper,
    },
  });
}
