import { Search, X } from "lucide-react-native";
import React, { useMemo, useRef, useState } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { AppLabel } from "./typography";
import { EmptyState } from "./EmptyState";
import { SwipeDismissModal } from "./SwipeDismissModal";
import { BRAND_COLORS, theme } from "./theme";

// ── Types ────────────────────────────────────────────────────────────────────

export type LookupFieldProps<T> = {
  label?: string;
  placeholder?: string;
  modalTitle: string;
  data: T[];
  searchKeys: (keyof T & string)[];
  value: T | null;
  onSelect: (item: T | null) => void;
  renderDisplay: (item: T) => string;
  renderMeta?: (item: T) => string;
  keyExtractor?: (item: T) => string;
  maxSuggestions?: number;
  style?: StyleProp<ViewStyle>;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function filterData<T>(
  data: T[],
  keys: (keyof T & string)[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return data;
  return data.filter((item) =>
    keys.some((key) =>
      String((item as Record<string, unknown>)[key] ?? "")
        .toLowerCase()
        .includes(q),
    ),
  );
}

// ── Component ────────────────────────────────────────────────────────────────
//
// A search trigger that combines two familiar patterns from this app:
//  - Inline autosuggest (like a native combobox) while the user types.
//  - A full bottom-sheet search (SwipeDismissModal) for browsing/filtering
//    the whole list, matching Table.tsx's search bar styling.

export function LookupField<T>({
  label,
  placeholder = "Search…",
  modalTitle,
  data,
  searchKeys,
  value,
  onSelect,
  renderDisplay,
  renderMeta,
  keyExtractor,
  maxSuggestions = 5,
  style,
}: LookupFieldProps<T>) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalQuery, setModalQuery] = useState("");
  const inputRef = useRef<TextInput>(null);

  const matches = useMemo(
    () => filterData(data, searchKeys, query),
    [data, searchKeys, query],
  );
  const suggestions = matches.slice(0, maxSuggestions);
  const moreCount = matches.length - suggestions.length;
  const showSuggestions =
    focused && !value && query.trim() !== "" && suggestions.length > 0;

  const modalResults = useMemo(
    () => filterData(data, searchKeys, modalQuery),
    [data, searchKeys, modalQuery],
  );

  function getKey(item: T, index: number) {
    return keyExtractor ? keyExtractor(item) : String(index);
  }

  function openModal() {
    setFocused(false);
    inputRef.current?.blur();
    setModalQuery(query.trim());
    setModalVisible(true);
  }

  function handlePick(item: T) {
    onSelect(item);
    setQuery("");
    setFocused(false);
    setModalVisible(false);
    setModalQuery("");
  }

  function handleClear() {
    onSelect(null);
    setQuery("");
  }

  return (
    <View style={[s.wrap, style]}>
      {label ? <AppLabel style={{ marginBottom: 6 }}>{label}</AppLabel> : null}

      <View style={s.field}>
        {value ? (
          <TouchableOpacity
            style={s.textArea}
            activeOpacity={0.7}
            onPress={openModal}
          >
            <Text style={s.valueText} numberOfLines={1}>
              {renderDisplay(value)}
            </Text>
          </TouchableOpacity>
        ) : (
          <TextInput
            ref={inputRef}
            style={[s.textArea, s.textInput]}
            value={query}
            placeholder={placeholder}
            placeholderTextColor={theme.color.muted}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onChangeText={setQuery}
            onSubmitEditing={openModal}
            returnKeyType="search"
          />
        )}

        {(value || query) && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={8}
            style={s.clearBtn}
          >
            <X size={14} color={theme.color.muted} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={s.iconBox}
          activeOpacity={0.85}
          onPress={openModal}
        >
          <Search size={16} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Inline autosuggest */}
      {showSuggestions && (
        <Animated.View
          entering={FadeIn.duration(120)}
          exiting={FadeOut.duration(100)}
          style={s.suggestBox}
        >
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={getKey(item, index)}
              style={s.suggestRow}
              onPress={() => handlePick(item)}
              activeOpacity={0.7}
            >
              <Search size={12} color={theme.color.muted} />
              <Text style={s.suggestText} numberOfLines={1}>
                {renderDisplay(item)}
              </Text>
            </TouchableOpacity>
          ))}
          {moreCount > 0 && (
            <TouchableOpacity
              style={s.suggestMore}
              onPress={openModal}
              activeOpacity={0.7}
            >
              <Text style={s.suggestMoreText}>
                See all {matches.length} results
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* Full-list search sheet */}
      <SwipeDismissModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        title={modalTitle}
        sheetWidth={460}
      >
        <View style={s.modalBody}>
          <View style={s.modalSearchWrap}>
            <Search size={15} color={theme.color.muted} />
            <TextInput
              style={s.modalSearchInput}
              placeholder={placeholder}
              placeholderTextColor={theme.color.muted}
              value={modalQuery}
              onChangeText={setModalQuery}
              autoFocus
            />
            {modalQuery !== "" && (
              <TouchableOpacity
                onPress={() => setModalQuery("")}
                hitSlop={8}
              >
                <X size={14} color={theme.color.muted} />
              </TouchableOpacity>
            )}
          </View>

          {modalResults.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matches"
              message="Try a different search term."
            />
          ) : (
            modalResults.map((item, index) => (
              <TouchableOpacity
                key={getKey(item, index)}
                style={s.modalRow}
                onPress={() => handlePick(item)}
                activeOpacity={0.75}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.modalRowTitle} numberOfLines={1}>
                    {renderDisplay(item)}
                  </Text>
                  {renderMeta && (
                    <Text style={s.modalRowMeta} numberOfLines={1}>
                      {renderMeta(item)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </SwipeDismissModal>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  wrap: { position: "relative", zIndex: 10 },

  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 12,
    paddingRight: 0,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.card,
    overflow: "hidden",
  },
  textArea: { flex: 1, justifyContent: "center", paddingVertical: 11 },
  textInput: { fontSize: 13, color: theme.color.ink, padding: 0 },
  valueText: { fontSize: 13, fontWeight: "600", color: theme.color.ink },
  clearBtn: { paddingHorizontal: 4 },
  iconBox: {
    backgroundColor: BRAND_COLORS.primaryGreen,
    paddingHorizontal: 14,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
  },

  // Inline autosuggest dropdown
  suggestBox: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 6,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.card,
    overflow: "hidden",
    zIndex: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  suggestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border,
  },
  suggestText: { flex: 1, fontSize: 13, color: theme.color.ink },
  suggestMore: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: BRAND_COLORS.subtleBg,
  },
  suggestMoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.primaryGreen,
  },

  // Modal (full search) body
  modalBody: { paddingHorizontal: 16, paddingTop: 2, gap: 2 },
  modalSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    backgroundColor: theme.color.card,
    marginBottom: 6,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 10,
    color: theme.color.ink,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border,
  },
  modalRowTitle: { fontSize: 13, fontWeight: "700", color: theme.color.ink },
  modalRowMeta: { fontSize: 11, color: theme.color.muted, marginTop: 2 },
});
