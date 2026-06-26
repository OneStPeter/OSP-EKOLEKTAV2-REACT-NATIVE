import {
  Calendar,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
} from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_NAV_HEIGHT } from '@/components/navigation/BottomNavBar';
import { useScrollNav } from '@/hooks/use-scroll-nav';

const C = {
  light: {
    bg: '#f0fdf4',
    text: '#111827',
    sub: '#6b7280',
    card: '#ffffff',
    border: '#e5e7eb',
    accent: '#059669',
    accentBg: '#ecfdf5',
    avatarBg: '#059669',
    badge: '#d1fae5',
    badgeText: '#065f46',
  },
  dark: {
    bg: '#030f0b',
    text: '#f3f4f6',
    sub: '#9ca3af',
    card: '#0d1f1a',
    border: '#1f2937',
    accent: '#34d399',
    accentBg: '#064e3b',
    avatarBg: '#065f46',
    badge: '#064e3b',
    badgeText: '#6ee7b7',
  },
};

const PLAN_DETAILS = [
  { label: 'Plan No.',      value: 'OSP-2024-00891' },
  { label: 'Plan Type',     value: 'Memorial Plan – Premium' },
  { label: 'Date Availed',  value: 'March 12, 2024' },
  { label: 'Maturity Date', value: 'March 12, 2029' },
  { label: 'Plan Amount',   value: '₱ 85,000.00' },
];

const PAYMENT_SUMMARY = [
  { label: 'Monthly Due', value: '₱ 1,520.00',  accent: false },
  { label: 'Total Paid',  value: '₱ 18,240.00', accent: false },
  { label: 'Balance',     value: '₱ 66,760.00', accent: true  },
];

const DOCUMENTS = [
  { label: 'Contract Agreement', date: 'Mar 12, 2024', icon: FileText  },
  { label: 'Official Receipt',   date: 'Jun 12, 2024', icon: CreditCard },
  { label: 'Beneficiary Form',   date: 'Mar 12, 2024', icon: Shield    },
];

export default function PlanholderProfileScreen() {
  const scrollHandler = useScrollNav();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const c = C[scheme === 'dark' ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const px = width >= 768 ? 24 : 16;

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 16, paddingHorizontal: px },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, { color: c.text }]}>Planholder Profile</Text>
        <Text style={[styles.pageSub, { color: c.sub }]}>Plan & account overview</Text>
      </View>

      {/* Profile card */}
      <View style={[styles.profileCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={[styles.avatar, { backgroundColor: c.avatarBg }]}>
          <User size={32} color="#fff" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.planholderName, { color: c.text }]}>Santos, Juan M.</Text>
          <View style={[styles.statusBadge, { backgroundColor: c.badge }]}>
            <Text style={[styles.statusText, { color: c.badgeText }]}>Active</Text>
          </View>
        </View>
      </View>

      {/* Contact info */}
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Contact Information</Text>
        {[
          { icon: Phone,  value: '+63 917 123 4567' },
          { icon: Mail,   value: 'jsantos@email.com' },
          { icon: MapPin, value: '123 Rizal St., Makati City' },
        ].map(({ icon: Icon, value }) => (
          <View key={value} style={styles.infoRow}>
            <Icon size={15} color={c.accent} strokeWidth={2} />
            <Text style={[styles.infoText, { color: c.sub }]}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Plan details */}
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Plan Details</Text>
        {PLAN_DETAILS.map(({ label, value }) => (
          <View key={label} style={[styles.detailRow, { borderBottomColor: c.border }]}>
            <Text style={[styles.detailLabel, { color: c.sub }]}>{label}</Text>
            <Text style={[styles.detailValue, { color: c.text }]}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Payment summary */}
      <View style={styles.paymentRow}>
        {PAYMENT_SUMMARY.map(({ label, value, accent }) => (
          <View
            key={label}
            style={[
              styles.paymentCard,
              { backgroundColor: accent ? c.accentBg : c.card, borderColor: accent ? c.accent : c.border },
            ]}
          >
            <Text style={[styles.paymentLabel, { color: accent ? c.accent : c.sub }]}>{label}</Text>
            <Text style={[styles.paymentValue, { color: accent ? c.accent : c.text }]}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Payment schedule shortcut */}
      <TouchableOpacity
        style={[styles.scheduleBtn, { backgroundColor: c.accent }]}
        activeOpacity={0.8}
      >
        <Calendar size={16} color="#fff" strokeWidth={2.5} />
        <Text style={styles.scheduleBtnText}>View Payment Schedule</Text>
      </TouchableOpacity>

      {/* Documents */}
      <Text style={[styles.sectionTitle, { color: c.text }]}>Documents</Text>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        {DOCUMENTS.map(({ label, date, icon: Icon }, i) => (
          <TouchableOpacity
            key={label}
            style={[
              styles.docRow,
              i < DOCUMENTS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
            ]}
            activeOpacity={0.7}
          >
            <View style={[styles.docIconWrap, { backgroundColor: c.accentBg }]}>
              <Icon size={16} color={c.accent} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.docLabel, { color: c.text }]}>{label}</Text>
              <Text style={[styles.docDate, { color: c.sub }]}>{date}</Text>
            </View>
            <Text style={[styles.docAction, { color: c.accent }]}>View</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  content:         { padding: 16, gap: 12 },
  pageHeader:      { marginTop: 4, marginBottom: 4 },
  pageTitle:       { fontSize: 22, fontWeight: '800' },
  pageSub:         { fontSize: 12, marginTop: 2 },
  profileCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  avatar:          { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  planholderName:  { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  statusBadge:     { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText:      { fontSize: 11, fontWeight: '700' },
  card:            { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 10 },
  sectionTitle:    { fontSize: 14, fontWeight: '700' },
  infoRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText:        { fontSize: 13 },
  detailRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  detailLabel:     { fontSize: 12 },
  detailValue:     { fontSize: 12, fontWeight: '600' },
  paymentRow:      { flexDirection: 'row', gap: 8 },
  paymentCard:     { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, gap: 4, alignItems: 'center' },
  paymentLabel:    { fontSize: 10, fontWeight: '600' },
  paymentValue:    { fontSize: 13, fontWeight: '800' },
  scheduleBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12 },
  scheduleBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  docRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  docIconWrap:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  docLabel:        { fontSize: 13, fontWeight: '600' },
  docDate:         { fontSize: 11, marginTop: 2 },
  docAction:       { fontSize: 12, fontWeight: '700' },
});
