import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/Theme';
import { typography } from '@/constants/typography';
import { LAST_UPDATED_DATE, LEGAL_CONTACT, WEB_LEGAL_HOSTED, WEB_LEGAL_URLS } from '@/constants/legal';

// Canonical text — kept in lockstep with legal/privacy-policy.html and
// legal/data-safety-form-guide.html. Update all three when this changes,
// and bump LAST_UPDATED_DATE in constants/legal.ts.

export default function PrivacyPolicyScreen() {
  const themeContext = useTheme();
  const theme = themeContext?.theme ?? {
    background: '#000000',
    card: '#0F172A',
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    border: '#334155',
    primary: '#22D3EE',
    isDark: true,
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Privacy Policy</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.lastUpdated, { color: theme.textSecondary }]}>Last Updated: {LAST_UPDATED_DATE}</Text>

          {!WEB_LEGAL_HOSTED && (
            <View style={[styles.banner, { backgroundColor: theme.primary + '14', borderColor: theme.primary + '55' }]}>
              <Text style={[styles.bannerText, { color: theme.textSecondary }]}>
                A web-hosted version of this Privacy Policy will be available at {WEB_LEGAL_URLS.privacy} before production release.
              </Text>
            </View>
          )}

          <H theme={theme}>1. Who We Are</H>
          <P theme={theme}>
            EarnScroll ("we", "our", "us") publishes the EarnScroll: Screen-Time Gym mobile application ("the App"). For any privacy questions you can reach us at{' '}
            <A theme={theme} email={LEGAL_CONTACT.privacy}>{LEGAL_CONTACT.privacy}</A>.
          </P>

          <H theme={theme}>2. Data We Collect</H>
          <P theme={theme}>
            We collect only what we need to make the App work and to keep it reliable.
          </P>
          <H3 theme={theme}>Account information</H3>
          <P theme={theme}>
            Email address, phone number (only if you sign in with phone), and OAuth subject identifiers from Google or Apple. We never see your Google or Apple password.
          </P>
          <H3 theme={theme}>App activity</H3>
          <P theme={theme}>
            Workout completions (exercise type, rep count, duration), screen views, button taps, and the time you spent in the App. Collected only with your analytics consent.
          </P>
          <H3 theme={theme}>Performance &amp; crash data</H3>
          <P theme={theme}>
            Anonymized crash stack traces, error events, and basic device info (model, OS version). Collected only with your diagnostics consent. Email and other personally identifying fields are stripped before transmission.
          </P>
          <H3 theme={theme}>Camera-derived data (on-device only)</H3>
          <P theme={theme}>
            When you start a workout, your camera frames are processed by an on-device machine-learning model (MoveNet, via TensorFlow Lite) to count reps. Frames are never uploaded, saved to disk, or shared.
          </P>
          <H3 theme={theme}>Accessibility-derived data (on-device only, Android)</H3>
          <P theme={theme}>
            When you enable the App Blocker, Android tells the App which app is currently in the foreground so we can show the block screen if your earned time is empty. This data is used in-memory only and never transmitted off your device.
          </P>
          <H3 theme={theme}>Device identifiers</H3>
          <P theme={theme}>
            A randomly generated session identifier and the app version string. We do not collect IMEI, advertising ID, or persistent hardware identifiers.
          </P>

          <H theme={theme}>3. How We Use Your Information</H>
          <P theme={theme}>
            To deliver the App's core features (track workouts, award earned minutes, block selected apps when your bank is empty); to keep the App secure and reliable (crash reports, error monitoring); to communicate operational changes; and to comply with applicable law.
          </P>

          <H theme={theme}>4. Legal Basis</H>
          <P theme={theme}>
            We process your data on the basis of (a) contract performance — to provide the App you signed up for; (b) consent — for optional analytics and diagnostics, withdrawable at any time in Settings; and (c) legitimate interest — to maintain security and integrity of the service. We follow the principles in India's Digital Personal Data Protection Act, 2023 (DPDP Act), and apply GDPR-equivalent safeguards globally.
          </P>

          <H theme={theme}>5. Third-Party Processors</H>
          <P theme={theme}>
            We use the following processors. Each receives only what is needed to perform its function, and is bound by its own privacy obligations:
          </P>
          <P theme={theme}>
            • <B>Supabase Inc.</B> — authentication, database, edge functions.{' '}
            <A theme={theme} url="https://supabase.com/privacy">supabase.com/privacy</A>
            {'\n'}• <B>Sentry (Functional Software, Inc.)</B> — crash and error monitoring, consent-gated only.{' '}
            <A theme={theme} url="https://sentry.io/privacy/">sentry.io/privacy</A>
            {'\n'}• <B>Google LLC</B> — Sign in with Google.{' '}
            <A theme={theme} url="https://policies.google.com/privacy">policies.google.com/privacy</A>
            {'\n'}• <B>Apple Inc.</B> — Sign in with Apple (iOS only).{' '}
            <A theme={theme} url="https://www.apple.com/legal/privacy/">apple.com/legal/privacy</A>
          </P>

          <H theme={theme}>6. On-Device Processing</H>
          <P theme={theme}>
            Two of the most sensitive data flows — camera frames during workouts, and foreground-app observation when the App Blocker is active — happen entirely on your device. These never leave the device, are never written to disk, and are never accessible to us or to any third party.
          </P>

          <H theme={theme}>7. Data Retention</H>
          <P theme={theme}>
            Live data is deleted immediately when you delete your account. Encrypted database backups are retained for up to 45 days and then irreversibly purged. A short non-PII deletion-audit row (your user id and the deletion timestamp) is retained for 30 days for compliance.
          </P>

          <H theme={theme}>8. Your Rights</H>
          <P theme={theme}>
            You can: (a) access your data — request a copy by email; (b) correct your data — change account fields in the App or by email; (c) delete your data — use Settings → Delete Account, which permanently deletes your account immediately; (d) port your data — request an export by email; (e) withdraw consent — toggle analytics or diagnostics off in Settings at any time.
          </P>

          <H theme={theme}>9. Children</H>
          <P theme={theme}>
            EarnScroll is intended for users 13 and older. We do not knowingly collect data from anyone under 13, and we do not show targeted advertising to minors.
          </P>

          <H theme={theme}>10. Security</H>
          <P theme={theme}>
            All data is encrypted in transit using TLS. Database data at rest is encrypted by Supabase (AES-256). On-device secure preferences (Android) are stored in EncryptedSharedPreferences (AES-256 GCM).
          </P>

          <H theme={theme}>11. International Transfers</H>
          <P theme={theme}>
            Supabase hosts our database in the region we configured when creating the project. If you are outside that region, your data is transferred internationally under standard contractual safeguards.
          </P>

          <H theme={theme}>12. Changes to This Policy</H>
          <P theme={theme}>
            We may update this Privacy Policy from time to time. The "Last Updated" date above always reflects the current version. For material changes we will surface an in-app notice on next launch.
          </P>

          <H theme={theme}>13. Contact</H>
          <P theme={theme}>
            Email <A theme={theme} email={LEGAL_CONTACT.privacy}>{LEGAL_CONTACT.privacy}</A> for any privacy questions, data-subject requests, or to exercise the rights described in section 8.
          </P>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.contactTitle, { color: theme.primary }]}>Privacy questions?</Text>
          <Text style={[styles.contactText, { color: theme.textSecondary }]}>Email: {LEGAL_CONTACT.privacy}</Text>
          <Text style={[styles.contactText, { color: theme.textSecondary }]}>Support: {LEGAL_CONTACT.support}</Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function H({ theme, children }: { theme: any; children: React.ReactNode }) {
  return <Text style={[styles.sectionTitle, { color: theme.primary }]}>{children}</Text>;
}

