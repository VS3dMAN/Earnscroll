import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/Theme';
import { typography } from '@/constants/typography';
import { LAST_UPDATED_DATE, LEGAL_CONTACT, WEB_LEGAL_HOSTED, WEB_LEGAL_URLS } from '@/constants/legal';

export default function TermsOfServiceScreen() {
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
          <Text style={[styles.title, { color: theme.text }]}>Terms of Service</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.lastUpdated, { color: theme.textSecondary }]}>Last Updated: {LAST_UPDATED_DATE}</Text>

          {!WEB_LEGAL_HOSTED && (
            <View style={[styles.banner, { backgroundColor: theme.primary + '14', borderColor: theme.primary + '55' }]}>
              <Text style={[styles.bannerText, { color: theme.textSecondary }]}>
                A web-hosted version of these Terms will be available at {WEB_LEGAL_URLS.terms} before production release.
              </Text>
            </View>
          )}

          <H theme={theme}>1. Acceptance &amp; Eligibility</H>
          <P theme={theme}>
            By creating an account or using EarnScroll, you agree to these Terms. You must be at least 13 years old to use the App. If you are under the age of majority in your jurisdiction, you confirm you have a parent or guardian's consent.
          </P>

          <H theme={theme}>2. License</H>
          <P theme={theme}>
            We grant you a personal, non-exclusive, non-transferable, revocable license to use the App on devices you own or control. You may not sublicense, resell, or distribute the App.
          </P>

          <H theme={theme}>3. Account Responsibilities</H>
          <P theme={theme}>
            You are responsible for keeping your account credentials secure and for activity that occurs under your account. Notify us at {LEGAL_CONTACT.support} if you suspect unauthorized access.
          </P>

          <H theme={theme}>4. Acceptable Use</H>
          <P theme={theme}>
            You agree NOT to:
          </P>
          <P theme={theme}>
            • Reverse engineer, decompile, or attempt to extract source code or model weights from the App, including the on-device pose-estimation model.{'\n'}
            • Use the App Blocker to circumvent parental controls, workplace device-management policies, or any other security control.{'\n'}
            • Use automation, scripts, or any non-physical input to fake exercise reps and earn time without performing the workout.{'\n'}
            • Use the App for any unlawful purpose or to harass, harm, or impersonate any person.
          </P>

          <H theme={theme}>5. Free Tier &amp; Future Pro Tier</H>
          <P theme={theme}>
            Version 1.0 of the App is offered free of charge with no in-app purchases. Future versions may introduce an optional "Pro" tier processed exclusively through Google Play Billing; pricing and terms specific to that tier will be presented in-app before any purchase.
          </P>

          <H theme={theme}>6. Health &amp; Fitness Disclaimer</H>
          <P theme={theme}>
            EarnScroll is a fitness and screen-time tool. It is NOT medical advice and does NOT diagnose, treat, or prevent any condition. Consult a physician before starting any new exercise program, especially if you have a medical condition. You exercise at your own risk.
          </P>

          <H theme={theme}>7. Limitation of Liability</H>
          <P theme={theme}>
            To the maximum extent permitted by law, EarnScroll and its operators are not liable for any indirect, incidental, consequential, or punitive damages, or for any loss of data, profits, or goodwill, arising out of or in connection with your use of the App. Our aggregate liability for any direct damages will not exceed INR 1,000.
          </P>

          <H theme={theme}>8. Termination</H>
          <P theme={theme}>
            You may terminate your account at any time via Settings → Delete Account. We may suspend or terminate your access if you violate these Terms or applicable law. On termination, your data is deleted as described in our Privacy Policy.
          </P>

          <H theme={theme}>9. Governing Law</H>
          <P theme={theme}>
            These Terms are governed by the laws of India, including the Indian Contract Act, 1872, and the Information Technology Act, 2000. Disputes will be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.
          </P>

          <H theme={theme}>10. Changes to These Terms</H>
          <P theme={theme}>
            We may update these Terms from time to time. The "Last Updated" date above always reflects the current version. For material changes we will surface an in-app notice on next launch. Continued use of the App after a change constitutes acceptance.
          </P>

          <H theme={theme}>11. Contact</H>
          <P theme={theme}>
            For any questions about these Terms, email <A theme={theme} email={LEGAL_CONTACT.legal}>{LEGAL_CONTACT.legal}</A>.
          </P>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.contactTitle, { color: theme.primary }]}>Questions about our Terms?</Text>
          <Text style={[styles.contactText, { color: theme.textSecondary }]}>Email: {LEGAL_CONTACT.legal}</Text>
          <Text style={[styles.contactText, { color: theme.textSecondary }]}>Support: {LEGAL_CONTACT.support}</Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function H({ theme, children }: { theme: any; children: React.ReactNode }) {
  return <Text style={[styles.sectionTitle, { color: theme.primary }]}>{children}</Text>;
}

function P({ theme, children }: { theme: any; children: React.ReactNode }) {
  return <Text style={[styles.paragraph, { color: theme.textSecondary }]}>{children}</Text>;
}

function A({ theme, children, email }: { theme: any; children: React.ReactNode; email?: string; url?: string }) {
  const onPress = () => {
    if (email) Linking.openURL(`mailto:${email}`).catch(() => {});
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
