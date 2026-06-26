import {
  Bell,
  ChevronRight,
  CircleHelp,
  FileText,
  Lock,
  LogOut,
  Moon,
  Settings,
  Shield,
  User,
} from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { BOTTOM_NAV_HEIGHT } from '@/components/navigation/BottomNavBar';
import { useScrollNav } from '@/hooks/use-scroll-nav';

const C = {
  light: { bg: '#f0fdf4', text: '#111827', sub: '#6b7280', card: '#ffffff', border: '#e5e7eb', accent: '#059669', dark: '#022c22', danger: '#dc2626' },
  dark:  { bg: '#030f0b', text: '#f3f4f6', sub: '#9ca3af', card: '#0d1f1a', border: '#1f2937', accent: '#34d399', dark: '#6ee7b7', danger: '#f87171' },
};

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: User,     label: 'Personal Info',    desc: 'Name, email, phone',  color: '#059669' },
      { icon: Lock,     label: 'Security',          desc: 'Password, PIN',       color: '#2563eb' },
      { icon: Bell,     label: 'Notifications',     desc: 'Alerts & reminders',  color: '#d97706' },
    ],
  },
  {
    title: 'System',
    items: [
      { icon: Settings,  label: 'Preferences',     desc: 'Display, language',   color: '#6b7280' },
      { icon: Moon,      label: 'Appearance',       desc: 'Light / Dark mode',   color: '#7c3aed' },
      { icon: Shield,    label: 'Privacy',          desc: 'Data & permissions',  color: '#0284c7' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: FileText,  label: 'Terms & Policy',  desc: 'Legal documents',     color: '#6b7280' },
      { icon: CircleHelp,label: 'Help Center',     desc: 'FAQs & contact',      color: '#059669' },
    ],
  },
];

export default function ProfileScreen() {
  const scrollHandler = useScrollNav();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const router = useRouter();
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
      {/* Profile card */}
      <View style={[styles.profileCard, { backgroundColor: c.dark }]}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JR</Text>
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Jerome Jardio</Text>
          <Text style={styles.profileRole}>Life Plan Operations Agent</Text>
          <Text style={styles.profileEmail}>markci@stpeter.com.ph</Text>
        </View>
        <View style={styles.profileBadgeRow}>
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>Agent · ID: SP-2840</Text>
          </View>
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>Branch: Makati</Text>
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { value: '248', label: 'Plans Handled' },
          { value: '4.9★', label: 'Rating' },
          { value: '36mo', label: 'Tenure' },
        ].map((s) => (
          <View key={s.label} style={[styles.miniStat, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.miniStatValue, { color: c.text }]}>{s.value}</Text>
            <Text style={[styles.miniStatLabel, { color: c.sub }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu sections */}
      {MENU_SECTIONS.map((section) => (
        <View key={section.title}>
          <Text style={[styles.sectionTitle, { color: c.sub }]}>{section.title.toUpperCase()}</Text>
          <View style={[styles.menuCard, { backgroundColor: c.card, borderColor: c.border }]}>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuRow,
                  i < section.items.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: c.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBg, { backgroundColor: item.color + '18' }]}>
                  <item.icon size={17} color={item.color} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuLabel, { color: c.text }]}>{item.label}</Text>
                  <Text style={[styles.menuDesc, { color: c.sub }]}>{item.desc}</Text>
                </View>
                <ChevronRight size={15} color={c.sub} strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Dark mode toggle */}
      <View style={[styles.menuCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.menuRow}>
          <View style={[styles.menuIconBg, { backgroundColor: '#7c3aed18' }]}>
            <Moon size={17} color="#7c3aed" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: c.text }]}>Dark Mode</Text>
            <Text style={[styles.menuDesc, { color: c.sub }]}>System / On / Off</Text>
          </View>
          <Switch
            value={scheme === 'dark'}
            trackColor={{ false: '#e5e7eb', true: '#059669' }}
            thumbColor="#ffffff"
            disabled
          />
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity
        style={[styles.signOutBtn, { borderColor: c.danger + '40' }]}
        onPress={() => router.replace('/(auth)/login' as never)}
        activeOpacity={0.8}
      >
        <LogOut size={18} color={c.danger} strokeWidth={2} />
        <Text style={[styles.signOutText, { color: c.danger }]}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={[styles.versionText, { color: c.sub }]}>
        One St. Peter LPOS · v2.0.0 · Expo SDK 55
      </Text>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  content:          { padding: 16, gap: 12 },
  profileCard:      { borderRadius: 20, padding: 20, alignItems: 'center', gap: 10, marginTop: 4 },
  avatarRing:       { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: 'rgba(110,231,183,0.5)', alignItems: 'center', justifyContent: 'center' },
  avatar:           { width: 64, height: 64, borderRadius: 32, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  avatarText:       { color: '#ffffff', fontWeight: '800', fontSize: 22 },
  profileInfo:      { alignItems: 'center', gap: 3 },
  profileName:      { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  profileRole:      { fontSize: 12, color: '#6ee7b7', fontWeight: '500' },
  profileEmail:     { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  profileBadgeRow:  { flexDirection: 'row', gap: 8, marginTop: 2 },
  profileBadge:     { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  profileBadgeText: { fontSize: 10, color: '#6ee7b7', fontWeight: '600' },
  statsRow:         { flexDirection: 'row', gap: 10 },
  miniStat:         { flex: 1, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 12, alignItems: 'center', gap: 3 },
  miniStatValue:    { fontSize: 18, fontWeight: '800' },
  miniStatLabel:    { fontSize: 10, fontWeight: '500' },
  sectionTitle:     { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, paddingHorizontal: 2, marginBottom: 4, marginTop: 4 },
  menuCard:         { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  menuRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  menuIconBg:       { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  menuLabel:        { fontSize: 14, fontWeight: '500' },
  menuDesc:         { fontSize: 11, marginTop: 1 },
  signOutBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, marginTop: 4 },
  signOutText:      { fontSize: 15, fontWeight: '700' },
  versionText:      { fontSize: 11, textAlign: 'center', marginTop: 4 },
});
