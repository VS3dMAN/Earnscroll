import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, NativeModules } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Shield, Check, X, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/Theme';

const CONSENT_KEY = 'accessibility_consent_v1';

export default function AccessibilityDisclosureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ from?: string }>();
  const themeContext = useTheme();
  const theme = themeContext?.theme ?? {
    background: '#0B1220',
    card: '#111A2E',
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    border: '#1F2A44',
    primary: '#22D3EE',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    isDark: true,
  };

  const [acknowledged, setAcknowledged] = useState(false);

  const handleOpenSettings = async () => {
    if (!acknowledged) return;
    try {
      await AsyncStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ grantedAt: new Date().toISOString(), version: 1 }),
      );
    } catch {
      // Non-fatal — consent is also implicit in the user enabling the service.
    }
    if (Platform.OS === 'android') {
      const { EarnScrollModule } = NativeModules;
      try {
        EarnScrollModule?.openAccessibilitySettings?.();
      } catch {
        // Module not available (e.g. Expo Go) — no-op.
      }
    }
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const handleNotNow = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)' }]}
            onPress={handleNotNow}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>App Blocking Permission</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroIcon, { backgroundColor: 'rgba(34, 211, 238, 0.12)', borderColor: 'rgba(34, 211, 238, 0.3)' }]}>
            <Shield size={40} color={theme.primary} />
          </View>

          <Section
            theme={theme}
            title="What this does"
            body="EarnScroll uses Android's Accessibility API to block distracting apps you select when your earned-time bank is empty. Open a blocked app, see a block screen; work out, earn time, regain access."
          />

          <Section
            theme={theme}
            title="Why Accessibility access is needed"
            body="Android only exposes the name of the app currently in the foreground to apps that hold the BIND_ACCESSIBILITY_SERVICE permission. We use it solely to detect when a blocked app is opened."
          />

          <Card theme={theme} accent={theme.success} icon={<Eye size={18} color={theme.success} />} title="Data accessed">
            <Bullet theme={theme} text="The package name of the app currently in the foreground (read-only)." />
            <Bullet theme={theme} text="Processed entirely on-device. Never transmitted off the device." />
            <Bullet theme={theme} text="Not stored beyond the current session in memory." />
          </Card>

          <Card theme={theme} accent={theme.danger} icon={<EyeOff size={18} color={theme.danger} />} title="What is NOT accessed">
            <Bullet theme={theme} text="Screen contents, text on screen, or screenshots." />
            <Bullet theme={theme} text="Text you type, passwords, or form input." />
            <Bullet theme={theme} text="Other apps' private data, messages, or media." />
          </Card>

          <View style={[styles.infoBox, { backgroundColor: theme.isDark ? 'rgba(34, 211, 238, 0.08)' : 'rgba(34, 211, 238, 0.1)', borderColor: 'rgba(34, 211, 238, 0.25)' }]}>
            <Text style={[styles.infoBoxText, { color: theme.textSecondary }]}>
              You can revoke this permission at any time in Android Settings → Accessibility → EarnScroll.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAcknowledged((v) => !v)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                { borderColor: acknowledged ? theme.primary : theme.border, backgroundColor: acknowledged ? theme.primary : 'transparent' },
              ]}
            >
              {acknowledged && <Check size={16} color="#000" strokeWidth={3} />}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.text }]}>
              I understand what data this service accesses.
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: theme.background }]}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: theme.border }]}
            onPress={handleNotNow}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.textSecondary }]}>Not now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: acknowledged ? theme.primary : theme.border, opacity: acknowledged ? 1 : 0.6 },
            ]}
            onPress={handleOpenSettings}
            disabled={!acknowledged}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnText, { color: '#000' }]}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

function Section({ theme, title, body }: { theme: any; title: string; body: string }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>{body}</Text>
    </View>
  );
}

function Card({ theme, accent, icon, title, children }: { theme: any; accent: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: accent + '22' }]}>{icon}</View>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}

function Bullet({ theme, text }: { theme: any; text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: theme.textSecondary }]} />
      <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  infoBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
    marginBottom: 18,
  },
  infoBoxText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  secondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  primaryBtn: {
    flex: 1.4,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});
