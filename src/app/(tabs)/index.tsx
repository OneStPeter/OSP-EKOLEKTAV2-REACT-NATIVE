import {
  Bell,
  FileText,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
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

const STATS = [
  { label: 'Active Plans', value: '1,284', icon: Users,      color: '#059669', bg: '#ecfdf5' },
  { label: 'This Month',   value: '₱2.4M', icon: TrendingUp, color: '#2563eb', bg: '#eff6ff' },
  { label: 'Renewals',     value: '38',    icon: Calendar,   color: '#d97706', bg: '#fffbeb' },
  { label: 'Pending',      value: '12',    icon: Bell,       color: '#dc2626', bg: '#fef2f2' },
];

const ACTIVITIES = [
  { icon: CheckCircle, label: 'Plan #OSP-3821 approved',        time: '5 min ago',  color: '#059669' },
  { icon: FileText,    label: 'New MCPR submitted – Santos, J.', time: '18 min ago', color: '#2563eb' },
  { icon: Clock,       label: 'Payment due – Cruz, M. (₱4,200)',time: '1 hr ago',   color: '#d97706' },
  { icon: AlertCircle, label: 'Document missing – Reyes, A.',   time: '2 hrs ago',  color: '#dc2626' },
  { icon: CheckCircle, label: 'Plan #OSP-3819 renewed',         time: '3 hrs ago',  color: '#059669' },
  { icon: FileText,    label: 'New application – Garcia, L.',    time: '4 hrs ago',  color: '#2563eb' },
  { icon: CheckCircle, label: 'Payment confirmed – Lim, K.',    time: '5 hrs ago',  color: '#059669' },
  { icon: Clock,       label: 'Upcoming renewal – Tan, B.',     time: 'Tomorrow',   color: '#d97706' },
];

function StatCard({ label, value, icon: Icon, color, bg, c }: typeof STATS[0] & { c: typeof C['light'] }) {
  return (
    <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Icon size={18} color={color} strokeWidth={2} />
      </View>
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.sub }]}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
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
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={[styles.greeting, { color: c.text }]}>Good morning 👋</Text>
          <Text style={[styles.greetingSub, { color: c.sub }]}>Here's what's happening today.</Text>
        </View>
        <View style={[styles.avatarBadge, { backgroundColor: c.dark }]}>
          <Text style={styles.avatarText}>JR</Text>
        </View>
      </View>

      {/* Stats grid */}
      <Text style={[styles.sectionTitle, { color: c.text }]}>Overview</Text>
      <View style={styles.statsGrid}>
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} c={c} />
        ))}
      </View>

      {/* Recent activity */}
      <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Activity</Text>
      <View style={[styles.activityCard, { backgroundColor: c.card, borderColor: c.border }]}>
        {ACTIVITIES.map((a, i) => (
          <View key={i} style={[styles.activityRow, i < ACTIVITIES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
            <View style={[styles.activityIconWrap, { backgroundColor: a.color + '18' }]}>
              <a.icon size={15} color={a.color} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.activityLabel, { color: c.text }]}>{a.label}</Text>
              <Text style={[styles.activityTime, { color: c.sub }]}>{a.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 8,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
  },
  greetingSub: {
    fontSize: 13,
    marginTop: 2,
  },
  avatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '47%',
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  activityCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  activityIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 11,
    marginTop: 1,
  },
});