function H3({ theme, children }: { theme: any; children: React.ReactNode }) {
  return <Text style={[styles.subSectionTitle, { color: theme.text }]}>{children}</Text>;
}

function P({ theme, children }: { theme: any; children: React.ReactNode }) {
  return <Text style={[styles.paragraph, { color: theme.textSecondary }]}>{children}</Text>;
}

function B({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontFamily: typography.fontFamily.uiBold }}>{children}</Text>;
}

function A({ theme, children, email, url }: { theme: any; children: React.ReactNode; email?: string; url?: string }) {
  const onPress = () => {
    if (email) Linking.openURL(`mailto:${email}`).catch(() => {});
    else if (url) Linking.openURL(url).catch(() => {});
  };
  return (
    <Text style={{ color: theme.primary, textDecorationLine: 'underline' }} onPress={onPress}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: { marginRight: 16, padding: 4 },
  title: { fontSize: 24, fontFamily: typography.fontFamily.uiBold },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  lastUpdated: {
    fontSize: 14,
    fontFamily: typography.fontFamily.ui,
    marginBottom: 16,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  bannerText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.ui,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.uiBold,
    marginTop: 24,
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiBold,
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 15,
    fontFamily: typography.fontFamily.ui,
    lineHeight: 24,
    marginBottom: 12,
  },
  divider: { height: 1, marginVertical: 32 },
  contactTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.uiBold,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.ui,
    marginBottom: 6,
  },
});
