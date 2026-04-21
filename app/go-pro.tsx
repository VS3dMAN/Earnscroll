import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Dumbbell, TrendingUp, Calendar, Settings as SettingsIcon, X, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTimeBank, FREE_LAUNCH_MODE } from '@/contexts/TimeBank';
import { useAuth } from '@/contexts/Auth';
import { cloudyGrey, industrialBackground, industrialCard } from '@/constants/colors';
import { purchaseProduct, type ProductId } from '@/services/billing';

const CLOUDY_GREY_RGB = '224, 229, 238';
const cloudyGreyOpacity = (alpha: number): string => `rgba(${CLOUDY_GREY_RGB}, ${alpha})`;
const CLOUDY_GREY_70 = cloudyGreyOpacity(0.7);
const CLOUDY_GREY_60 = cloudyGreyOpacity(0.6);
const CLOUDY_GREY_45 = cloudyGreyOpacity(0.45);
const CLOUDY_GREY_15 = cloudyGreyOpacity(0.15);

export default function GoProScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDeveloperMode } = useTimeBank();
  const { isGuest, isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = React.useState<'monthly' | 'annual' | 'lifetime'>('annual');
  const isAnnualSelected = selectedPlan === 'annual';

  React.useEffect(() => {
    if (FREE_LAUNCH_MODE) {
      router.back();
    }
  }, [router]);

  if (FREE_LAUNCH_MODE) return null;

  // Guest users cannot go Pro (unless developer mode is on)
  const canGoPro = (isAuthenticated && !isGuest) || isDeveloperMode;

  const handlePlanPurchase = async (productId: ProductId) => {
    console.log(`[GO PRO] User selected product: ${productId}`);
    try {
      await purchaseProduct(productId);
      // On success the billing module / receipt validator will flip isUserPro.
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Purchase failed.';
      Alert.alert('Purchase unavailable', message);
    }
  };

  const proFeatures = [
    {
      icon: Dumbbell,
      title: 'All Exercises',
      description: 'Unlock squats, pushups, and planks',
      color: '#FF6B35',
    },
    {
      icon: SettingsIcon,
      title: 'Custom Ratios',
      description: 'Set your own earning rates for each exercise',
      color: '#00D9FF',
    },
    {
      icon: Calendar,
      title: 'Full Workout Calendar',
      description: 'Track your complete workout history',
      color: '#4CAF50',
    },
    {
      icon: TrendingUp,
      title: 'All-Time Stats',
      description: 'View comprehensive performance analytics',
      color: '#FFD700',
    },
  ];

  if (!canGoPro) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
          <TouchableOpacity
            style={[styles.closeButton, { position: 'absolute', top: insets.top + 20, right: 20 }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <X size={28} color={cloudyGrey} />
          </TouchableOpacity>

          <View style={styles.crownContainer}>
            <Crown size={64} color="#FFD700" fill="#FFD700" />
          </View>
          <Text style={[styles.title, { fontSize: 24 }]}>Account Required</Text>
          <Text style={[styles.subtitle, { marginBottom: 24 }]}>
            Create an account or sign in to unlock EarnScroll Pro and access all premium features.
          </Text>
          <TouchableOpacity
            style={styles.guestSignInButton}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.guestSignInButtonText}>Create Account / Sign In</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <X size={28} color={cloudyGrey} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <View style={styles.crownContainer}>
              <Crown size={64} color="#FFD700" fill="#FFD700" />
            </View>
            <Text style={styles.title}>Unlock EarnScroll Pro</Text>
            <Text style={styles.subtitle}>
              Get full access to all features and supercharge your workouts
            </Text>
          </View>

          <View style={styles.featuresSection}>
            {proFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <View key={index} style={styles.featureCard}>
                  <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}20` }]}>
                    <Icon size={32} color={feature.color} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                  <View style={styles.featureCheck}>
                    <Check size={20} color="#4CAF50" />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.comparisonCard}>
            <Text style={styles.comparisonTitle}>Free vs. Pro</Text>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Exercises</Text>
              <View style={styles.comparisonValues}>
                <Text style={styles.comparisonFree}>1</Text>
                <Text style={styles.comparisonPro}>All 3</Text>
              </View>
            </View>

            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Custom Ratios</Text>
              <View style={styles.comparisonValues}>
                <Text style={styles.comparisonFree}>×</Text>
                <Text style={styles.comparisonPro}>✓</Text>
              </View>
            </View>

            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Workout Calendar</Text>
              <View style={styles.comparisonValues}>
                <Text style={styles.comparisonFree}>×</Text>
                <Text style={styles.comparisonPro}>✓</Text>
              </View>
            </View>

            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>All-Time Stats</Text>
              <View style={styles.comparisonValues}>
                <Text style={styles.comparisonFree}>×</Text>
                <Text style={styles.comparisonPro}>✓</Text>
              </View>
            </View>

            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Time Bank & Streak</Text>
              <View style={styles.comparisonValues}>
                <Text style={styles.comparisonPro}>✓</Text>
                <Text style={styles.comparisonPro}>✓</Text>
              </View>
            </View>
          </View>

          <View style={styles.plansSection}>
            <Text style={styles.plansTitle}>Choose Your Plan</Text>
            
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.selectedCard,
              ]}
              onPress={() => {
                setSelectedPlan('monthly');
                handlePlanPurchase('pro_monthly');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.planName}>Monthly Plan</Text>
              <Text style={styles.planPrice}>₹99 for your first month</Text>
              <Text style={styles.planSubtext}>Then ₹199/month. Cancel anytime.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.planCardWrapper}
              onPress={() => {
                setSelectedPlan('annual');
                handlePlanPurchase('pro_annual');
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#22D3EE', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradientBorder, isAnnualSelected && styles.gradientGlow]}
              >
                <View style={[styles.planCard, styles.annualCard]}>
                  <View style={styles.planBadgeContainer}>
                    <LinearGradient
                      colors={['#7CFFEA', '#3B82F6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.planBadgeGradient}
                    >
                      <Text style={styles.planBadgeText}>BEST VALUE</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.planName}>Annual Plan</Text>
                  <Text style={styles.planPrice}>₹1,299 / year</Text>
                  <Text style={styles.planSubtext}>Just ₹108.25/month</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'lifetime' && styles.selectedCard,
              ]}
              onPress={() => {
                setSelectedPlan('lifetime');
                handlePlanPurchase('pro_lifetime');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.planName}>Lifetime Access</Text>
              <Text style={styles.planPrice}>₹3,499 one-time</Text>
              <Text style={styles.planSubtext}>Pay once, get Pro forever.</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            Subscriptions are processed and managed via Google Play.
          </Text>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: industrialBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CLOUDY_GREY_15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  crownContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  title: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: CLOUDY_GREY_70,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: 32,
    gap: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cloudyGreyOpacity(0.08),
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: CLOUDY_GREY_15,
    gap: 16,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: cloudyGrey,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: CLOUDY_GREY_70,
    lineHeight: 20,
  },
  featureCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comparisonCard: {
    backgroundColor: 'rgba(0, 217, 255, 0.08)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
    marginBottom: 32,
  },
  comparisonTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#00D9FF',
    marginBottom: 20,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: CLOUDY_GREY_15,
  },
  comparisonLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: CLOUDY_GREY_70,
    flex: 1,
  },
  comparisonValues: {
    flexDirection: 'row',
    gap: 32,
    minWidth: 100,
    justifyContent: 'flex-end',
  },
  comparisonFree: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: CLOUDY_GREY_60,
    width: 40,
    textAlign: 'center',
  },
  comparisonPro: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#FFD700',
    width: 40,
    textAlign: 'center',
  },
  plansSection: {
    marginBottom: 32,
    gap: 16,
  },
  plansTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  planCard: {
    backgroundColor: industrialCard,
    borderRadius: 24,
    padding: 24,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative' as const,
    opacity: 0.85,
  },
  selectedCard: {
    borderColor: '#22D3EE',
    opacity: 1,
  },
  planCardWrapper: {
    borderRadius: 26,
  },
  gradientBorder: {
    borderRadius: 26,
    padding: 2,
  },
  gradientGlow: {
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  annualCard: {
    borderWidth: 0,
    backgroundColor: '#050A1A',
    opacity: 1,
  },
  planBadgeContainer: {
    position: 'absolute' as const,
    top: -12,
    right: 16,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  planBadgeGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  planBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#03141F',
    letterSpacing: 1,
  },
  planName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: cloudyGrey,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 26,
    fontFamily: 'SpaceMono_700Bold',
    color: '#22D3EE',
    marginBottom: 6,
    lineHeight: 34,
    flexWrap: 'wrap' as const,
  },
  planSubtext: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: CLOUDY_GREY_45,
    textAlign: 'center',
    fontStyle: 'italic' as const,
  },
  guestSignInButton: {
    backgroundColor: '#22D3EE',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  guestSignInButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#000',
  },
});
