import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { EmptyState } from "./EmptyState";
import { SwipeDismissModal } from "./SwipeDismissModal";
import { BRAND_COLORS, palette, theme } from "./theme";
import { AppCaption } from "./typography";

// ── Types ────────────────────────────────────────────────────────────────────

export type TableColDef<T> = {
  key: string;
  label: string;
  width: number;
  align?: "right" | "center";
  /** Provide a comparable value to enable tap-to-sort on this column. */
  sortValue?: (row: T) => string | number | Date;
  renderCell: (row: T) => React.ReactNode;
};

export type TableProps<T> = {
  title?: string;
  data: T[];
  columns: TableColDef<T>[];
  keyExtractor: (row: T) => string;
  searchEnabled?: boolean;
  searchPlaceholder?: string;
  /** Return true if the row matches the query string. */
  searchFilter?: (query: string, row: T) => boolean;
  columnSelectionEnabled?: boolean;
  pageSizeOptions?: readonly number[];
  defaultPageSize?: number;
  defaultSortKey?: string;
  defaultSortDir?: "asc" | "desc";
  emptyTitle?: string;
  emptyMessage?: string;
  /** Called when a data row is tapped. Omit to make rows non-pressable. */
  onRowClick?: (row: T) => void;
  /** Pin the first column so it stays visible during horizontal scroll. */
  stickyFirstColumn?: boolean;
  style?: StyleProp<ViewStyle>;
};

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

// ── Component ────────────────────────────────────────────────────────────────

