import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator, Platform, NativeModules } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Trash2, AlertTriangle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/Theme';
import { useAuth } from '@/contexts/Auth';
import { supabase } from '@/utils/supabase';

const CONFIRM_TEXT = 'DELETE';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const { session, signOut } = useAuth();
  const [confirmInput, setConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isConfirmed = confirmInput.trim().toUpperCase() === CONFIRM_TEXT;

  const handleDelete = async () => {
    if (!isConfirmed || deleting) return;
    const token = session?.access_token;
    if (!token) {
      Alert.alert('Not signed in', 'You must be signed in to delete your account.');
      return;
    }

    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { reason: 'user_initiated' },
      });

      if (error || !data?.ok) {
        const msg =
          (data && typeof data.error === 'string' && data.error) ||
          (error && error.message) ||
          'Deletion failed. Please try again or contact support.';
        Alert.alert('Could not delete account', msg);
        setDeleting(false);
        return;
      }

      // Wipe local state: AsyncStorage + encrypted prefs (Android) + sign out.
      try {
        await AsyncStorage.clear();
      } catch { /* best-effort */ }

      if (Platform.OS === 'android') {
        try {
          const { EarnScrollModule } = NativeModules;
          await EarnScrollModule?.clearSecurePrefs?.();
        } catch { /* native bridge optional */ }
      }

      await signOut();
      router.replace('/onboarding');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Deletion failed.';
      Alert.alert('Could not delete account', msg);
      setDeleting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)' }]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            activeOpacity={0.7}
            disabled={deleting}
          >
            <ChevronLeft size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Delete Account</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}>
          <View style={[styles.warningCard, { backgroundColor: theme.danger + '14', borderColor: theme.danger + '55' }]}>
            <AlertTriangle size={28} color={theme.danger} />
            <Text style={[styles.warningTitle, { color: theme.danger }]}>This cannot be undone.</Text>
            <Text style={[styles.warningBody, { color: theme.textSecondary }]}>
              Your account and all the data below will be permanently deleted immediately.
            </Text>
          </View>

          <Section theme={theme} title="What will be deleted">
            <Bullet theme={theme} text="Your Supabase account (email, phone, OAuth identities)" />
            <Bullet theme={theme} text="All analytics events linked to your account" />
            <Bullet theme={theme} text="Your analytics consent record" />
            <Bullet theme={theme} text="Session history and diagnostic logs" />
            <Bullet theme={theme} text="All on-device data: time bank, streak, settings, encrypted prefs" />
          </Section>

          <Section theme={theme} title="What we retain">
            <Bullet theme={theme} text="A short audit row (your user id + deletion timestamp) for 30 days, as required for compliance audits. It contains no PII." />
            <Bullet theme={theme} text="Encrypted backups for up to 45 days, then irreversibly purged." />
          </Section>

          <Text style={[styles.confirmLabel, { color: theme.text }]}>
            Type <Text style={{ color: theme.danger, fontFamily: 'Inter_700Bold' }}>{CONFIRM_TEXT}</Text> to confirm:
          </Text>
          <TextInput
            value={confirmInput}
            onChangeText={setConfirmInput}
            placeholder={CONFIRM_TEXT}
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!deleting}
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: isConfirmed ? theme.danger : theme.border,
                backgroundColor: theme.card,
              },
            ]}
            testID="delete-account-confirm-input"
          />

          <TouchableOpacity
            style={[
              styles.deleteBtn,
              {
                backgroundColor: isConfirmed ? theme.danger : theme.border,
                opacity: isConfirmed && !deleting ? 1 : 0.6,
              },
            ]}
            onPress={handleDelete}
            disabled={!isConfirmed || deleting}
            activeOpacity={0.85}
            testID="delete-account-confirm-button"
          >
            {deleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Trash2 size={18} color="#fff" />
                <Text style={styles.deleteBtnText}>Delete account permanently</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.footerNote, { color: theme.textSecondary }]}>
            Need help? Email privacy@earnscroll.com — we will action deletions within 30 days for requests made by email.
          </Text>
        </ScrollView>
      </View>
    </>
  );
}

function Section({ theme, title, children }: { theme: any; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
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
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  warningCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginTop: 8,
    marginBottom: 4,
  },
  warningBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 10,
  },
  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bulletDot: { width: 4, height: 4, borderRadius: 2, marginTop: 8 },
  bulletText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  confirmLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 20,
  },
  deleteBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  footerNote: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
});
