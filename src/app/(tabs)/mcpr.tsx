import {
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Plus,
  Search,
  XCircle,
} from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_NAV_HEIGHT } from '@/components/navigation/BottomNavBar';
import { useScrollNav } from '@/hooks/use-scroll-nav';

const C = {
  light: { bg: '#f0fdf4', text: '#111827', sub: '#6b7280', card: '#ffffff', border: '#e5e7eb', accent: '#059669', dark: '#022c22' },
  dark:  { bg: '#030f0b', text: '#f3f4f6', sub: '#9ca3af', card: '#0d1f1a', border: '#1f2937', accent: '#34d399', dark: '#6ee7b7' },
};

const STATUS_COLOR = {
  Approved: '#059669',
  Pending:  '#d97706',
  Rejected: '#dc2626',
  Review:   '#2563eb',
};
const STATUS_BG = {
  Approved: '#ecfdf5',
  Pending:  '#fffbeb',
  Rejected: '#fef2f2',
  Review:   '#eff6ff',
};

type StatusKey = keyof typeof STATUS_COLOR;

const STATUS_ICON = {
  Approved: CheckCircle,
  Pending:  Clock,
  Rejected: XCircle,
  Review:   FileText,
};

const RECORDS = [
  { id: 'MCPR-0048', name: 'Santos, Juan M.',    date: 'Jun 24, 2026', status: 'Approved' as StatusKey, plan: 'Premier Plan' },
  { id: 'MCPR-0047', name: 'Cruz, Maria P.',      date: 'Jun 23, 2026', status: 'Pending'  as StatusKey, plan: 'Family Plan' },
  { id: 'MCPR-0046', name: 'Reyes, Ana C.',       date: 'Jun 22, 2026', status: 'Review'   as StatusKey, plan: 'Basic Plan' },
  { id: 'MCPR-0045', name: 'Lim, Kevin T.',       date: 'Jun 22, 2026', status: 'Approved' as StatusKey, plan: 'Premier Plan' },
  { id: 'MCPR-0044', name: 'Garcia, Lara S.',     date: 'Jun 21, 2026', status: 'Pending'  as StatusKey, plan: 'Basic Plan' },
  { id: 'MCPR-0043', name: 'Tan, Bernardo A.',    date: 'Jun 20, 2026', status: 'Rejected' as StatusKey, plan: 'Family Plan' },
  { id: 'MCPR-0042', name: 'Flores, Carmen L.',   date: 'Jun 19, 2026', status: 'Approved' as StatusKey, plan: 'Premier Plan' },
  { id: 'MCPR-0041', name: 'Rivera, Jose B.',     date: 'Jun 18, 2026', status: 'Review'   as StatusKey, plan: 'Basic Plan' },
  { id: 'MCPR-0040', name: 'Torres, Elena R.',    date: 'Jun 17, 2026', status: 'Approved' as StatusKey, plan: 'Family Plan' },
  { id: 'MCPR-0039', name: 'Villanueva, Mark D.', date: 'Jun 16, 2026', status: 'Pending'  as StatusKey, plan: 'Premier Plan' },
];

export default function MCPRScreen() {
  const scrollHandler = useScrollNav();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const c = C[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 16 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Page header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={[styles.pageTitle, { color: c.text }]}>Case Records</Text>
          <Text style={[styles.pageSub, { color: c.sub }]}>MCPR — {RECORDS.length} records</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: c.accent }]}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#fff" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search & filter bar */}
      <View style={styles.toolRow}>
        <View style={[styles.searchBar, { backgroundColor: c.card, borderColor: c.border }]}>
          <Search size={15} color={c.sub} strokeWidth={2} />
          <Text style={[styles.searchPlaceholder, { color: c.sub }]}>Search records…</Text>
        </View>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: c.card, borderColor: c.border }]}>
          <Filter size={16} color={c.accent} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Summary chips */}
      <View style={styles.chipRow}>
        {(['Approved', 'Pending', 'Review', 'Rejected'] as StatusKey[]).map((s) => {
          const count = RECORDS.filter((r) => r.status === s).length;
          return (
            <View key={s} style={[styles.chip, { backgroundColor: STATUS_BG[s] }]}>
              <Text style={[styles.chipText, { color: STATUS_COLOR[s] }]}>
                {s} · {count}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Record list */}
      <View style={[styles.listCard, { backgroundColor: c.card, borderColor: c.border }]}>
        {RECORDS.map((rec, i) => {
          const Icon = STATUS_ICON[rec.status];
          return (
            <TouchableOpacity
              key={rec.id}
              style={[
                styles.recordRow,
                i < RECORDS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: c.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.recordIconWrap, { backgroundColor: STATUS_BG[rec.status] }]}>
                <Icon size={16} color={STATUS_COLOR[rec.status]} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.recordName, { color: c.text }]}>{rec.name}</Text>
                <Text style={[styles.recordMeta, { color: c.sub }]}>
                  {rec.id} · {rec.plan}
                </Text>
              </View>
              <View style={styles.recordRight}>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[rec.status] }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[rec.status] }]}>
                    {rec.status}
                  </Text>
                </View>
                <Text style={[styles.recordDate, { color: c.sub }]}>{rec.date}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4, marginBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: '800' },
  pageSub:   { fontSize: 12, marginTop: 2 },
  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  toolRow:   { flexDirection: 'row', gap: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  searchPlaceholder: { fontSize: 13 },
  filterBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  chipRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  chipText:  { fontSize: 11, fontWeight: '600' },
  listCard:  { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  recordIconWrap: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  recordName: { fontSize: 13, fontWeight: '600' },
  recordMeta: { fontSize: 11, marginTop: 2 },
  recordRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText:  { fontSize: 10, fontWeight: '700' },
  recordDate:  { fontSize: 10 },
});
