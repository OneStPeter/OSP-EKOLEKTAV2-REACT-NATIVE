import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  XCircle,
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
  light: { bg: '#f0fdf4', text: '#111827', sub: '#6b7280', card: '#ffffff', border: '#e5e7eb', accent: '#059669', dark: '#022c22' },
  dark:  { bg: '#030f0b', text: '#f3f4f6', sub: '#9ca3af', card: '#0d1f1a', border: '#1f2937', accent: '#34d399', dark: '#6ee7b7' },
};

const TRANSACTIONS = [
  { id: 'TXN-9841', name: 'Santos, Juan M.',    amount: '₱4,200', date: 'Jun 24',  type: 'Received', status: 'Cleared'  },
  { id: 'TXN-9840', name: 'Cruz, Maria P.',      amount: '₱2,800', date: 'Jun 23',  type: 'Received', status: 'Pending'  },
  { id: 'TXN-9839', name: 'Reyes, Ana C.',       amount: '₱1,500', date: 'Jun 22',  type: 'Refund',   status: 'Cleared'  },
  { id: 'TXN-9838', name: 'Lim, Kevin T.',       amount: '₱6,000', date: 'Jun 22',  type: 'Received', status: 'Cleared'  },
  { id: 'TXN-9837', name: 'Garcia, Lara S.',     amount: '₱3,100', date: 'Jun 21',  type: 'Received', status: 'Failed'   },
  { id: 'TXN-9836', name: 'Tan, Bernardo A.',    amount: '₱5,500', date: 'Jun 20',  type: 'Received', status: 'Pending'  },
  { id: 'TXN-9835', name: 'Flores, Carmen L.',   amount: '₱2,200', date: 'Jun 19',  type: 'Received', status: 'Cleared'  },
  { id: 'TXN-9834', name: 'Rivera, Jose B.',     amount: '₱4,800', date: 'Jun 18',  type: 'Refund',   status: 'Cleared'  },
  { id: 'TXN-9833', name: 'Torres, Elena R.',    amount: '₱3,600', date: 'Jun 17',  type: 'Received', status: 'Cleared'  },
  { id: 'TXN-9832', name: 'Villanueva, Mark D.', amount: '₱7,200', date: 'Jun 16',  type: 'Received', status: 'Pending'  },
];

const STATUS_C = { Cleared: '#059669', Pending: '#d97706', Failed: '#dc2626' };
const STATUS_BG = { Cleared: '#ecfdf5', Pending: '#fffbeb', Failed: '#fef2f2' };
const STATUS_ICON = { Cleared: CheckCircle, Pending: Clock, Failed: XCircle };
type ST = 'Cleared' | 'Pending' | 'Failed';

export default function PaymentScreen() {
  const scrollHandler = useScrollNav();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const c = C[scheme === 'dark' ? 'dark' : 'light'];
  const { width } = useWindowDimensions();

  const cleared = TRANSACTIONS.filter(t => t.status === 'Cleared').length;
  const pending = TRANSACTIONS.filter(t => t.status === 'Pending').length;

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 16, paddingHorizontal: width >= 768 ? 24 : 16 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Page header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={[styles.pageTitle, { color: c.text }]}>Payments</Text>
          <Text style={[styles.pageSub, { color: c.sub }]}>Billing & transactions</Text>
        </View>
        <TouchableOpacity style={[styles.exportBtn, { borderColor: c.accent }]}>
          <Download size={15} color={c.accent} strokeWidth={2} />
          <Text style={[styles.exportText, { color: c.accent }]}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Balance card */}
      <View style={[styles.balanceCard, { backgroundColor: c.dark }]}>
        <CreditCard size={22} color="#6ee7b7" strokeWidth={1.8} />
        <Text style={styles.balanceLabel}>Total Collected — June 2026</Text>
        <Text style={styles.balanceValue}>₱41,900</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceStat}>
            <ArrowDownLeft size={13} color="#6ee7b7" strokeWidth={2.5} />
            <Text style={styles.balanceStatText}>{cleared} cleared</Text>
          </View>
          <View style={styles.balanceStat}>
            <ArrowUpRight size={13} color="#fcd34d" strokeWidth={2.5} />
            <Text style={[styles.balanceStatText, { color: '#fcd34d' }]}>{pending} pending</Text>
          </View>
        </View>
      </View>

      {/* Transaction list */}
      <Text style={[styles.sectionTitle, { color: c.text }]}>Transactions</Text>
      <View style={[styles.listCard, { backgroundColor: c.card, borderColor: c.border }]}>
        {TRANSACTIONS.map((txn, i) => {
          const s = txn.status as ST;
          const Icon = STATUS_ICON[s];
          const isRefund = txn.type === 'Refund';
          return (
            <TouchableOpacity
              key={txn.id}
              style={[
                styles.txnRow,
                i < TRANSACTIONS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: c.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.txnIconWrap, { backgroundColor: STATUS_BG[s] }]}>
                <Icon size={16} color={STATUS_C[s]} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.txnName, { color: c.text }]}>{txn.name}</Text>
                <Text style={[styles.txnId, { color: c.sub }]}>{txn.id} · {txn.date}</Text>
              </View>
              <View style={styles.txnRight}>
                <Text style={[styles.txnAmount, { color: isRefund ? '#dc2626' : c.text }]}>
                  {isRefund ? '−' : '+'}{txn.amount}
                </Text>
                <View style={[styles.txnBadge, { backgroundColor: STATUS_BG[s] }]}>
                  <Text style={[styles.txnBadgeText, { color: STATUS_C[s] }]}>{txn.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  content:      { padding: 16, gap: 12 },
  pageHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4, marginBottom: 4 },
  pageTitle:    { fontSize: 22, fontWeight: '800' },
  pageSub:      { fontSize: 12, marginTop: 2 },
  exportBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  exportText:   { fontSize: 12, fontWeight: '600' },
  balanceCard:  { borderRadius: 18, padding: 20, gap: 6 },
  balanceLabel: { fontSize: 11, color: '#6ee7b7', fontWeight: '600', letterSpacing: 0.5, marginTop: 4 },
  balanceValue: { fontSize: 34, fontWeight: '800', color: '#ffffff', letterSpacing: -1 },
  balanceRow:   { flexDirection: 'row', gap: 16, marginTop: 4 },
  balanceStat:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  balanceStatText: { fontSize: 12, color: '#6ee7b7', fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  listCard:     { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  txnRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  txnIconWrap:  { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  txnName:      { fontSize: 13, fontWeight: '600' },
  txnId:        { fontSize: 11, marginTop: 2 },
  txnRight:     { alignItems: 'flex-end', gap: 4 },
  txnAmount:    { fontSize: 14, fontWeight: '700' },
  txnBadge:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  txnBadgeText: { fontSize: 10, fontWeight: '700' },
});
