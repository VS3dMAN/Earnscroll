import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { typography } from '@/constants/typography';

export default function TermsOfServiceScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Terms of Service</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>

          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Text>

          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </Text>

          <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
          <Text style={styles.paragraph}>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </Text>

          <Text style={styles.sectionTitle}>4. Subscription and Payment</Text>
          <Text style={styles.paragraph}>
            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
          </Text>

          <Text style={styles.sectionTitle}>5. Refund Policy</Text>
          <Text style={styles.paragraph}>
            Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
          </Text>

          <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.
          </Text>

          <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.
          </Text>

          <Text style={styles.sectionTitle}>8. Termination</Text>
          <Text style={styles.paragraph}>
            At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.
          </Text>

          <Text style={styles.sectionTitle}>9. Governing Law</Text>
          <Text style={styles.paragraph}>
            Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.
          </Text>

          <Text style={styles.sectionTitle}>10. Contact Information</Text>
          <Text style={styles.paragraph}>
            Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.contactTitle}>Questions about our Terms?</Text>
          <Text style={styles.contactText}>Email: legal@earnscroll.com</Text>
          <Text style={styles.contactText}>Support: support@earnscroll.com</Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.fontFamily.uiBold,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 14,
    fontFamily: typography.fontFamily.ui,
    color: '#94A3B8',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.uiBold,
    color: '#22D3EE',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    fontFamily: typography.fontFamily.ui,
    color: '#94A3B8',
    lineHeight: 24,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 32,
  },
  contactTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.uiBold,
    color: '#22D3EE',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.ui,
    color: '#94A3B8',
    marginBottom: 6,
  },
});
