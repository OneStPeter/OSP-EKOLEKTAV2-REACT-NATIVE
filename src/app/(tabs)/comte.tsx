import {
  Mail,
  MessageSquare,
  Mic,
  Phone,
  Send,
  Video,
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
  light: { bg: '#f0fdf4', text: '#111827', sub: '#6b7280', card: '#ffffff', border: '#e5e7eb', accent: '#059669', dark: '#022c22', bubble: '#ecfdf5', bubbleSent: '#022c22' },
  dark:  { bg: '#030f0b', text: '#f3f4f6', sub: '#9ca3af', card: '#0d1f1a', border: '#1f2937', accent: '#34d399', dark: '#6ee7b7', bubble: '#0d2a1f', bubbleSent: '#064e3b' },
};

const CHANNELS = [
  { label: 'Messages',   icon: MessageSquare, count: 8,  color: '#059669' },
  { label: 'Calls',      icon: Phone,         count: 2,  color: '#2563eb' },
  { label: 'Video',      icon: Video,         count: 1,  color: '#7c3aed' },
  { label: 'Email',      icon: Mail,          count: 14, color: '#d97706' },
];

const THREADS = [
  { name: 'Santos, Juan M.',    preview: 'Please send the updated plan docs.',     time: '9:41 AM',  unread: 3,  avatar: 'SJ' },
  { name: 'Cruz, Maria P.',     preview: 'Thank you for the payment confirmation.', time: '8:22 AM',  unread: 0,  avatar: 'CM' },
  { name: 'Reyes, Ana C.',      preview: 'When can I pick up the certificate?',    time: 'Yesterday',unread: 1,  avatar: 'RA' },
  { name: 'Lim, Kevin T.',      preview: 'Got it, will process by Friday.',        time: 'Yesterday',unread: 0,  avatar: 'LK' },
  { name: 'Garcia, Lara S.',    preview: 'Can I change my payment schedule?',      time: 'Jun 22',   unread: 2,  avatar: 'GL' },
  { name: 'Tan, Bernardo A.',   preview: 'Documents received, thank you!',         time: 'Jun 21',   unread: 0,  avatar: 'TB' },
  { name: 'Flores, Carmen L.',  preview: 'Is the office open on Saturday?',        time: 'Jun 20',   unread: 1,  avatar: 'FC' },
  { name: 'Rivera, Jose B.',    preview: 'Attached the missing documents.',        time: 'Jun 18',   unread: 0,  avatar: 'RJ' },
];

const AVATAR_COLORS = ['#059669', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#0284c7', '#9333ea', '#16a34a'];

export default function ComTeScreen() {
  const scrollHandler = useScrollNav();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const c = C[scheme === 'dark' ? 'dark' : 'light'];
  const { width } = useWindowDimensions();

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
          <Text style={[styles.pageTitle, { color: c.text }]}>ComTe</Text>
          <Text style={[styles.pageSub, { color: c.sub }]}>Communication center</Text>
        </View>
        <TouchableOpacity style={[styles.composeBtn, { backgroundColor: c.accent }]}>
          <Send size={15} color="#fff" strokeWidth={2.5} />
          <Text style={styles.composeBtnText}>Compose</Text>
        </TouchableOpacity>
      </View>

      {/* Channel quick-access */}
      <View style={styles.channelRow}>
        {CHANNELS.map((ch) => (
          <TouchableOpacity
            key={ch.label}
            style={[styles.channelCard, { backgroundColor: c.card, borderColor: c.border }]}
            activeOpacity={0.75}
          >
            <View style={[styles.channelIcon, { backgroundColor: ch.color + '18' }]}>
              <ch.icon size={18} color={ch.color} strokeWidth={2} />
            </View>
            {ch.count > 0 && (
              <View style={[styles.channelBadge, { backgroundColor: ch.color }]}>
                <Text style={styles.channelBadgeText}>{ch.count}</Text>
              </View>
            )}
            <Text style={[styles.channelLabel, { color: c.sub }]}>{ch.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Message threads */}
      <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Messages</Text>
      <View style={[styles.listCard, { backgroundColor: c.card, borderColor: c.border }]}>
        {THREADS.map((thread, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.threadRow,
              i < THREADS.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: c.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
              <Text style={styles.avatarText}>{thread.avatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.threadName, { color: c.text }, thread.unread > 0 && { fontWeight: '700' }]}>
                {thread.name}
              </Text>
              <Text style={[styles.threadPreview, { color: c.sub }]} numberOfLines={1}>
                {thread.preview}
              </Text>
            </View>
            <View style={styles.threadMeta}>
              <Text style={[styles.threadTime, { color: c.sub }]}>{thread.time}</Text>
              {thread.unread > 0 && (
                <View style={[styles.unreadDot, { backgroundColor: c.accent }]}>
                  <Text style={styles.unreadCount}>{thread.unread}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick actions */}
      <Text style={[styles.sectionTitle, { color: c.text }]}>Quick Actions</Text>
      <View style={styles.quickRow}>
        {[
          { icon: Phone, label: 'Call', color: '#2563eb', bg: '#eff6ff' },
          { icon: Video, label: 'Video',color: '#7c3aed', bg: '#f5f3ff' },
          { icon: Mic,   label: 'Voice', color: '#059669', bg: '#ecfdf5' },
          { icon: Mail,  label: 'Email', color: '#d97706', bg: '#fffbeb' },
        ].map((qa) => (
          <TouchableOpacity
            key={qa.label}
            style={[styles.quickCard, { backgroundColor: c.card, borderColor: c.border }]}
            activeOpacity={0.75}
          >
            <View style={[styles.quickIcon, { backgroundColor: qa.bg }]}>
              <qa.icon size={20} color={qa.color} strokeWidth={2} />
            </View>
            <Text style={[styles.quickLabel, { color: c.text }]}>{qa.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  content:        { padding: 16, gap: 12 },
  pageHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4, marginBottom: 4 },
  pageTitle:      { fontSize: 22, fontWeight: '800' },
  pageSub:        { fontSize: 12, marginTop: 2 },
  composeBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  composeBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  channelRow:     { flexDirection: 'row', gap: 8 },
  channelCard:    { flex: 1, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 12, alignItems: 'center', gap: 4, position: 'relative' },
  channelIcon:    { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  channelBadge:   { position: 'absolute', top: 8, right: 8, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  channelBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  channelLabel:   { fontSize: 10, fontWeight: '600' },
  sectionTitle:   { fontSize: 15, fontWeight: '700', marginTop: 4 },
  listCard:       { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  threadRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  avatar:         { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { color: '#fff', fontWeight: '700', fontSize: 13 },
  threadName:     { fontSize: 13, fontWeight: '600' },
  threadPreview:  { fontSize: 12, marginTop: 2 },
  threadMeta:     { alignItems: 'flex-end', gap: 4 },
  threadTime:     { fontSize: 11 },
  unreadDot:      { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  unreadCount:    { fontSize: 10, fontWeight: '800', color: '#fff' },
  quickRow:       { flexDirection: 'row', gap: 10 },
  quickCard:      { flex: 1, alignItems: 'center', borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 8 },
  quickIcon:      { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel:     { fontSize: 12, fontWeight: '600' },
});
