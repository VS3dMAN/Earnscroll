import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Platform, NativeModules } from 'react-native';
import { Zap, ChevronRight, Wrench, Code, Lock, Crown, FileText, Shield, Sun, Moon, Smartphone, ArrowLeft, User, LogOut, Trash2, Activity, Dumbbell, Timer } from 'lucide-react-native';
import { useTimeBank, FREE_LAUNCH_MODE } from '@/contexts/TimeBank';
import { useTheme } from '@/contexts/Theme';
import { useAuth } from '@/contexts/Auth';
import { useAnalytics } from '@/contexts/Analytics';
import { AnalyticsSettings } from '@/components/AnalyticsSettings';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type EarningOption = {
  label: string;
  value: number;
};

const EARNING_OPTIONS: EarningOption[] = [
  { label: '30 seconds', value: 0.5 },
  { label: '60 seconds', value: 1 },
  { label: '90 seconds', value: 1.5 },
  { label: '120 seconds', value: 2 },
];

export default function SettingsScreen() {
  const { earningRatios, updateEarningRatios, isDeveloperMode, enableDeveloperMode, isUserPro, userFreeExercise, updateFreeExercise } = useTimeBank();
  const { user, isGuest, isAuthenticated, signOut } = useAuth();
  const { trackEvent, trackScreenView } = useAnalytics();

  useEffect(() => {
    trackScreenView('settings');
    trackEvent('settings_opened');
  }, []);

  const themeContext = useTheme();
  const theme = themeContext?.theme ?? {
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    primary: '#3B82F6',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    isDark: false,
  };
  const themeMode = themeContext?.themeMode ?? 'system';
  const updateThemeMode = themeContext?.updateThemeMode ?? (() => {});
  const insets = useSafeAreaInsets();
  const scrollPaddingTop = insets.top + (Platform.OS === 'ios' ? 32 : Platform.OS === 'android' ? 24 : 20);
  const scrollPaddingBottom = insets.bottom + 120;
  const router = useRouter();
  const [tapCount, setTapCount] = useState<number>(0);
  const accentColor = '#22D3EE';
  const optionBaseBackground = theme.isDark ? 'rgba(255, 255, 255, 0.06)' : '#F4F5F6';
  const optionBaseBorderColor = theme.isDark ? '#1F2535' : 'transparent';
  const optionActiveBackground = theme.isDark ? 'rgba(34, 211, 238, 0.22)' : 'rgba(34, 211, 238, 0.12)';
  const optionActiveBorderColor = accentColor;
  const optionTextColor = theme.isDark ? theme.textSecondary : '#666';
  const ratioPillBackground = theme.isDark ? 'rgba(34, 211, 238, 0.2)' : 'rgba(34, 211, 238, 0.12)';
  const lockedOverlayShade = theme.isDark ? 'rgba(9, 15, 27, 0.75)' : 'rgba(255, 255, 255, 0.6)';

  const handleBack = () => {
    console.log('[Settings] Back pressed');
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  };

  const handleSquatRatioChange = (value: number) => {
    if (!isUserPro) {
      router.push('/go-pro');
      return;
    }
    updateEarningRatios({ squats: value });
  };

  const handlePushupRatioChange = (value: number) => {
    if (!isUserPro) {
      router.push('/go-pro');
      return;
    }
    updateEarningRatios({ pushups: value });
  };

  const handlePlankRatioChange = (value: number) => {
    if (!isUserPro) {
      router.push('/go-pro');
      return;
    }
    updateEarningRatios({ planks: value });
  };

  const getCurrentSquatLabel = () => {
    const option = EARNING_OPTIONS.find(opt => opt.value === earningRatios.squats);
    return option ? option.label : `${earningRatios.squats * 60} seconds`;
  };

  const getCurrentPushupLabel = () => {
    const option = EARNING_OPTIONS.find(opt => opt.value === earningRatios.pushups);
    return option ? option.label : `${earningRatios.pushups * 60} seconds`;
  };

  const getCurrentPlankLabel = () => {
    const option = EARNING_OPTIONS.find(opt => opt.value === earningRatios.planks);
    return option ? option.label : `${earningRatios.planks * 60} seconds`;
  };

  const handleVersionTap = () => {
    // REMOVABLE: Developer mode gate — remove this entire handleVersionTap to disable dev options in release
    if (FREE_LAUNCH_MODE) return; // Dev mode unreachable in launch builds
    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);

    if (newTapCount >= 7) {
      if (!isDeveloperMode) {
        enableDeveloperMode();
        Alert.alert('Developer Mode Enabled', 'You now have access to developer options!', [{ text: 'OK' }]);
      }
      setTapCount(0);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView 
          style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: scrollPaddingTop, paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ top: insets.top, bottom: insets.bottom }}
        testID="settings-scroll"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)' },
            ]}
            onPress={handleBack}
            activeOpacity={0.7}
            testID="settings-back-button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={20} color={theme.isDark ? '#CBD5F5' : '#1E293B'} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Customize your experience</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Moon size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>Choose your preferred theme</Text>

          <View style={styles.themeSelector}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: theme.card, borderColor: theme.border },
                themeMode === 'system' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => updateThemeMode('system')}
              activeOpacity={0.7}
            >
              <Smartphone size={18} color={themeMode === 'system' ? '#fff' : theme.textSecondary} />
              <Text style={[
                styles.themeOptionText,
                { color: themeMode === 'system' ? '#fff' : theme.textSecondary },
                themeMode === 'system' && styles.themeOptionTextActive,
              ]}>
                Auto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: theme.card, borderColor: theme.border },
                themeMode === 'light' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => updateThemeMode('light')}
              activeOpacity={0.7}
            >
              <Sun size={18} color={themeMode === 'light' ? '#fff' : theme.textSecondary} />
              <Text style={[
                styles.themeOptionText,
                { color: themeMode === 'light' ? '#fff' : theme.textSecondary },
                themeMode === 'light' && styles.themeOptionTextActive,
              ]}>
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: theme.card, borderColor: theme.border },
                themeMode === 'dark' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => updateThemeMode('dark')}
              activeOpacity={0.7}
            >
              <Moon size={18} color={themeMode === 'dark' ? '#fff' : theme.textSecondary} />
              <Text style={[
                styles.themeOptionText,
                { color: themeMode === 'dark' ? '#fff' : theme.textSecondary },
                themeMode === 'dark' && styles.themeOptionTextActive,
              ]}>
                Dark
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={accentColor} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
          </View>

          {isAuthenticated && !isGuest ? (
            <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.settingLabel, { color: theme.text, marginBottom: 4 }]}>
                {user?.email ?? user?.phone ?? 'Signed In'}
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary, marginBottom: 16 }]}>
                {user?.app_metadata?.provider === 'google'
                  ? 'Signed in with Google'
                  : user?.app_metadata?.provider === 'apple'
                  ? 'Signed in with Apple'
                  : user?.phone
                  ? 'Signed in with Phone'
                  : 'Signed in with Email'}
              </Text>
              <TouchableOpacity
                style={[styles.signOutButton, { borderColor: theme.danger }]}
                onPress={() => {
                  Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
                  ]);
                }}
                activeOpacity={0.7}
              >
                <LogOut size={16} color={theme.danger} />
                <Text style={[styles.signOutButtonText, { color: theme.danger }]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.settingLabel, { color: theme.text, marginBottom: 4 }]}>Guest Mode</Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary, marginBottom: 16 }]}>
                Create an account to unlock Pro features and sync your progress.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: accentColor }]}
                onPress={() => {
                  signOut();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>Create Account / Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Privacy & Data Section — only for authenticated non-guest users */}
        {isAuthenticated && !isGuest && (
          <AnalyticsSettings theme={theme} />
        )}

        {/* Free Exercise switcher — replaces the old "permanent choice" promise */}
        {!isUserPro && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Dumbbell size={20} color={accentColor} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Free Exercise</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
              Pick which exercise you use for free. Switch any time.
            </Text>
            <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
              <View style={[styles.themeSelector, { gap: 8 }]}>
                {([
                  { id: 'squats', label: 'Squats', Icon: Activity },
                  { id: 'pushups', label: 'Pushups', Icon: Dumbbell },
                  { id: 'planks', label: 'Planks', Icon: Timer },
                ] as const).map(({ id, label, Icon }) => {
                  const active = userFreeExercise === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[
                        styles.themeOption,
                        { backgroundColor: theme.background, borderColor: theme.border },
                        active && { backgroundColor: accentColor, borderColor: accentColor },
                      ]}
                      onPress={() => updateFreeExercise(id)}
                      activeOpacity={0.7}
                    >
                      <Icon size={18} color={active ? '#000' : theme.textSecondary} />
                      <Text style={[styles.themeOptionText, { color: active ? '#000' : theme.textSecondary }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* App Blocker (Android only) — manually re-trigger the disclosure */}
        {Platform.OS === 'android' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={20} color={accentColor} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>App Blocker</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
              Block distracting apps when your earned time runs out.
            </Text>
            <TouchableOpacity
              style={[styles.legalButton, { backgroundColor: theme.card, marginTop: 0 }]}
              onPress={() => router.push('/accessibility-disclosure')}
              activeOpacity={0.7}
              testID="settings-app-blocker-button"
            >
              <Shield size={18} color={theme.textSecondary} />
              <Text style={[styles.legalButtonText, { color: theme.textSecondary }]}>Enable or review permission</Text>
              <ChevronRight size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Delete Account — only for authenticated non-guest users */}
        {isAuthenticated && !isGuest && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Trash2 size={20} color={theme.danger} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Delete Account</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
              Permanently delete your account and all associated data.
            </Text>
            <TouchableOpacity
              style={[styles.legalButton, { backgroundColor: theme.card, marginTop: 0, borderWidth: 1, borderColor: theme.danger + '40' }]}
              onPress={() => router.push('/delete-account')}
              activeOpacity={0.7}
              testID="settings-delete-account-button"
            >
              <Trash2 size={18} color={theme.danger} />
              <Text style={[styles.legalButtonText, { color: theme.danger }]}>Delete account</Text>
              <ChevronRight size={16} color={theme.danger} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Zap size={20} color="#FFD700" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Earning Ratios</Text>
            {!isUserPro && (
              <TouchableOpacity
                style={styles.proUpgradeBadge}
                onPress={() => router.push('/go-pro')}
                activeOpacity={0.7}
              >
                <Crown size={14} color="#FFD700" />
                <Text style={styles.proUpgradeBadgeText}>Pro</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            {isUserPro 
              ? 'Set how much time you earn for each exercise' 
              : 'Free users earn: 60s per squat/pushup, 3min per 1min plank. Upgrade to Pro for custom ratios!'}
          </Text>

          <View style={[styles.settingCard, { backgroundColor: theme.card }, !isUserPro && styles.settingCardLocked]}>
            <View style={styles.settingHeader}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Squats</Text>
              <View style={[styles.currentValue, { backgroundColor: ratioPillBackground }]}>
                <Text style={[styles.currentValueText, { color: accentColor }]}>
                  {isUserPro ? getCurrentSquatLabel() : '60 seconds'}
                </Text>
                {!isUserPro && <Lock size={14} color="rgba(255, 215, 0, 0.6)" style={{ marginLeft: 6 }} />}
              </View>
            </View>
            
            <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>Time earned per squat completed</Text>

            <View style={styles.optionsContainer}>
              {EARNING_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    { backgroundColor: optionBaseBackground, borderColor: optionBaseBorderColor },
                    earningRatios.squats === option.value && isUserPro && {
                      backgroundColor: optionActiveBackground,
                      borderColor: optionActiveBorderColor,
                    },
                  ]}
                  onPress={() => handleSquatRatioChange(option.value)}
                  disabled={!isUserPro}
                >
                  <Text style={[
                    styles.optionText,
                    { color: optionTextColor },
                    earningRatios.squats === option.value && isUserPro && styles.optionTextActive,
                  ]}>
                    {option.label}
                  </Text>
                  {earningRatios.squats === option.value && isUserPro && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {!isUserPro && (
              <View style={[styles.lockedOptionsOverlay, { backgroundColor: lockedOverlayShade }]}>
                <View style={styles.lockedOptionsContent}>
                  <Lock size={32} color="#FFD700" />
                  <View style={styles.proBadgeSmall}>
                    <Crown size={12} color="#FFD700" />
                    <Text style={styles.proBadgeSmallText}>Pro</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={[styles.settingCard, { backgroundColor: theme.card }, !isUserPro && styles.settingCardLocked]}>
            <View style={styles.settingHeader}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Pushups</Text>
              <View style={[styles.currentValue, { backgroundColor: ratioPillBackground }]}>
                <Text style={[styles.currentValueText, { color: accentColor }]}>
                  {isUserPro ? getCurrentPushupLabel() : '60 seconds'}
                </Text>
                {!isUserPro && <Lock size={14} color="rgba(255, 215, 0, 0.6)" style={{ marginLeft: 6 }} />}
              </View>
            </View>
            
            <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>Time earned per pushup completed</Text>

            <View style={styles.optionsContainer}>
              {EARNING_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    { backgroundColor: optionBaseBackground, borderColor: optionBaseBorderColor },
                    earningRatios.pushups === option.value && isUserPro && {
                      backgroundColor: optionActiveBackground,
                      borderColor: optionActiveBorderColor,
                    },
                  ]}
                  onPress={() => handlePushupRatioChange(option.value)}
                  disabled={!isUserPro}
                >
                  <Text style={[
                    styles.optionText,
                    { color: optionTextColor },
                    earningRatios.pushups === option.value && isUserPro && styles.optionTextActive,
                  ]}>
                    {option.label}
                  </Text>
                  {earningRatios.pushups === option.value && isUserPro && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {!isUserPro && (
              <View style={[styles.lockedOptionsOverlay, { backgroundColor: lockedOverlayShade }]}>
                <View style={styles.lockedOptionsContent}>
                  <Lock size={32} color="#FFD700" />
                  <View style={styles.proBadgeSmall}>
                    <Crown size={12} color="#FFD700" />
                    <Text style={styles.proBadgeSmallText}>Pro</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={[styles.settingCard, { backgroundColor: theme.card }, !isUserPro && styles.settingCardLocked]}>
            <View style={styles.settingHeader}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Planks</Text>
              <View style={[styles.currentValue, { backgroundColor: ratioPillBackground }]}>
                <Text style={[styles.currentValueText, { color: accentColor }]}>
                  {isUserPro ? getCurrentPlankLabel() : '3:1 ratio'}
                </Text>
                {!isUserPro && <Lock size={14} color="rgba(255, 215, 0, 0.6)" style={{ marginLeft: 6 }} />}
              </View>
            </View>
            
            <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>Time earned per minute of planking</Text>

            <View style={styles.optionsContainer}>
              {EARNING_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    { backgroundColor: optionBaseBackground, borderColor: optionBaseBorderColor },
                    earningRatios.planks === option.value && isUserPro && {
                      backgroundColor: optionActiveBackground,
                      borderColor: optionActiveBorderColor,
                    },
                  ]}
                  onPress={() => handlePlankRatioChange(option.value)}
                  disabled={!isUserPro}
                >
                  <Text style={[
                    styles.optionText,
                    { color: optionTextColor },
                    earningRatios.planks === option.value && isUserPro && styles.optionTextActive,
                  ]}>
                    {option.label}
                  </Text>
                  {earningRatios.planks === option.value && isUserPro && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {!isUserPro && (
              <View style={[styles.lockedOptionsOverlay, { backgroundColor: lockedOverlayShade }]}>
                <View style={styles.lockedOptionsContent}>
                  <Lock size={32} color="#FFD700" />
                  <View style={styles.proBadgeSmall}>
                    <Crown size={12} color="#FFD700" />
                    <Text style={styles.proBadgeSmallText}>Pro</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>How it works</Text>
          <Text style={[styles.infoText, { color: theme.isDark ? '#CBD5E1' : theme.textSecondary }]}>
            Your earning ratio determines how much screen time you get for each exercise. 
            {!isUserPro && ' Free users have fixed rates. Upgrade to Pro for custom ratios!'}
          </Text>
          <Text style={[styles.infoText, { marginTop: 12, color: theme.isDark ? '#94A3B8' : theme.textSecondary }]}>
            <Text style={styles.infoBold}>Squats:</Text> 1 rep = {isUserPro ? getCurrentSquatLabel() : '60 seconds'}
          </Text>
          <Text style={[styles.infoText, { marginTop: 8, color: theme.isDark ? '#94A3B8' : theme.textSecondary }]}>
            <Text style={styles.infoBold}>Pushups:</Text> 1 rep = {isUserPro ? getCurrentPushupLabel() : '60 seconds'}
          </Text>
          <Text style={[styles.infoText, { marginTop: 8, color: theme.isDark ? '#94A3B8' : theme.textSecondary }]}>
            <Text style={styles.infoBold}>Planks:</Text> 1 min = {isUserPro ? getCurrentPlankLabel() : '3 minutes (3:1)'}
          </Text>
          {!isUserPro && (
            <TouchableOpacity
              style={styles.upgradeProButton}
              onPress={() => router.push('/go-pro')}
              activeOpacity={0.7}
            >
              <Crown size={16} color="#000" />
              <Text style={styles.upgradeProButtonText}>Unlock Custom Ratios with Pro</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* REMOVABLE: Developer options section — change condition back to: __DEV__ && isDeveloperMode */}
        {isDeveloperMode && (
          <View style={styles.devSection}>
            <View style={styles.sectionHeader}>
              <Code size={20} color="#00D9FF" />
              <Text style={styles.sectionTitle}>Developer Options</Text>
            </View>

            <TouchableOpacity
              style={styles.devOptionsButton}
              onPress={() => router.push('/developer-menu')}
            >
              <Wrench size={20} color="#00D9FF" />
              <Text style={styles.devOptionsButtonText}>Open Developer Menu</Text>
              <ChevronRight size={16} color="#ccc" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.legalSection}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.legalSectionTitle}>Legal</Text>
          </View>

          <TouchableOpacity
            style={[styles.legalButton, { backgroundColor: theme.card }]}
            onPress={() => router.push('/privacy-policy')}
            activeOpacity={0.7}
          >
            <FileText size={18} color={theme.textSecondary} />
            <Text style={[styles.legalButtonText, { color: theme.textSecondary }]}>Privacy Policy</Text>
            <ChevronRight size={16} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.legalButton, { backgroundColor: theme.card }]}
            onPress={() => router.push('/terms-of-service')}
            activeOpacity={0.7}
          >
            <FileText size={18} color={theme.textSecondary} />
            <Text style={[styles.legalButtonText, { color: theme.textSecondary }]}>Terms of Service</Text>
            <ChevronRight size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.versionContainer}
          onPress={handleVersionTap}
          activeOpacity={0.7}
        >
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 18,
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#1a1a1a',
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginBottom: 16,
  },
  settingCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  settingCardLocked: {
    position: 'relative',
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  currentValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#49cbeb20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currentValueText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#49cbeb',
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f4f5f6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    backgroundColor: '#49cbeb20',
    borderColor: '#49cbeb',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#666',
  },
  optionTextActive: {
    color: '#49cbeb',
    fontFamily: 'Inter_700Bold',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#49cbeb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  infoCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  infoBold: {
    fontFamily: 'Inter_700Bold',
    color: '#49cbeb',
  },
  proUpgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginLeft: 'auto',
  },
  proUpgradeBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#FFD700',
  },
  lockedOptionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedOptionsContent: {
    alignItems: 'center',
    gap: 12,
  },
  proBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  proBadgeSmallText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#FFD700',
  },
  upgradeProButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  upgradeProButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#000',
  },
  devSection: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 24,
  },
  devWarning: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFA500',
    marginBottom: 16,
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    gap: 12,
  },
  devButtonDanger: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  devButtonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#1a1a1a',
  },
  devButtonTextDanger: {
    color: '#FF6B6B',
  },
  devInfoCard: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  devInfoTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#FFA500',
    marginBottom: 12,
  },
  devInfoText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  devOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
    gap: 12,
  },
  devOptionsButtonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#00D9FF',
  },
  legalSection: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 24,
  },
  legalSectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#999',
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    gap: 12,
  },
  legalButtonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#999',
  },
  themeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  themeOptionText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  themeOptionTextActive: {
    fontFamily: 'Inter_700Bold',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 44,
    gap: 8,
  },
  signOutButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  primaryButton: {
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