export function Table<T>({
  title,
  data,
  columns,
  keyExtractor,
  searchEnabled = false,
  searchPlaceholder = "Search…",
  searchFilter,
  columnSelectionEnabled = false,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  defaultPageSize = 10,
  defaultSortKey = "",
  defaultSortDir = "asc",
  emptyTitle = "No records found",
  emptyMessage = "Try adjusting your search or filters",
  onRowClick,
  stickyFirstColumn = false,
  style,
}: TableProps<T>) {
  const { width } = useWindowDimensions();

  // ── State ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [rowsModalVisible, setRowsModalVisible] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(columns.map((c) => [c.key, true])),
  );
  const [colsModalVisible, setColsModalVisible] = useState(false);
  // Height sync for sticky-first-column layout
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0);
  const [stickyRowHeights, setStickyRowHeights] = useState<
    Record<string, number>
  >({});

  // ── Derived data ───────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (!searchEnabled || !searchQuery || !searchFilter) return data;
    return data.filter((row) => searchFilter(searchQuery, row));
  }, [data, searchEnabled, searchFilter, searchQuery]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filteredData;
    return [...filteredData].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      let cmp = 0;
      if (av instanceof Date && bv instanceof Date) {
        cmp = av.getTime() - bv.getTime();
      } else if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [columns, filteredData, sortDir, sortKey]);

  const activeCols = useMemo(
    () => columns.filter((c) => visibleCols[c.key] !== false),
    [columns, visibleCols],
  );

  const totalRecords = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageData = sortedData.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const rangeStart = totalRecords === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalRecords);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleSearch(text: string) {
    setSearchQuery(text);
    setCurrentPage(1);
  }

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setCurrentPage(1);
  }

  function toggleCol(key: string) {
    const count = Object.values(visibleCols).filter(Boolean).length;
    if (visibleCols[key] && count === 1) return;
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const showControls = searchEnabled || columnSelectionEnabled;

  return (
    <View style={[s.outer, style]}>
      {/* 1. Title */}
      {!!title && (
        <Text style={[s.title, { color: theme.color.ink }]}>{title}</Text>
      )}

      {/* 2. Search bar + 3. Columns button */}
      {showControls && (
        <View style={s.searchRow}>
          {searchEnabled && (
            <View
              style={[
                s.searchBar,
                {
                  borderColor: theme.color.border,
                  backgroundColor: theme.color.card,
                },
              ]}
            >
              <TextInput
                style={[s.searchInput, { color: theme.color.ink }]}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.color.muted}
                value={searchQuery}
                onChangeText={handleSearch}
                returnKeyType="search"
              />
              {searchQuery !== "" && (
                <TouchableOpacity
                  onPress={() => handleSearch("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color={theme.color.muted} strokeWidth={2} />
                </TouchableOpacity>
              )}
              <View style={s.searchIconBtn}>
                <Search size={16} color="#fff" strokeWidth={2.5} />
              </View>
            </View>
          )}

          {columnSelectionEnabled && (
            <TouchableOpacity
              style={[
                s.colsBtn,
                {
                  borderColor: theme.color.border,
                  backgroundColor: theme.color.card,
                },
              ]}
              onPress={() => setColsModalVisible(true)}
              activeOpacity={0.7}
            >
              <SlidersHorizontal
                size={13}
                color={theme.color.muted}
                strokeWidth={2}
              />
              <Text style={[s.colsBtnText, { color: theme.color.muted }]}>
                Columns
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {searchEnabled && (
        <AppCaption style={{ marginVertical: 2 }}>
          {totalRecords} {totalRecords === 1 ? "record" : "records"}
          {searchQuery ? ` matching "${searchQuery}"` : ""} · tap a column
          header to sort
        </AppCaption>
      )}

      {/* 4. Table */}
      {sortedData.length === 0 ? (
        <EmptyState icon={FileText} title={emptyTitle} message={emptyMessage} />
      ) : (
        <View style={s.container}>
          {stickyFirstColumn && activeCols.length > 1 ? (
            <View style={{ flexDirection: "row" }}>
              {/* Fixed first column — heights driven by onLayout of scrollable side */}
              <View style={s.stickyPanel}>
                <View
                  style={[
                    s.headerRow,
                    stickyHeaderHeight > 0 && { height: stickyHeaderHeight },
                  ]}
                >
                  {activeCols.slice(0, 1).map((col) => (
                    <TouchableOpacity
                      key={col.key}
                      style={[s.headerCell, { width: col.width }]}
                      onPress={
                        col.sortValue ? () => handleSort(col.key) : undefined
                      }
                      activeOpacity={col.sortValue ? 0.65 : 1}
                    >
                      <View
                        style={[
                          s.headerInner,
                          col.align === "right" && {
                            justifyContent: "flex-end",
                          },
                          col.align === "center" && {
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <Text style={s.headerText}>{col.label}</Text>
                        {col.sortValue &&
                          sortKey === col.key &&
                          (sortDir === "asc" ? (
                            <ChevronUp
                              size={9}
                              color={theme.color.accent}
                              strokeWidth={3}
                            />
                          ) : (
                            <ChevronDown
                              size={9}
                              color={theme.color.accent}
                              strokeWidth={3}
                            />
                          ))}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                {pageData.map((row, i) => {
                  const rowKey = keyExtractor(row);
                  const col = activeCols[0];
                  const rowStyle = [
                    s.row,
                    i % 2 !== 0 && { backgroundColor: palette.subtleBg },
                    stickyRowHeights[rowKey]
                      ? { height: stickyRowHeights[rowKey] }
                      : undefined,
                  ];
                  const cell = (
                    <View style={[s.cell, { width: col.width }]}>
                      {col.renderCell(row)}
                    </View>
                  );
                  return onRowClick ? (
                    <TouchableOpacity
                      key={rowKey}
                      style={rowStyle}
                      onPress={() => onRowClick(row)}
                      activeOpacity={0.65}
                    >
                      {cell}
                    </TouchableOpacity>
                  ) : (
                    <View key={rowKey} style={rowStyle}>
                      {cell}
                    </View>
                  );
                })}
              </View>

              {/* Scrollable remaining columns — authoritative source of heights */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                bounces={false}
                style={{ flex: 1 }}
              >
                <View>
                  <View
                    style={s.headerRow}
                    onLayout={(e) => {
                      const h = Math.ceil(e.nativeEvent.layout.height);
                      setStickyHeaderHeight((prev) => (prev === h ? prev : h));
                    }}
                  >
                    {activeCols.slice(1).map((col) => (
                      <TouchableOpacity
                        key={col.key}
                        style={[s.headerCell, { width: col.width }]}
                        onPress={
                          col.sortValue ? () => handleSort(col.key) : undefined
                        }
                        activeOpacity={col.sortValue ? 0.65 : 1}
                      >
                        <View
                          style={[
                            s.headerInner,
                            col.align === "right" && {
                              justifyContent: "flex-end",
                            },
                            col.align === "center" && {
                              justifyContent: "center",
                            },
                          ]}
                        >
                          <Text style={s.headerText}>{col.label}</Text>
                          {col.sortValue &&
                            sortKey === col.key &&
                            (sortDir === "asc" ? (
                              <ChevronUp
                                size={9}
                                color={theme.color.accent}
                                strokeWidth={3}
                              />
                            ) : (
                              <ChevronDown
                                size={9}
                                color={theme.color.accent}
                                strokeWidth={3}
                              />
                            ))}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {pageData.map((row, i) => {
                    const rowKey = keyExtractor(row);
                    const rowStyle = [
                      s.row,
                      i % 2 !== 0 && { backgroundColor: palette.subtleBg },
                    ];
                    const cells = activeCols.slice(1).map((col) => (
                      <View
                        key={col.key}
                        style={[s.cell, { width: col.width }]}
                      >
                        {col.renderCell(row)}
                      </View>
                    ));
                    const onMeasure = (e: {
                      nativeEvent: { layout: { height: number } };
                    }) => {
                      const h = Math.ceil(e.nativeEvent.layout.height);
                      setStickyRowHeights((prev) =>
                        prev[rowKey] === h ? prev : { ...prev, [rowKey]: h },
                      );
                    };
                    return onRowClick ? (
                      <TouchableOpacity
                        key={rowKey}
                        style={rowStyle}
                        onPress={() => onRowClick(row)}
                        activeOpacity={0.65}
                        onLayout={onMeasure}
                      >
                        {cells}
                      </TouchableOpacity>
                    ) : (
                      <View key={rowKey} style={rowStyle} onLayout={onMeasure}>
                        {cells}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              bounces={false}
            >
              <View>
                {/* Header row */}
                <View style={s.headerRow}>
                  {activeCols.map((col) => (
                    <TouchableOpacity
                      key={col.key}
                      style={[s.headerCell, { width: col.width }]}
                      onPress={
                        col.sortValue ? () => handleSort(col.key) : undefined
                      }
                      activeOpacity={col.sortValue ? 0.65 : 1}
                    >
                      <View
                        style={[
                          s.headerInner,
                          col.align === "right" && {
                            justifyContent: "flex-end",
                          },
                          col.align === "center" && {
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <Text style={s.headerText}>{col.label}</Text>
                        {col.sortValue &&
                          sortKey === col.key &&
                          (sortDir === "asc" ? (
                            <ChevronUp
                              size={9}
                              color={theme.color.accent}
                              strokeWidth={3}
                            />
                          ) : (
                            <ChevronDown
                              size={9}
                              color={theme.color.accent}
                              strokeWidth={3}
                            />
                          ))}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Data rows */}
                {pageData.map((row, i) => {
                  const rowKey = keyExtractor(row);
                  const rowStyle = [
                    s.row,
                    i % 2 !== 0 && { backgroundColor: palette.subtleBg },
                  ];
                  const cells = activeCols.map((col) => (
                    <View key={col.key} style={[s.cell, { width: col.width }]}>
                      {col.renderCell(row)}
                    </View>
                  ));
                  return onRowClick ? (
                    <TouchableOpacity
                      key={rowKey}
                      style={rowStyle}
                      onPress={() => onRowClick(row)}
                      activeOpacity={0.65}
                    >
                      {cells}
                    </TouchableOpacity>
                  ) : (
                    <View key={rowKey} style={rowStyle}>
                      {cells}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Integrated pagination footer */}
          <View style={s.footer}>
            <AppCaption>{`${rangeStart}–${rangeEnd} / ${totalRecords}`}</AppCaption>
            <View style={s.footerRight}>
              <TouchableOpacity
                style={s.footerRowsPicker}
                onPress={() => setRowsModalVisible(true)}
                activeOpacity={0.7}
              >
                <AppCaption>Rows</AppCaption>
                <AppCaption
                  style={{ fontWeight: "700", color: theme.color.ink }}
                >
                  {pageSize}
                </AppCaption>
                <ChevronDown
                  size={10}
                  color={theme.color.muted}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>
              <AppCaption>
                {safePage} / {totalPages}
              </AppCaption>
              <TouchableOpacity
                style={[s.footerPageBtn, safePage === 1 && { opacity: 0.35 }]}
                onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                activeOpacity={0.7}
              >
                <ChevronLeft
                  size={14}
                  color={theme.color.accent}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.footerPageBtn,
                  safePage === totalPages && { opacity: 0.35 },
                ]}
                onPress={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage === totalPages}
                activeOpacity={0.7}
              >
                <ChevronRight
                  size={14}
                  color={theme.color.accent}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <SwipeDismissModal
        visible={rowsModalVisible}
        onDismiss={() => setRowsModalVisible(false)}
        title="Rows per page"
        sheetWidth={280}
      >
        <View style={s.pickerList}>
          {[...pageSizeOptions].map((n) => (
            <TouchableOpacity
              key={n}
              style={[
                s.pickerRow,
                { borderBottomColor: theme.color.border },
                pageSize === n && { backgroundColor: "#ecfdf5" },
              ]}
              onPress={() => {
                setPageSize(n);
                setCurrentPage(1);
                setRowsModalVisible(false);
              }}
            >
              <Text
                style={[
                  s.pickerRowText,
                  {
                    color:
                      pageSize === n
                        ? BRAND_COLORS.primaryGreen
                        : theme.color.ink,
                  },
                ]}
              >
                {n} rows
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SwipeDismissModal>

      {/* Column picker modal */}
      {columnSelectionEnabled && (
        <SwipeDismissModal
          visible={colsModalVisible}
          onDismiss={() => setColsModalVisible(false)}
          title="Columns"
          sheetWidth={width >= 768 ? 360 : 320}
        >
          <View style={s.colList}>
            {columns.map((col) => {
              const isVisible = visibleCols[col.key] !== false;
              const count = Object.values(visibleCols).filter(Boolean).length;
              const isLast = isVisible && count === 1;
              return (
                <TouchableOpacity
                  key={col.key}
                  style={[s.colRow, { borderBottomColor: theme.color.border }]}
                  onPress={() => !isLast && toggleCol(col.key)}
                  activeOpacity={isLast ? 1 : 0.7}
                >
                  <Text
                    style={[
                      s.colRowLabel,
                      {
                        color: isLast ? theme.color.muted : theme.color.ink,
                      },
                    ]}
                  >
                    {col.label}
                  </Text>
                  <View
                    style={[
                      s.checkbox,
                      isVisible
                        ? {
                            backgroundColor: theme.color.accent,
                            borderColor: theme.color.accent,
                          }
                        : {
                            borderColor: theme.color.border,
                            backgroundColor: "transparent",
                          },
                      isLast && { opacity: 0.4 },
                    ]}
                  >
                    {isVisible && (
                      <Check size={11} color="#fff" strokeWidth={3} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </SwipeDismissModal>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  outer: {
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.card,
    padding: 12,
    gap: 8,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  // Search row
  searchRow: { flexDirection: "row", gap: 8 },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 12,
    paddingRight: 0,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  searchInput: { flex: 1, fontSize: 13, padding: 0, paddingVertical: 11 },
  searchIconBtn: {
    backgroundColor: BRAND_COLORS.primaryGreen,
    paddingHorizontal: 14,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
  },
  colsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  colsBtnText: { fontSize: 12, fontWeight: "600" },

  // Table card
  container: {
    backgroundColor: theme.color.card,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    borderColor: theme.color.border,
    overflow: "hidden",
  },
  stickyPanel: {
    borderRightWidth: 2,
    borderRightColor: palette.neutralBorder,
    backgroundColor: theme.color.card,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: palette.mutedBg,
    borderBottomWidth: 1,
    borderBottomColor: theme.color.border,
  },
  headerCell: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: theme.color.border,
  },
  headerInner: { flexDirection: "row", alignItems: "center", gap: 3 },
  headerText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.color.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border,
    backgroundColor: theme.color.card,
  },
  cell: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: "center",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: theme.color.border,
  },

  // Pagination footer (lives inside the table container)
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.border,
    backgroundColor: palette.mutedBg,
  },
  footerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerRowsPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.card,
  },
  footerPageBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.card,
    borderWidth: 1,
    borderColor: theme.color.border,
  },

  // Rows-per-page picker
  pickerList: {
    paddingVertical: 4,
  },
  pickerRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerRowText: { fontSize: 14 },

  // Column picker
  colList: {
    paddingVertical: 4,
  },
  colRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colRowLabel: { fontSize: 14 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
